const express = require('express');
const http = require('http');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

// Load environment variables
dotenv.config();

const { connectDB } = require('./config/db');
const { seedInitialData } = require('./utils/seedData');

// Route imports
const authRoutes = require('./routes/authRoutes');
const itemRoutes = require('./routes/itemRoutes');
const claimRoutes = require('./routes/claimRoutes');
const chatRoutes = require('./routes/chatRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const campusRoutes = require('./routes/campusRoutes');
const rewardRoutes = require('./routes/rewardRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();
const server = http.createServer(app);

// Setup Socket.IO
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

// Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: false // Allows serving local uploaded images to client
  })
);

app.use(
  cors({
    origin: '*',
    credentials: true
  })
);

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Rate Limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests from this IP, please try again later.' }
});
app.use('/api', apiLimiter);

// Serve uploads directory statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Attach io to req object for controllers to trigger real-time updates
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/claims', claimRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/campus', campusRoutes);
app.use('/api/rewards', rewardRoutes);
app.use('/api/admin', adminRoutes);

// Root health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    platform: 'CampusFind API Server',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// System Database Reset Endpoint (wipes all demo records for fresh start)
app.all('/api/system/reset-demo', async (req, res) => {
  try {
    const Item = require('./models/Item');
    const Claim = require('./models/Claim');
    const Message = require('./models/Message');
    const Conversation = require('./models/Conversation');
    const Notification = require('./models/Notification');
    const Reward = require('./models/Reward');
    const User = require('./models/User');

    const deletedItems = await Item.deleteMany({});
    const deletedClaims = await Claim.deleteMany({});
    const deletedMessages = await Message.deleteMany({});
    const deletedConversations = await Conversation.deleteMany({});
    const deletedNotifications = await Notification.deleteMany({});
    const deletedRewards = await Reward.deleteMany({});

    await User.updateMany({}, { itemsReportedCount: 0, itemsReturnedCount: 0, rewardPoints: 0 });

    if (req.query.wipeUsers === 'true') {
      await User.deleteMany({});
    }

    console.log('[System] Demo records cleared successfully.');

    res.status(200).json({
      success: true,
      message: 'All demo items, claims, messages, rewards, and notifications have been permanently cleared!',
      deletedCounts: {
        items: deletedItems.deletedCount,
        claims: deletedClaims.deletedCount,
        messages: deletedMessages.deletedCount,
        conversations: deletedConversations.deletedCount,
        notifications: deletedNotifications.deletedCount,
        rewards: deletedRewards.deletedCount
      },
      remaining: {
        items: await Item.countDocuments(),
        claims: await Claim.countDocuments(),
        users: await User.countDocuments()
      }
    });
  } catch (err) {
    console.error('Error resetting demo database:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Serve frontend in production if built inside client/dist
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/dist', 'index.html'));
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Socket.io Real-time Event Management
io.on('connection', (socket) => {
  console.log(`[Socket.io] Client connected: ${socket.id}`);

  // User joins their personal room for direct notifications
  socket.on('join_user_room', (userId) => {
    if (userId) {
      socket.join(userId);
      console.log(`[Socket.io] User ${userId} joined personal room`);
    }
  });

  // User joins a specific conversation channel
  socket.on('join_conversation', (conversationId) => {
    if (conversationId) {
      socket.join(conversationId);
      console.log(`[Socket.io] Socket ${socket.id} joined conversation ${conversationId}`);
    }
  });

  // Client leaves conversation channel
  socket.on('leave_conversation', (conversationId) => {
    if (conversationId) {
      socket.leave(conversationId);
    }
  });

  // Real-time message relay
  socket.on('send_chat_message', (data) => {
    if (data && data.conversationId) {
      socket.to(data.conversationId).emit('receive_chat_message', data);
    }
  });

  // Real-time notification relay
  socket.on('send_notification', (data) => {
    if (data && data.recipientId) {
      io.to(data.recipientId).emit('new_notification', data);
    }
  });

  socket.on('disconnect', () => {
    console.log(`[Socket.io] Client disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;

// Initialize Database & Start Server
const startServer = async () => {
  try {
    await connectDB();
    await seedInitialData();

    server.listen(PORT, () => {
      console.log(`===============================================`);
      console.log(` CampusFind Server running on port ${PORT}`);
      console.log(` Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(` API Endpoint: http://localhost:${PORT}/api`);
      console.log(` Health Check: http://localhost:${PORT}/api/health`);
      console.log(`===============================================`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

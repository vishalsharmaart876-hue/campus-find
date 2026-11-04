const mongoose = require('mongoose');

let mongoServer = null;

const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  // 1. Try connecting to configured MongoDB URI (e.g. MongoDB Atlas or custom string)
  if (uri && uri.trim() !== '') {
    try {
      const conn = await mongoose.connect(uri.trim(), {
        serverSelectionTimeoutMS: 6000
      });
      console.log(`[Database] Connected to Persistent MongoDB: ${conn.connection.host} / ${conn.connection.name}`);
      return conn;
    } catch (err) {
      console.warn(`[Database] Remote MongoDB connection failed (${err.message}). Checking local MongoDB...`);
    }
  }

  // 2. Try connecting to default local MongoDB instance (if user installed MongoDB locally)
  try {
    const localUri = 'mongodb://127.0.0.1:27017/campusfind';
    const conn = await mongoose.connect(localUri, {
      serverSelectionTimeoutMS: 1500
    });
    console.log(`[Database] Connected to Local Persistent MongoDB: ${conn.connection.host} / ${conn.connection.name}`);
    return conn;
  } catch (localErr) {
    // Local MongoDB is not running on 27017, proceed to in-memory fallback
  }

  // 3. Fallback to automated in-memory MongoDB Server for zero-friction development
  try {
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongoServer = await MongoMemoryServer.create();
    const memoryUri = mongoServer.getUri();

    const conn = await mongoose.connect(memoryUri);
    console.log(`[Database] In-Memory MongoDB running at: ${memoryUri}`);
    console.log(`[Database] Tip: To persist user logins and accounts permanently across restarts, set MONGODB_URI in server/.env`);
    return conn;
  } catch (memoryErr) {
    console.error(`[Database] Critical error initializing database: ${memoryErr.message}`);
    throw memoryErr;
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongoServer) {
    await mongoServer.stop();
  }
};

module.exports = { connectDB, disconnectDB };

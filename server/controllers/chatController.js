const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const Notification = require('../models/Notification');

// @desc    Get or create a conversation between current user and item reporter/claimant
// @route   POST /api/chat/conversations
// @access  Private
exports.getOrCreateConversation = async (req, res) => {
  try {
    const { recipientId, itemId } = req.body;

    if (!recipientId) {
      return res.status(400).json({ success: false, message: 'Recipient ID is required' });
    }

    if (recipientId === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot message yourself' });
    }

    // Find existing conversation with these 2 participants and optional item
    let conversation = await Conversation.findOne({
      participants: { $all: [req.user.id, recipientId] },
      ...(itemId ? { item: itemId } : {})
    })
      .populate('participants', 'name email avatar role department')
      .populate('item', 'title category images status');

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [req.user.id, recipientId],
        item: itemId || null,
        lastMessage: 'Conversation started',
        lastMessageAt: new Date()
      });

      conversation = await Conversation.findById(conversation._id)
        .populate('participants', 'name email avatar role department')
        .populate('item', 'title category images status');
    }

    return res.status(200).json({ success: true, conversation });
  } catch (err) {
    console.error('Get/Create conversation error:', err);
    return res.status(500).json({ success: false, message: 'Error initiating conversation' });
  }
};

// @desc    Get all conversations for logged in user
// @route   GET /api/chat/conversations
// @access  Private
exports.getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user.id
    })
      .populate('participants', 'name email avatar role department')
      .populate('item', 'title category images status')
      .sort({ lastMessageAt: -1 });

    return res.status(200).json({ success: true, count: conversations.length, conversations });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error retrieving conversations' });
  }
};

// @desc    Get messages for a conversation
// @route   GET /api/chat/conversations/:id/messages
// @access  Private
exports.getMessages = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    if (!conversation.participants.some((p) => p.toString() === req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to view these messages' });
    }

    const messages = await Message.find({ conversation: req.params.id })
      .populate('sender', 'name avatar')
      .sort({ createdAt: 1 });

    // Mark messages as read
    await Message.updateMany(
      { conversation: req.params.id, sender: { $ne: req.user.id }, read: false },
      { read: true }
    );

    return res.status(200).json({ success: true, count: messages.length, messages });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error fetching messages' });
  }
};

// @desc    Send a message in a conversation
// @route   POST /api/chat/conversations/:id/messages
// @access  Private
exports.sendMessage = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: 'Message text cannot be empty' });
    }

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    if (!conversation.participants.some((p) => p.toString() === req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not authorized to send messages in this conversation' });
    }

    if (conversation.blockedBy && conversation.blockedBy.length > 0) {
      return res.status(403).json({ success: false, message: 'This conversation has been blocked' });
    }

    const message = await Message.create({
      conversation: req.params.id,
      sender: req.user.id,
      text: text.trim()
    });

    conversation.lastMessage = text.trim();
    conversation.lastMessageAt = new Date();
    await conversation.save();

    const populatedMessage = await Message.findById(message._id).populate('sender', 'name avatar');

    // Notify other participant
    const otherParticipantId = conversation.participants.find(
      (p) => p.toString() !== req.user.id
    );

    if (otherParticipantId) {
      await Notification.create({
        recipient: otherParticipantId,
        title: `Message from ${req.user.name}`,
        message: text.length > 50 ? text.substring(0, 47) + '...' : text,
        type: 'message_received',
        relatedItem: conversation.item
      });
    }

    // Socket.io emit if req.io is attached
    if (req.io) {
      req.io.to(req.params.id).emit('new_message', populatedMessage);
      req.io.to(otherParticipantId.toString()).emit('conversation_updated', {
        conversationId: conversation._id,
        lastMessage: conversation.lastMessage,
        lastMessageAt: conversation.lastMessageAt
      });
    }

    return res.status(201).json({ success: true, message: populatedMessage });
  } catch (err) {
    console.error('Send message error:', err);
    return res.status(500).json({ success: false, message: 'Error sending message' });
  }
};

// @desc    Block or unblock a conversation
// @route   PUT /api/chat/conversations/:id/block
// @access  Private
exports.toggleBlock = async (req, res) => {
  try {
    const conversation = await Conversation.findById(req.params.id);
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    const isBlocked = conversation.blockedBy.some((p) => p.toString() === req.user.id);

    if (isBlocked) {
      conversation.blockedBy = conversation.blockedBy.filter(
        (p) => p.toString() !== req.user.id
      );
    } else {
      conversation.blockedBy.push(req.user.id);
    }

    await conversation.save();

    return res.status(200).json({
      success: true,
      message: isBlocked ? 'Conversation unblocked' : 'Conversation blocked successfully',
      isBlocked: !isBlocked
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error blocking conversation' });
  }
};

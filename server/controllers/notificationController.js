const Notification = require('../models/Notification');

// @desc    Get logged in user notifications
// @route   GET /api/notifications
// @access  Private
exports.getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .populate('relatedItem', 'title category images status type')
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({
      recipient: req.user.id,
      isRead: false
    });

    return res.status(200).json({
      success: true,
      unreadCount,
      notifications
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error loading notifications' });
  }
};

// @desc    Mark single notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
exports.markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipient: req.user.id },
      { isRead: true },
      { new: true }
    );
    return res.status(200).json({ success: true, notification });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error marking notification read' });
  }
};

// @desc    Mark all notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
exports.markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany({ recipient: req.user.id, isRead: false }, { isRead: true });
    return res.status(200).json({ success: true, message: 'All notifications marked as read' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error marking all read' });
  }
};

const notificationService = require('../services/notificationService');

// @desc    Get real-time email & WhatsApp dispatch log for verification
// @route   GET /api/notifications/dispatch-log
// @access  Private
exports.getDispatchLog = async (req, res) => {
  try {
    const logs = notificationService.getDispatchLog();
    return res.status(200).json({ success: true, count: logs.length, logs });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error retrieving dispatch logs' });
  }
};


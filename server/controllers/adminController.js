const User = require('../models/User');
const Item = require('../models/Item');
const Claim = require('../models/Claim');
const Reward = require('../models/Reward');
const LoginLog = require('../models/LoginLog');

// @desc    Get Admin Dashboard KPI metrics, user activity, and login analytics
// @route   GET /api/admin/stats
// @access  Private (Admin only)
exports.getDashboardStats = async (req, res) => {
  try {
    const activeThreshold = new Date(Date.now() - 30 * 60 * 1000); // Active in last 30 minutes
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      activeUsersCount,
      studentCount,
      facultyCount,
      adminCount,
      totalLoginsCount,
      todayLoginsCount,
      totalLost,
      totalFound,
      recoveredItems,
      pendingClaims,
      activeReports,
      flaggedItems,
      recentLoginLogs
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ lastLoginAt: { $gte: activeThreshold } }),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'faculty' }),
      User.countDocuments({ role: 'admin' }),
      LoginLog.countDocuments({ action: 'login' }),
      LoginLog.countDocuments({ action: 'login', timestamp: { $gte: todayStart } }),
      Item.countDocuments({ type: 'lost' }),
      Item.countDocuments({ type: 'found' }),
      Item.countDocuments({ status: 'returned' }),
      Claim.countDocuments({ status: 'pending' }),
      Item.countDocuments({ status: 'active' }),
      Item.countDocuments({ isFlagged: true }),
      LoginLog.find().sort({ timestamp: -1 }).limit(10)
    ]);

    // Active users is at least 1 since admin is currently accessing dashboard
    const activeUsers = Math.max(activeUsersCount, 1);

    // Calculate recovery rate
    const totalReports = totalLost + totalFound;
    const recoveryRate = totalReports > 0 ? Math.round((recoveredItems / totalReports) * 100) : 0;

    // Category distribution
    const categoryStats = await Item.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Top locations distribution
    const locationStats = await Item.aggregate([
      { $group: { _id: '$campusBuilding', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 6 }
    ]);

    // Recent 5 claims requiring action
    const recentPendingClaims = await Claim.find({ status: 'pending' })
      .populate('item', 'title category images locationName')
      .populate('claimant', 'name email department rollNumber')
      .sort({ createdAt: -1 })
      .limit(5);

    // Recent 5 reported items
    const recentItems = await Item.find()
      .populate('reportedBy', 'name email role')
      .sort({ createdAt: -1 })
      .limit(5);

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        activeUsers,
        studentCount,
        facultyCount,
        adminCount,
        totalLoginsCount,
        todayLoginsCount,
        totalLost,
        totalFound,
        totalReports,
        recoveredItems,
        pendingClaims,
        activeReports,
        flaggedItems,
        recoveryRate
      },
      categoryStats,
      locationStats,
      recentPendingClaims,
      recentItems,
      recentLoginLogs
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    return res.status(500).json({ success: false, message: 'Error retrieving analytics metrics' });
  }
};

// @desc    Get all users with search, role filter, status filter, sorting
// @route   GET /api/admin/users
// @access  Private (Admin only)
exports.getUsers = async (req, res) => {
  try {
    const { search, role, status, sortBy = 'newest', page = 1, limit = 20 } = req.query;
    const query = {};

    if (role && role !== 'all') {
      query.role = role;
    }

    if (status === 'active') {
      query.isBanned = false;
    } else if (status === 'suspended') {
      query.isBanned = true;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } }
      ];
    }

    let sortOptions = { createdAt: -1 };
    if (sortBy === 'oldest') sortOptions = { createdAt: 1 };
    if (sortBy === 'name') sortOptions = { name: 1 };
    if (sortBy === 'lastLogin') sortOptions = { lastLoginAt: -1 };
    if (sortBy === 'points') sortOptions = { rewardPoints: -1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    // Explicitly exclude passwords, hashes, and reset tokens
    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password -resetPasswordToken -resetPasswordExpires -verificationToken')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      User.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      count: users.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)) || 1,
      currentPage: parseInt(page),
      users
    });
  } catch (err) {
    console.error('Error fetching users:', err);
    return res.status(500).json({ success: false, message: 'Error retrieving users' });
  }
};

// @desc    Get paginated login and logout activity logs from login_logs collection
// @route   GET /api/admin/login-logs
// @access  Private (Admin only)
exports.getLoginLogs = async (req, res) => {
  try {
    const { action, search, page = 1, limit = 25 } = req.query;
    const query = {};

    if (action && action !== 'all') {
      query.action = action;
    }

    if (search) {
      query.$or = [
        { userName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { ip: { $regex: search, $options: 'i' } },
        { device: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [logs, total, totalLogins, totalLogouts] = await Promise.all([
      LoginLog.find(query).sort({ timestamp: -1 }).skip(skip).limit(parseInt(limit)),
      LoginLog.countDocuments(query),
      LoginLog.countDocuments({ action: 'login' }),
      LoginLog.countDocuments({ action: 'logout' })
    ]);

    return res.status(200).json({
      success: true,
      count: logs.length,
      total,
      totalLogins,
      totalLogouts,
      totalPages: Math.ceil(total / parseInt(limit)) || 1,
      currentPage: parseInt(page),
      logs
    });
  } catch (err) {
    console.error('Error fetching login logs:', err);
    return res.status(500).json({ success: false, message: 'Error retrieving login logs' });
  }
};


// @desc    Update user status / role (Admin only)
// @route   PUT /api/admin/users/:id
// @access  Private (Admin only)
exports.updateUser = async (req, res) => {
  try {
    const { role, isBanned } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (role) user.role = role;
    if (isBanned !== undefined) user.isBanned = isBanned;

    await user.save();
    return res.status(200).json({ success: true, message: 'User updated successfully', user });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error updating user' });
  }
};

// @desc    Get all reports with moderation filters
// @route   GET /api/admin/reports
// @access  Private (Admin only)
exports.getReports = async (req, res) => {
  try {
    const { type, status, flaggedOnly, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (type && type !== 'all') query.type = type;
    if (status && status !== 'all') query.status = status;
    if (flaggedOnly === 'true') query.isFlagged = true;

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { locationName: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [reports, total] = await Promise.all([
      Item.find(query)
        .populate('reportedBy', 'name email department role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Item.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      count: reports.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      reports
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error retrieving reports' });
  }
};

// @desc    Moderate report (flag, unflag, archive, delete, resolve)
// @route   PUT /api/admin/reports/:id/moderate
// @access  Private (Admin only)
exports.moderateReport = async (req, res) => {
  try {
    const { action, flagReason, status } = req.body;
    const item = await Item.findById(req.params.id);

    if (!item) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    if (action === 'delete') {
      await Item.findByIdAndDelete(req.params.id);
      return res.status(200).json({ success: true, message: 'Report deleted permanently' });
    }

    if (action === 'flag') {
      item.isFlagged = true;
      item.flagReason = flagReason || 'Flagged by administrator for investigation';
    } else if (action === 'unflag') {
      item.isFlagged = false;
      item.flagReason = '';
    } else if (action === 'archive') {
      item.status = 'archived';
    } else if (action === 'resolve') {
      item.status = 'returned';
      item.recoveredAt = new Date();
    } else if (status) {
      item.status = status;
    }

    await item.save();
    return res.status(200).json({ success: true, message: `Report updated (${action || status})`, item });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error moderating report' });
  }
};

// @desc    Get all claims for admin verification
// @route   GET /api/admin/claims
// @access  Private (Admin only)
exports.getClaims = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status && status !== 'all') query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [claims, total] = await Promise.all([
      Claim.find(query)
        .populate('item')
        .populate('claimant', 'name email department rollNumber avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Claim.countDocuments(query)
    ]);

    return res.status(200).json({
      success: true,
      count: claims.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      claims
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error retrieving claims' });
  }
};

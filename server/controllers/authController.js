const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const LoginLog = require('../models/LoginLog');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET || 'campusfind_secret_dev_key_2026', {
    expiresIn: process.env.JWT_EXPIRE || '30d'
  });
};

// Helper to get client IP and user agent
const getClientMeta = (req) => {
  const ip = (
    req.headers['x-forwarded-for'] ||
    req.socket.remoteAddress ||
    req.ip ||
    '127.0.0.1'
  )
    .toString()
    .replace('::ffff:', '');
  const userAgent = req.headers['user-agent'] || 'Web Browser';
  return { ip, userAgent };
};

// @desc    Check if an email is already registered (Duplicate Email Check)
// @route   POST /api/auth/check-email
// @route   GET /api/auth/check-email
// @access  Public
exports.checkEmailAvailability = async (req, res) => {
  try {
    const rawEmail = req.body?.email || req.query?.email || '';
    const email = rawEmail.toString().toLowerCase().trim();

    if (!email) {
      return res.status(400).json({
        success: false,
        available: false,
        message: 'Please provide an email address to check.'
      });
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        success: false,
        available: false,
        message: 'Please provide a valid email format (e.g. yourname@campus.edu)'
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(200).json({
        success: true,
        available: false,
        isDuplicate: true,
        message: 'This email address is already registered. Please sign in or use another email.'
      });
    }

    return res.status(200).json({
      success: true,
      available: true,
      isDuplicate: false,
      message: 'Email is available for registration.'
    });
  } catch (err) {
    console.error('Check email error:', err);
    return res.status(500).json({
      success: false,
      available: false,
      message: 'Server error while checking email availability.'
    });
  }
};

// @desc    Register a new user (Student or Faculty) & Store initial login in MongoDB
// @route   POST /api/auth/signup
// @access  Public
exports.signup = async (req, res) => {
  try {
    const { name, email, password, role, department, rollNumber, phone } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide name, email, and password' });
    }

    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    const cleanEmail = email.toString().toLowerCase().trim();
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid college email address' });
    }

    // Explicit Duplicate Email Check
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        code: 'DUPLICATE_EMAIL',
        message: 'An account with this email address already exists. Please log in or use a different email.'
      });
    }

    // Default role: only allow 'student' or 'faculty' on standard registration
    const userRole = role === 'faculty' ? 'faculty' : 'student';
    const { ip, userAgent } = getClientMeta(req);

    // Create user (password will be hashed by User schema pre-save hook with bcryptjs)
    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password,
      role: userRole,
      department: department || 'General Studies',
      rollNumber: rollNumber ? rollNumber.trim() : '',
      phone: phone ? phone.trim() : '',
      isVerified: true,
      lastLoginAt: new Date(),
      loginCount: 1,
      lastLoginIp: ip,
      lastLoginDevice: userAgent.slice(0, 100),
      loginHistory: [
        {
          loginAt: new Date(),
          ip,
          device: userAgent.slice(0, 100),
          userAgent: userAgent.slice(0, 200),
          status: 'success'
        }
      ]
    });

    const token = generateToken(user._id);


    // Record initial registration login in MongoDB login_logs collection
    try {
      await LoginLog.create({
        userId: user._id,
        userName: user.name,
        email: user.email,
        role: user.role,
        action: 'login',
        timestamp: new Date(),
        ip,
        userAgent: userAgent.slice(0, 200),
        device: userAgent.slice(0, 100),
        status: 'success'
      });
    } catch (logErr) {
      console.warn('Could not write to login_logs collection on signup:', logErr.message);
    }

    return res.status(201).json({
      success: true,
      message: 'Account registered and saved to MongoDB successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        rollNumber: user.rollNumber,
        phone: user.phone,
        avatar: user.avatar,
        rewardPoints: user.rewardPoints,
        lastLoginAt: user.lastLoginAt,
        loginCount: user.loginCount,
        lastLoginIp: user.lastLoginIp
      }
    });
  } catch (err) {
    console.error('Signup error:', err);
    // Graceful MongoDB Duplicate Key Check (E11000 duplicate key error)
    if (err.code === 11000 || (err.name === 'MongoServerError' && err.code === 11000)) {
      return res.status(400).json({
        success: false,
        code: 'DUPLICATE_EMAIL',
        message: 'This college email is already registered. Please sign in or use another email.'
      });
    }
    return res.status(500).json({ success: false, message: err.message || 'Server error during signup' });
  }
};


// @desc    Login user & Store login activity in MongoDB
// @route   POST /api/auth/login
// @access  Public
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please provide email and password' });
    }

    const { ip, userAgent } = getClientMeta(req);
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (user.isBanned) {
      return res.status(403).json({ success: false, message: 'Account is suspended by administrator.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      // Record failed login attempt in MongoDB
      if (!user.loginHistory) user.loginHistory = [];
      user.loginHistory.unshift({
        loginAt: new Date(),
        ip,
        device: userAgent.slice(0, 100),
        userAgent: userAgent.slice(0, 200),
        status: 'failed'
      });
      if (user.loginHistory.length > 30) user.loginHistory = user.loginHistory.slice(0, 30);
      await user.save();

      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Record successful login in MongoDB
    user.lastLoginAt = new Date();
    user.loginCount = (user.loginCount || 0) + 1;
    user.lastLoginIp = ip;
    user.lastLoginDevice = userAgent.slice(0, 100);

    if (!user.loginHistory) user.loginHistory = [];
    user.loginHistory.unshift({
      loginAt: user.lastLoginAt,
      ip,
      device: userAgent.slice(0, 100),
      userAgent: userAgent.slice(0, 200),
      status: 'success'
    });
    if (user.loginHistory.length > 30) user.loginHistory = user.loginHistory.slice(0, 30);
    await user.save();

    // Record successful login in MongoDB login_logs collection
    try {
      await LoginLog.create({
        userId: user._id,
        userName: user.name,
        email: user.email,
        role: user.role,
        action: 'login',
        timestamp: user.lastLoginAt,
        ip,
        userAgent: userAgent.slice(0, 200),
        device: userAgent.slice(0, 100),
        status: 'success'
      });
    } catch (logErr) {
      console.warn('Could not write to login_logs collection on login:', logErr.message);
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'Logged in successfully. Login session recorded in MongoDB.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        rollNumber: user.rollNumber,
        phone: user.phone,
        avatar: user.avatar,
        rewardPoints: user.rewardPoints,
        itemsReportedCount: user.itemsReportedCount,
        itemsReturnedCount: user.itemsReturnedCount,
        lastLoginAt: user.lastLoginAt,
        loginCount: user.loginCount,
        lastLoginIp: user.lastLoginIp
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error during login' });
  }
};

// @desc    Get user's login activity and history from MongoDB
// @route   GET /api/auth/login-history
// @access  Private
exports.getLoginHistory = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select(
      'loginHistory lastLoginAt loginCount lastLoginIp lastLoginDevice email name role'
    );
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    return res.status(200).json({
      success: true,
      lastLoginAt: user.lastLoginAt,
      loginCount: user.loginCount || 0,
      lastLoginIp: user.lastLoginIp,
      lastLoginDevice: user.lastLoginDevice,
      loginHistory: user.loginHistory || []
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error retrieving login history' });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    return res.status(200).json({ success: true, user });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error retrieving profile' });
  }
};

// @desc    Update profile
// @route   PUT /api/auth/profile
// @access  Private
exports.updateProfile = async (req, res) => {
  try {
    const { name, department, rollNumber, phone, avatar } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (name) user.name = name;
    if (department) user.department = department;
    if (rollNumber) user.rollNumber = rollNumber;
    if (phone) user.phone = phone;
    if (avatar) user.avatar = avatar;

    await user.save();

    return res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        rollNumber: user.rollNumber,
        phone: user.phone,
        avatar: user.avatar,
        rewardPoints: user.rewardPoints
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error updating profile' });
  }
};

// @desc    Forgot Password
// @route   POST /api/auth/forgot-password
// @access  Public
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email ? email.toLowerCase() : '' });

    if (!user) {
      return res.status(404).json({ success: false, message: 'No account registered with this email' });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpires = Date.now() + 30 * 60 * 1000; // 30 minutes

    await user.save({ validateBeforeSave: false });

    // In local/demo mode, we also return the token for ease of testing
    return res.status(200).json({
      success: true,
      message: 'Password reset link sent to your college email.',
      resetToken: resetToken // Provided so user can test the reset flow immediately
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Could not process forgot password' });
  }
};

// @desc    Reset Password
// @route   POST /api/auth/reset-password
// @access  Public
exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ success: false, message: 'Token and new password are required' });
    }

    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired password reset token' });
    }

    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    const authToken = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'Password has been reset successfully. You are now logged in.',
      token: authToken
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error resetting password' });
  }
};

// @desc    Change password with bcrypt verification and re-hashing
// @route   PUT /api/auth/change-password
// @access  Private
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both current and new password.'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters long.'
      });
    }

    // Fetch user with +password to run bcrypt compare
    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    // Compare old password with bcrypt hash
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect. Please check and try again.'
      });
    }

    // Set new password (pre-save hook will hash it with bcryptjs salt 10)
    user.password = newPassword;
    await user.save();

    const token = generateToken(user._id);

    return res.status(200).json({
      success: true,
      message: 'Password changed and securely hashed with bcrypt successfully.',
      token
    });
  } catch (err) {
    console.error('Change password error:', err);
    return res.status(500).json({ success: false, message: 'Server error while changing password.' });
  }
};

// @desc    Logout user & Record logout activity in MongoDB login_logs collection
// @route   POST /api/auth/logout
// @access  Public / Authenticated
exports.logout = async (req, res) => {
  try {
    const { ip, userAgent } = getClientMeta(req);

    if (req.user) {
      await LoginLog.create({
        userId: req.user._id,
        userName: req.user.name,
        email: req.user.email,
        role: req.user.role,
        action: 'logout',
        timestamp: new Date(),
        ip,
        userAgent: userAgent.slice(0, 200),
        device: userAgent.slice(0, 100),
        status: 'success'
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully. Activity recorded in login_logs collection.'
    });
  } catch (err) {
    console.error('Logout error:', err);
    return res.status(500).json({ success: false, message: 'Server error during logout' });
  }
};



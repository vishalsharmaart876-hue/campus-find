const express = require('express');
const router = express.Router();
const {
  signup,
  login,
  logout,
  getMe,
  updateProfile,
  forgotPassword,
  resetPassword,
  getLoginHistory,
  checkEmailAvailability,
  changePassword
} = require('../controllers/authController');
const { protect, optionalAuth } = require('../middleware/auth');

router.post('/signup', signup);
router.post('/login', login);
router.post('/logout', optionalAuth, logout);
router.post('/check-email', checkEmailAvailability);
router.get('/check-email', checkEmailAvailability);
router.get('/me', protect, getMe);
router.get('/login-history', protect, getLoginHistory);
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

module.exports = router;



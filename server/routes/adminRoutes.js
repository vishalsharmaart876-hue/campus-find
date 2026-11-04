const express = require('express');
const router = express.Router();
const {
  getDashboardStats,
  getUsers,
  updateUser,
  getLoginLogs,
  getReports,
  moderateReport,
  getClaims
} = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/auth');

// All admin routes require authentication and admin role (Role-based authorization)
router.use(protect);
router.use(authorize('admin'));

router.get('/stats', getDashboardStats);
router.get('/users', getUsers);
router.put('/users/:id', updateUser);
router.get('/login-logs', getLoginLogs);
router.get('/reports', getReports);
router.put('/reports/:id/moderate', moderateReport);
router.get('/claims', getClaims);

module.exports = router;


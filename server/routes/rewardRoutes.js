const express = require('express');
const router = express.Router();
const { getLeaderboard, getMyRewards } = require('../controllers/rewardController');
const { protect } = require('../middleware/auth');

router.get('/leaderboard', getLeaderboard);
router.get('/my-history', protect, getMyRewards);

module.exports = router;

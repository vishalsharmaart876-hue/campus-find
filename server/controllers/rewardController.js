const User = require('../models/User');
const Reward = require('../models/Reward');

// @desc    Get top helpful campus members leaderboard
// @route   GET /api/rewards/leaderboard
// @access  Public
exports.getLeaderboard = async (req, res) => {
  try {
    const topUsers = await User.find({ rewardPoints: { $gt: 0 }, isBanned: false })
      .select('name avatar department role rewardPoints itemsReturnedCount')
      .sort({ rewardPoints: -1, itemsReturnedCount: -1 })
      .limit(20);

    return res.status(200).json({ success: true, count: topUsers.length, leaderboard: topUsers });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error retrieving leaderboard' });
  }
};

// @desc    Get logged in user's reward history
// @route   GET /api/rewards/my-history
// @access  Private
exports.getMyRewards = async (req, res) => {
  try {
    const history = await Reward.find({ user: req.user.id })
      .populate('item', 'title category')
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      totalPoints: req.user.rewardPoints,
      history
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error retrieving rewards history' });
  }
};

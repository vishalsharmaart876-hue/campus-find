const mongoose = require('mongoose');

const rewardSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    points: {
      type: Number,
      required: true
    },
    type: {
      type: String,
      enum: ['item_returned', 'verified_claim', 'honest_finder_bonus', 'first_report'],
      default: 'item_returned'
    },
    description: {
      type: String,
      required: true
    },
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Reward', rewardSchema);

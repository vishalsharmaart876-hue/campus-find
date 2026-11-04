const mongoose = require('mongoose');

const loginLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    userName: {
      type: String,
      default: ''
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true
    },
    role: {
      type: String,
      default: 'student'
    },
    action: {
      type: String,
      enum: ['login', 'logout'],
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    ip: {
      type: String,
      default: '127.0.0.1'
    },
    userAgent: {
      type: String,
      default: ''
    },
    device: {
      type: String,
      default: ''
    },
    status: {
      type: String,
      enum: ['success', 'failed'],
      default: 'success'
    }
  },
  {
    timestamps: true,
    collection: 'login_logs' // Dedicated MongoDB collection named login_logs
  }
);

// High performance indexes for Admin Dashboard filtering & sort
loginLogSchema.index({ timestamp: -1 });
loginLogSchema.index({ userId: 1, timestamp: -1 });
loginLogSchema.index({ email: 1 });
loginLogSchema.index({ action: 1 });

module.exports = mongoose.model('LoginLog', loginLogSchema);

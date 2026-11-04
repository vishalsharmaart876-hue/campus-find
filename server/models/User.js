const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide your full name'],
      trim: true,
      maxlength: [60, 'Name cannot exceed 60 characters']
    },
    email: {
      type: String,
      required: [true, 'Please provide your college email address'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
        'Please provide a valid email address'
      ]
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false
    },
    role: {
      type: String,
      enum: ['student', 'faculty', 'admin'],
      default: 'student'
    },
    department: {
      type: String,
      default: 'Computer Science'
    },
    rollNumber: {
      type: String,
      trim: true,
      default: ''
    },
    phone: {
      type: String,
      trim: true,
      default: ''
    },
    avatar: {
      type: String,
      default: ''
    },
    isVerified: {
      type: Boolean,
      default: true // In production this can be flipped to false until OTP/link verified
    },
    verificationToken: {
      type: String
    },
    resetPasswordToken: {
      type: String
    },
    resetPasswordExpires: {
      type: Date
    },
    rewardPoints: {
      type: Number,
      default: 0
    },
    itemsReportedCount: {
      type: Number,
      default: 0
    },
    itemsReturnedCount: {
      type: Number,
      default: 0
    },
    isBanned: {
      type: Boolean,
      default: false
    },
    // MongoDB Login Tracking & Security Info
    lastLoginAt: {
      type: Date,
      default: Date.now
    },
    loginCount: {
      type: Number,
      default: 0
    },
    lastLoginIp: {
      type: String,
      default: '127.0.0.1'
    },
    lastLoginDevice: {
      type: String,
      default: ''
    },
    loginHistory: [
      {
        loginAt: {
          type: Date,
          default: Date.now
        },
        ip: {
          type: String,
          default: ''
        },
        device: {
          type: String,
          default: ''
        },
        userAgent: {
          type: String,
          default: ''
        },
        status: {
          type: String,
          enum: ['success', 'failed'],
          default: 'success'
        }
      }
    ]
  },
  { timestamps: true }
);

// Secure Password Hashing before saving to MongoDB
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  // Generate salt with 10 rounds
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare entered password with bcrypt hash stored in MongoDB
userSchema.methods.comparePassword = async function (enteredPassword) {
  if (!enteredPassword || !this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);


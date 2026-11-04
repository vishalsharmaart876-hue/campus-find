const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item',
      required: true
    },
    claimant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    answers: [
      {
        question: String,
        answer: String
      }
    ],
    proofDescription: {
      type: String,
      required: [true, 'Please provide details or proof of ownership']
    },
    proofImages: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'completed'],
      default: 'pending'
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewNotes: {
      type: String,
      default: ''
    },
    qrCodeToken: {
      type: String,
      unique: true,
      sparse: true
    },
    qrCodeExpiresAt: {
      type: Date
    },
    isPickedUp: {
      type: Boolean,
      default: false
    },
    pickedUpAt: {
      type: Date
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Claim', claimSchema);

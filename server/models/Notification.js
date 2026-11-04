const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: [
        'claim_received',
        'claim_approved',
        'claim_rejected',
        'match_found',
        'message_received',
        'item_returned',
        'reward_earned',
        'found_request_received',
        'found_request_accepted',
        'found_request_rejected',
        'handover_confirmed',
        'system_alert'
      ],
      default: 'system_alert'
    },
    relatedItem: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Item'
    },
    relatedClaim: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Claim'
    },
    isRead: {
      type: Boolean,
      default: false
    },
    emailSent: {
      type: Boolean,
      default: false
    },
    whatsappSent: {
      type: Boolean,
      default: false
    },
    whatsappUrl: {
      type: String,
      default: ''
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);

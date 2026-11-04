const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ['lost', 'found'],
      required: [true, 'Item type (lost or found) is required']
    },
    title: {
      type: String,
      required: [true, 'Item name/title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: [
        'Electronics',
        'ID & Cards',
        'Books & Notebooks',
        'Bags & Wallets',
        'Keys',
        'Clothing & Accessories',
        'Eyewear',
        'Documents',
        'Sports Equipment',
        'Jewelry',
        'Others'
      ],
      default: 'Others'
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      maxlength: [1500, 'Description cannot exceed 1500 characters']
    },
    images: {
      type: [String],
      default: []
    },
    locationName: {
      type: String,
      required: [true, 'Location name is required'],
      trim: true
    },
    coordinates: {
      lat: {
        type: Number,
        default: 28.545 // default campus coordinates (configurable)
      },
      lng: {
        type: Number,
        default: 77.1926
      }
    },
    campusBuilding: {
      type: String,
      default: 'Main Campus'
    },
    dateTime: {
      type: Date,
      default: Date.now,
      required: [true, 'Date and approximate time are required']
    },
    contactPreference: {
      type: String,
      enum: ['in_app_chat', 'email', 'safekeeping_desk'],
      default: 'in_app_chat'
    },
    // Sensitive detail protection
    isSensitive: {
      type: Boolean,
      default: false
    },
    sensitiveDetailsHidden: {
      type: String,
      default: '' // Hidden from public view, only visible to report creator or used for verification
    },
    verificationQuestions: {
      type: [String],
      default: []
    },
    status: {
      type: String,
      enum: [
        'active',
        'claim_pending',
        'claimed',
        'verification_pending',
        'handover_pending',
        'resolved',
        'returned',
        'archived'
      ],
      default: 'active'
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    claimedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    matchedItems: [
      {
        item: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Item'
        },
        similarityScore: Number,
        matchedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    // Quick reporting for ID card
    isEmergencyId: {
      type: Boolean,
      default: false
    },
    idCardRollNo: {
      type: String,
      default: ''
    },
    viewsCount: {
      type: Number,
      default: 0
    },
    isFlagged: {
      type: Boolean,
      default: false
    },
    flagReason: {
      type: String,
      default: ''
    },
    recoveredAt: {
      type: Date
    },
    // Auto-generated Unique Complaint ID (e.g. CF-2026-847291)
    complaintId: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true
    },
    itemCode: {
      type: String,
      unique: true,
      sparse: true,
      uppercase: true,
      trim: true
    },
    returnedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    returnNotes: {
      type: String,
      default: ''
    },
    returnedLocation: {
      type: String,
      default: ''
    },
    // Found Item Request Workflow State
    foundRequest: {
      requestedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      requestedByName: {
        type: String,
        default: ''
      },
      foundNotes: {
        type: String,
        default: ''
      },
      foundLocation: {
        type: String,
        default: ''
      },
      foundImage: {
        type: String,
        default: ''
      },
      requestedAt: {
        type: Date
      },
      status: {
        type: String,
        enum: ['none', 'pending_approval', 'accepted', 'rejected', 'confirmed_received'],
        default: 'none'
      },
      ownerResponseAt: {
        type: Date
      },
      ownerRejectionReason: {
        type: String,
        default: ''
      },
      handoverConfirmedAt: {
        type: Date
      }
    },
    // Audit History of Verification, Owner Decisions, and Handover Status Changes
    verificationHistory: [
      {
        action: {
          type: String,
          required: true
        },
        performedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User'
        },
        performedByName: {
          type: String,
          default: ''
        },
        timestamp: {
          type: Date,
          default: Date.now
        },
        notes: {
          type: String,
          default: ''
        }
      }
    ]
  },
  { timestamps: true }
);

// Auto-generate clean, unique Complaint ID (e.g. CF-2026-847291) if not provided
itemSchema.pre('save', function (next) {
  if (!this.complaintId) {
    const year = new Date().getFullYear();
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    this.complaintId = `CF-${year}-${randomNum}`;
  }
  if (!this.itemCode) {
    this.itemCode = this.complaintId;
  }
  next();
});


// Indexes for fast searching and filtering
itemSchema.index({ type: 1, status: 1, category: 1 });
itemSchema.index({ title: 'text', description: 'text', locationName: 'text' });

module.exports = mongoose.model('Item', itemSchema);

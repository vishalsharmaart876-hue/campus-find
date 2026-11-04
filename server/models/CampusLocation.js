const mongoose = require('mongoose');

const campusLocationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    code: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      enum: ['Academic', 'Library', 'Hostel', 'Sports', 'Food & Dining', 'Administration', 'Gate/Security', 'Parking', 'Other'],
      default: 'Academic'
    },
    lat: {
      type: Number,
      required: true
    },
    lng: {
      type: Number,
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    safekeepingDeskAvailable: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('CampusLocation', campusLocationSchema);

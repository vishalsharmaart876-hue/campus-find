const CampusLocation = require('../models/CampusLocation');

// @desc    Get all campus locations for Leaflet interactive map
// @route   GET /api/campus/locations
// @access  Public
exports.getCampusLocations = async (req, res) => {
  try {
    const locations = await CampusLocation.find().sort({ name: 1 });
    return res.status(200).json({ success: true, count: locations.length, locations });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error retrieving campus locations' });
  }
};

// @desc    Create a new campus landmark location (Admin only)
// @route   POST /api/campus/locations
// @access  Private (Admin)
exports.createCampusLocation = async (req, res) => {
  try {
    const { name, code, category, lat, lng, description, safekeepingDeskAvailable } = req.body;

    if (!name || !lat || !lng) {
      return res.status(400).json({ success: false, message: 'Name, lat, and lng are required' });
    }

    const location = await CampusLocation.create({
      name,
      code,
      category: category || 'Academic',
      lat: parseFloat(lat),
      lng: parseFloat(lng),
      description: description || '',
      safekeepingDeskAvailable: safekeepingDeskAvailable === undefined ? true : safekeepingDeskAvailable
    });

    return res.status(201).json({ success: true, location });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message || 'Error creating campus location' });
  }
};

// @desc    Update campus location (Admin only)
// @route   PUT /api/campus/locations/:id
// @access  Private (Admin)
exports.updateCampusLocation = async (req, res) => {
  try {
    const location = await CampusLocation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }
    return res.status(200).json({ success: true, location });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error updating campus location' });
  }
};

// @desc    Delete campus location (Admin only)
// @route   DELETE /api/campus/locations/:id
// @access  Private (Admin)
exports.deleteCampusLocation = async (req, res) => {
  try {
    const location = await CampusLocation.findByIdAndDelete(req.params.id);
    if (!location) {
      return res.status(404).json({ success: false, message: 'Location not found' });
    }
    return res.status(200).json({ success: true, message: 'Location deleted successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error deleting campus location' });
  }
};

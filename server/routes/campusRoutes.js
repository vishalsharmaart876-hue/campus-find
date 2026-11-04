const express = require('express');
const router = express.Router();
const {
  getCampusLocations,
  createCampusLocation,
  updateCampusLocation,
  deleteCampusLocation
} = require('../controllers/campusController');
const { protect, authorize } = require('../middleware/auth');

router.get('/locations', getCampusLocations);
router.post('/locations', protect, authorize('admin'), createCampusLocation);
router.put('/locations/:id', protect, authorize('admin'), updateCampusLocation);
router.delete('/locations/:id', protect, authorize('admin'), deleteCampusLocation);

module.exports = router;

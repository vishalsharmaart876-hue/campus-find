const express = require('express');
const router = express.Router();
const {
  submitClaim,
  getClaimsForItem,
  getMyClaims,
  approveClaim,
  rejectClaim,
  previewPickup,
  verifyPickup
} = require('../controllers/claimController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.post('/', protect, upload.array('proofImages', 3), submitClaim);
router.get('/my-claims', protect, getMyClaims);
router.get('/item/:itemId', protect, getClaimsForItem);
router.put('/:id/approve', protect, approveClaim);
router.put('/:id/reject', protect, rejectClaim);
router.post('/preview-pickup', protect, previewPickup);
router.post('/verify-pickup', protect, verifyPickup);

module.exports = router;

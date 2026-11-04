const express = require('express');
const router = express.Router();
const {
  createLostItem,
  createFoundItem,
  getItems,
  getItemById,
  getMyReports,
  getNoticeBoardItems,
  checkDuplicateItem,
  runAiMatch,
  updateItem,
  deleteItem,
  previewReturnById,
  returnItemById,
  verifyComplaintId,
  submitFoundRequest,
  handleOwnerDecision,
  confirmItemReceived
} = require('../controllers/itemController');
const { protect, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', optionalAuth, getItems);
router.get('/notice-board', getNoticeBoardItems);
router.get('/my-reports', protect, getMyReports);
router.post('/check-duplicate', protect, checkDuplicateItem);

// Complaint ID & Found Item Verification routes
router.post('/verify-complaint-id', protect, verifyComplaintId);
router.post('/found-request', protect, upload.single('image'), submitFoundRequest);
router.post('/:id/owner-decision', protect, handleOwnerDecision);
router.post('/:id/confirm-received', protect, confirmItemReceived);

// Legacy item return verification routes using Item ID
router.post('/preview-return', protect, previewReturnById);
router.post('/return-by-id', protect, returnItemById);

router.post('/lost', protect, upload.array('images', 5), createLostItem);
router.post('/found', protect, upload.array('images', 5), createFoundItem);

router.get('/:id', optionalAuth, getItemById);
router.post('/:id/ai-match', protect, runAiMatch);
router.put('/:id', protect, updateItem);
router.delete('/:id', protect, deleteItem);

module.exports = router;

const crypto = require('crypto');
const Claim = require('../models/Claim');
const Item = require('../models/Item');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Reward = require('../models/Reward');
const notificationService = require('../services/notificationService');

// @desc    Submit a claim for an item
// @route   POST /api/claims
// @access  Private
exports.submitClaim = async (req, res) => {
  try {
    const { itemId, answers, proofDescription } = req.body;

    if (!itemId || !proofDescription) {
      return res.status(400).json({ success: false, message: 'Please provide itemId and proof description' });
    }

    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    // Check if claimant is the one who reported it
    if (item.reportedBy.toString() === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot claim an item you reported' });
    }

    // Check if user already submitted a pending claim for this item
    const existingClaim = await Claim.findOne({
      item: itemId,
      claimant: req.user.id,
      status: { $in: ['pending', 'approved'] }
    });

    if (existingClaim) {
      return res.status(400).json({ success: false, message: 'You already have an active claim for this item' });
    }

    let proofImages = [];
    if (req.files && req.files.length > 0) {
      proofImages = req.files.map((file) => file.path || `/uploads/${file.filename}`);
    } else if (req.body.proofImageUrl) {
      proofImages = [req.body.proofImageUrl];
    }

    let parsedAnswers = [];
    if (answers) {
      parsedAnswers = Array.isArray(answers)
        ? answers
        : typeof answers === 'string'
        ? JSON.parse(answers)
        : [];
    }

    const claim = await Claim.create({
      item: itemId,
      claimant: req.user.id,
      answers: parsedAnswers,
      proofDescription,
      proofImages,
      status: 'pending'
    });

    // Update item status to claim_pending
    item.status = 'claim_pending';
    await item.save();

    // Multi-channel notification to finder (In-app, Email & WhatsApp)
    const finder = await User.findById(item.reportedBy);
    if (finder) {
      await notificationService.notifyClaimSubmitted({
        finderUser: finder,
        claimantUser: req.user,
        item,
        claim,
        io: req.io
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Claim submitted successfully. The finder or campus admin will review your ownership proof.',
      claim
    });
  } catch (err) {
    console.error('Submit claim error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Error submitting claim' });
  }
};

// @desc    Get claims for an item (Finder or Admin)
// @route   GET /api/claims/item/:itemId
// @access  Private
exports.getClaimsForItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.itemId);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const isOwner = item.reportedBy.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to view claims for this item' });
    }

    const claims = await Claim.find({ item: req.params.itemId })
      .populate('claimant', 'name email department rollNumber avatar')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: claims.length, claims });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error retrieving claims' });
  }
};

// @desc    Get user's submitted claims
// @route   GET /api/claims/my-claims
// @access  Private
exports.getMyClaims = async (req, res) => {
  try {
    const claims = await Claim.find({ claimant: req.user.id })
      .populate('item', 'title category images locationName campusBuilding status type')
      .sort({ createdAt: -1 });

    return res.status(200).json({ success: true, count: claims.length, claims });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error retrieving your claims' });
  }
};

// @desc    Approve claim & generate secure QR pickup token
// @route   PUT /api/claims/:id/approve
// @access  Private (Finder or Admin)
exports.approveClaim = async (req, res) => {
  try {
    const claim = await Claim.findById(req.params.id)
      .populate('item')
      .populate('claimant', 'name email');

    if (!claim) {
      return res.status(404).json({ success: false, message: 'Claim not found' });
    }

    const isOwner = claim.item.reportedBy.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to approve this claim' });
    }

    // Generate unique pickup token
    const tokenPart = crypto.randomBytes(4).toString('hex').toUpperCase();
    const qrToken = `CF-PICKUP-${tokenPart}-${Date.now().toString().slice(-4)}`;

    claim.status = 'approved';
    claim.reviewedBy = req.user.id;
    claim.reviewNotes = req.body.notes || 'Ownership verified. Present QR code upon pickup.';
    claim.qrCodeToken = qrToken;
    claim.qrCodeExpiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours
    await claim.save();

    // Update item status
    const item = await Item.findById(claim.item._id);
    item.status = 'claimed';
    item.claimedBy = claim.claimant._id;
    await item.save();

    // Reject any other pending claims on this item
    await Claim.updateMany(
      { item: item._id, _id: { $ne: claim._id }, status: 'pending' },
      { status: 'rejected', reviewNotes: 'Another verified claim was approved for this item.' }
    );

    // Multi-channel alert to claimant with QR pickup token via Email, WhatsApp & In-app
    const claimantUser = await User.findById(claim.claimant._id);
    const finderUser = await User.findById(item.reportedBy);

    await notificationService.notifyClaimApproved({
      claimantUser,
      finderUser,
      item,
      claim,
      qrCodeToken: qrToken,
      io: req.io
    });

    return res.status(200).json({
      success: true,
      message: 'Claim approved. Secure pickup QR code token generated and dispatched via Email and WhatsApp.',
      claim
    });
  } catch (err) {
    console.error('Approve claim error:', err);
    return res.status(500).json({ success: false, message: 'Error approving claim' });
  }
};

// @desc    Reject claim
// @route   PUT /api/claims/:id/reject
// @access  Private (Finder or Admin)
exports.rejectClaim = async (req, res) => {
  try {
    const { reason } = req.body;
    const claim = await Claim.findById(req.params.id).populate('item');

    if (!claim) {
      return res.status(404).json({ success: false, message: 'Claim not found' });
    }

    const isOwner = claim.item.reportedBy.toString() === req.user.id;
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Not authorized to reject this claim' });
    }

    claim.status = 'rejected';
    claim.reviewedBy = req.user.id;
    claim.reviewNotes = reason || 'Ownership verification could not be validated.';
    await claim.save();

    // Check if there are other pending claims
    const remainingPending = await Claim.countDocuments({
      item: claim.item._id,
      status: 'pending'
    });

    if (remainingPending === 0) {
      await Item.findByIdAndUpdate(claim.item._id, { status: 'active' });
    }

    // Notify claimant
    await Notification.create({
      recipient: claim.claimant,
      title: 'Claim Rejected',
      message: `Your claim for "${claim.item.title}" was not approved: ${claim.reviewNotes}`,
      type: 'claim_rejected',
      relatedItem: claim.item._id,
      relatedClaim: claim._id
    });

    return res.status(200).json({ success: true, message: 'Claim rejected', claim });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error rejecting claim' });
  }
};

// @desc    Preview Pickup / Handover details by scanning QR code before confirming
// @route   POST /api/claims/preview-pickup
// @access  Private
exports.previewPickup = async (req, res) => {
  try {
    const { qrCodeToken } = req.body;

    if (!qrCodeToken) {
      return res.status(400).json({ success: false, message: 'Please provide Item ID or Pickup QR code' });
    }

    const cleanToken = qrCodeToken.trim().toUpperCase();
    let claim = await Claim.findOne({ qrCodeToken: qrCodeToken.trim() })
      .populate('item')
      .populate('claimant', 'name email department rollNumber phone avatar');

    if (!claim) {
      // Check if it's an Item ID (e.g. CF-LOST-XXXXX)
      let item = await Item.findOne({ itemCode: cleanToken }).populate('reportedBy', 'name email phone department');
      if (!item && cleanToken.match(/^[0-9a-fA-F]{24}$/)) {
        item = await Item.findById(cleanToken).populate('reportedBy', 'name email phone department');
      }

      if (item) {
        const isAlreadyReturned = item.status === 'returned';
        return res.status(200).json({
          success: true,
          isItemDirectReturn: true,
          item,
          claimant: null,
          finder: item.reportedBy,
          canComplete: !isAlreadyReturned,
          claim: {
            itemCode: item.itemCode,
            status: item.status,
            isPickedUp: isAlreadyReturned,
            pickedUpAt: item.recoveredAt
          }
        });
      }

      return res.status(404).json({ success: false, message: `Invalid Item ID or pickup token "${cleanToken}".` });
    }

    const finder = await User.findById(claim.item.reportedBy).select('name email phone department');
    const isExpired = claim.qrCodeExpiresAt && new Date() > new Date(claim.qrCodeExpiresAt);

    return res.status(200).json({
      success: true,
      claim: {
        _id: claim._id,
        qrCodeToken: claim.qrCodeToken,
        status: claim.status,
        isPickedUp: claim.isPickedUp,
        pickedUpAt: claim.pickedUpAt,
        isExpired,
        expiresAt: claim.qrCodeExpiresAt,
        proofDescription: claim.proofDescription,
        answers: claim.answers
      },
      claimant: claim.claimant,
      item: claim.item,
      finder,
      canComplete: !claim.isPickedUp && !isExpired && claim.status === 'approved'
    });
  } catch (err) {
    console.error('Preview pickup error:', err);
    return res.status(500).json({ success: false, message: 'Error previewing pickup token' });
  }
};

// @desc    Verify QR Code / Item ID & Complete Return Handover
// @route   POST /api/claims/verify-pickup
// @access  Private
exports.verifyPickup = async (req, res) => {
  try {
    const { qrCodeToken, itemCode } = req.body;
    const token = (qrCodeToken || itemCode || '').trim();

    if (!token) {
      return res.status(400).json({ success: false, message: 'Please provide Item ID or Pickup QR code' });
    }

    const cleanToken = token.toUpperCase();
    let claim = await Claim.findOne({ qrCodeToken: token })
      .populate('item')
      .populate('claimant', 'name email department rollNumber phone avatar');

    // If not a claim token, check if it's an Item ID directly
    if (!claim) {
      let item = await Item.findOne({ itemCode: cleanToken }).populate('reportedBy', 'name email department');
      if (!item && cleanToken.match(/^[0-9a-fA-F]{24}$/)) {
        item = await Item.findById(cleanToken).populate('reportedBy', 'name email department');
      }

      if (item) {
        if (item.status === 'returned') {
          return res.status(400).json({
            success: false,
            message: `This item was already marked as RETURNED on ${new Date(item.recoveredAt || item.updatedAt).toLocaleString()}`
          });
        }

        item.status = 'returned';
        item.recoveredAt = new Date();
        item.returnedBy = req.user.id;
        await item.save();

        // Award 50 points to the returner
        const returner = await User.findById(req.user.id);
        if (returner) {
          returner.rewardPoints = (returner.rewardPoints || 0) + 50;
          returner.itemsReturnedCount = (returner.itemsReturnedCount || 0) + 1;
          await returner.save();

          await Reward.create({
            user: returner._id,
            points: 50,
            type: 'item_returned',
            description: `Successfully returned item "${item.title}" (Item ID: ${item.itemCode})`,
            item: item._id
          });
        }

        // Notify reporter
        if (item.reportedBy && item.reportedBy._id) {
          await Notification.create({
            recipient: item.reportedBy._id,
            title: 'Your Lost Item Has Been Returned! 🎉',
            message: `"${item.title}" was returned and confirmed using Item ID ${item.itemCode}.`,
            type: 'item_returned',
            relatedItem: item._id
          });

          if (req.io) {
            req.io.to(`user_${item.reportedBy._id}`).emit('notification', {
              title: 'Your Lost Item Has Been Returned! 🎉',
              message: `"${item.title}" was returned via Item ID ${item.itemCode}.`,
              type: 'item_returned',
              itemTitle: item.title,
              itemCode: item.itemCode
            });
          }
        }

        return res.status(200).json({
          success: true,
          message: `Item return verified successfully using Item ID! +50 Campus Karma Points awarded!`,
          itemTitle: item.title,
          itemCategory: item.category,
          itemCode: item.itemCode,
          itemImage: item.images && item.images.length > 0 ? item.images[0] : null,
          claimedBy: item.reportedBy ? item.reportedBy.name : 'Reporter',
          finderName: returner ? returner.name : 'Campus Member',
          completedAt: item.recoveredAt
        });
      }

      return res.status(404).json({ success: false, message: `Invalid Item ID or pickup QR code: "${token}".` });
    }

    if (claim.isPickedUp) {
      return res.status(400).json({
        success: false,
        message: 'This item was already collected and marked recovered on ' + new Date(claim.pickedUpAt).toLocaleString()
      });
    }

    if (claim.qrCodeExpiresAt && new Date() > new Date(claim.qrCodeExpiresAt)) {
      return res.status(400).json({ success: false, message: 'Pickup QR code has expired. Request re-verification.' });
    }

    // Mark claim as picked up & completed
    claim.isPickedUp = true;
    claim.pickedUpAt = new Date();
    claim.status = 'completed';
    await claim.save();

    // Mark item as returned / recovered
    const item = await Item.findById(claim.item._id);
    item.status = 'returned';
    item.recoveredAt = new Date();
    await item.save();

    // Award 50 points to the finder
    const finderId = item.reportedBy;
    const finder = await User.findById(finderId);
    if (finder) {
      finder.rewardPoints = (finder.rewardPoints || 0) + 50;
      finder.itemsReturnedCount = (finder.itemsReturnedCount || 0) + 1;
      await finder.save();

      await Reward.create({
        user: finder._id,
        points: 50,
        type: 'item_returned',
        description: `Successfully returned item "${item.title}" to owner`,
        item: item._id
      });
    }

    // Multi-channel dispatch to both Claimant and Finder via Email and WhatsApp
    await notificationService.notifyItemRecovered({
      claimantUser: claim.claimant,
      finderUser: finder,
      item,
      claim,
      adminUser: req.user,
      io: req.io
    });

    return res.status(200).json({
      success: true,
      message: 'Item officially verified and marked as RECOVERED! Handover recorded, karma points granted, and notifications dispatched via Email & WhatsApp.',
      itemTitle: item.title,
      itemCategory: item.category,
      itemImage: item.images && item.images.length > 0 ? item.images[0] : null,
      claimedBy: claim.claimant.name,
      claimantRollNo: claim.claimant.rollNumber,
      claimantDept: claim.claimant.department,
      finderName: finder ? finder.name : 'Anonymous',
      completedAt: claim.pickedUpAt
    });
  } catch (err) {
    console.error('Verify pickup error:', err);
    return res.status(500).json({ success: false, message: 'Error verifying pickup token' });
  }
};

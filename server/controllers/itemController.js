const Item = require('../models/Item');
const User = require('../models/User');
const Notification = require('../models/Notification');
const Reward = require('../models/Reward');
const { matchItemImages } = require('../services/aiService');
const { checkDuplicate } = require('../services/duplicateDetectionService');
const notificationService = require('../services/notificationService');

// @desc    Report a Lost Item
// @route   POST /api/items/lost
// @access  Private
exports.createLostItem = async (req, res) => {
  try {
    const {
      title,
      category,
      description,
      locationName,
      campusBuilding,
      dateTime,
      contactPreference,
      isSensitive,
      sensitiveDetailsHidden,
      verificationQuestions,
      lat,
      lng,
      isEmergencyId,
      idCardRollNo
    } = req.body;

    if (!title || !description || !locationName) {
      return res.status(400).json({ success: false, message: 'Please provide title, description, and location' });
    }

    // Process uploaded images
    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map((file) => file.path || `/uploads/${file.filename}`);
    } else if (req.body.imageUrl) {
      images = [req.body.imageUrl];
    }

    // Coordinates default
    const coordinates = {
      lat: lat ? parseFloat(lat) : 28.545,
      lng: lng ? parseFloat(lng) : 77.1926
    };

    // Parsed verification questions if sent as JSON string
    let parsedQuestions = [];
    if (verificationQuestions) {
      parsedQuestions = Array.isArray(verificationQuestions)
        ? verificationQuestions
        : typeof verificationQuestions === 'string'
        ? JSON.parse(verificationQuestions)
        : [];
    }

    const year = new Date().getFullYear();
    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const complaintId = `CF-${year}-${randomNum}`;
    const itemCode = complaintId;

    const item = await Item.create({
      type: 'lost',
      complaintId,
      itemCode,
      title,
      category: category || 'Others',
      description,
      images,
      locationName,
      campusBuilding: campusBuilding || 'Main Campus',
      coordinates,
      dateTime: dateTime ? new Date(dateTime) : new Date(),
      contactPreference: contactPreference || 'in_app_chat',
      isSensitive: isSensitive === 'true' || isSensitive === true,
      sensitiveDetailsHidden: sensitiveDetailsHidden || '',
      verificationQuestions: parsedQuestions,
      isEmergencyId: isEmergencyId === 'true' || isEmergencyId === true,
      idCardRollNo: idCardRollNo || '',
      reportedBy: req.user.id,
      verificationHistory: [
        {
          action: 'complaint_created',
          performedBy: req.user.id,
          performedByName: req.user.name || 'Owner',
          timestamp: new Date(),
          notes: `Lost item complaint registered with Complaint ID: ${complaintId}`
        }
      ]
    });

    // Update user stats
    await User.findByIdAndUpdate(req.user.id, { $inc: { itemsReportedCount: 1 } });

    // Broadcast new lost item to all students & campus members in real-time
    try {
      await notificationService.notifyCampusNewItem({
        item,
        reportedByUser: req.user,
        io: req.io
      });
    } catch (broadcastErr) {
      console.warn('Campus broadcast error:', broadcastErr.message);
    }

    // AI visual & category matching against active found items
    let matches = [];
    try {
      const activeFoundItems = await Item.find({
        type: 'found',
        status: 'active'
      }).lean();

      if (activeFoundItems.length > 0 && images.length > 0) {
        matches = await matchItemImages(images[0], activeFoundItems, item.category);
        if (matches.length > 0) {
          // Store top matches on the item
          item.matchedItems = matches.slice(0, 5).map((m) => ({
            item: m.item_id,
            similarityScore: m.similarity_score,
            matchedAt: new Date()
          }));
          await item.save();

          // Multi-channel notification to user about potential matches via Email, WhatsApp & In-app
          const topMatch = matches[0];
          const matchedFound = activeFoundItems.find((f) => f._id.toString() === topMatch.item_id.toString());
          if (matchedFound) {
            await notificationService.notifyMatchFound({
              recipientUser: req.user,
              lostItem: item,
              matchedItem: matchedFound,
              similarityScore: topMatch.similarity_score,
              io: req.io
            });
          }
        }
      }
    } catch (matchErr) {
      console.warn('AI matching background attempt error:', matchErr.message);
    }

    return res.status(201).json({
      success: true,
      message: `Lost item complaint submitted successfully. Your unique Complaint ID is ${item.complaintId}.`,
      item,
      complaintId: item.complaintId,
      itemCode: item.itemCode,
      suggestedMatches: matches
    });
  } catch (err) {
    console.error('Create lost item error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Error creating lost item report' });
  }
};

// @desc    Report a Found Item
// @route   POST /api/items/found
// @access  Private
exports.createFoundItem = async (req, res) => {
  try {
    const {
      title,
      category,
      description,
      locationName,
      campusBuilding,
      dateTime,
      contactPreference,
      isSensitive,
      sensitiveDetailsHidden,
      verificationQuestions,
      lat,
      lng
    } = req.body;

    if (!title || !description || !locationName) {
      return res.status(400).json({ success: false, message: 'Please provide title, description, and location' });
    }

    let images = [];
    if (req.files && req.files.length > 0) {
      images = req.files.map((file) => file.path || `/uploads/${file.filename}`);
    } else if (req.body.imageUrl) {
      images = [req.body.imageUrl];
    }

    const coordinates = {
      lat: lat ? parseFloat(lat) : 28.545,
      lng: lng ? parseFloat(lng) : 77.1926
    };

    let parsedQuestions = [];
    if (verificationQuestions) {
      parsedQuestions = Array.isArray(verificationQuestions)
        ? verificationQuestions
        : typeof verificationQuestions === 'string'
        ? JSON.parse(verificationQuestions)
        : [];
    }

    const randomNum = Math.floor(100000 + Math.random() * 900000);
    const itemCode = `CF-FND-${randomNum}`;

    const item = await Item.create({
      type: 'found',
      itemCode,
      title,
      category: category || 'Others',
      description,
      images,
      locationName,
      campusBuilding: campusBuilding || 'Main Campus',
      coordinates,
      dateTime: dateTime ? new Date(dateTime) : new Date(),
      contactPreference: contactPreference || 'in_app_chat',
      isSensitive: isSensitive === 'true' || isSensitive === true,
      sensitiveDetailsHidden: sensitiveDetailsHidden || '',
      verificationQuestions: parsedQuestions,
      reportedBy: req.user.id
    });

    await User.findByIdAndUpdate(req.user.id, { $inc: { itemsReportedCount: 1 } });

    // Broadcast new found item to all students & campus members in real-time
    try {
      await notificationService.notifyCampusNewItem({
        item,
        reportedByUser: req.user,
        io: req.io
      });
    } catch (broadcastErr) {
      console.warn('Campus found broadcast error:', broadcastErr.message);
    }

    // Match against active lost items
    let matches = [];
    try {
      const activeLostItems = await Item.find({
        type: 'lost',
        status: 'active'
      }).lean();

      if (activeLostItems.length > 0 && images.length > 0) {
        matches = await matchItemImages(images[0], activeLostItems, item.category);
        if (matches.length > 0) {
          // Notify owners of high similarity lost items
          for (const match of matches.slice(0, 3)) {
            if (match.similarity_score >= 50) {
              const matchedLostItem = activeLostItems.find(
                (l) => l._id.toString() === match.item_id.toString()
              );
              if (matchedLostItem) {
                const lostOwner = await User.findById(matchedLostItem.reportedBy);
                if (lostOwner) {
                  await notificationService.notifyMatchFound({
                    recipientUser: lostOwner,
                    lostItem: matchedLostItem,
                    matchedItem: item,
                    similarityScore: match.similarity_score,
                    io: req.io
                  });
                }
              }
            }
          }
        }
      }
    } catch (matchErr) {
      console.warn('AI matching for found item error:', matchErr.message);
    }

    return res.status(201).json({
      success: true,
      message: `Found item report submitted successfully. Item ID: ${item.itemCode}.`,
      item,
      itemCode: item.itemCode,
      suggestedMatches: matches
    });
  } catch (err) {
    console.error('Create found item error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Error creating found item report' });
  }
};

// @desc    Get all items with search, filters, pagination
// @route   GET /api/items
// @access  Public
exports.getItems = async (req, res) => {
  try {
    const {
      type,
      category,
      campusBuilding,
      status,
      search,
      sortBy,
      page = 1,
      limit = 12
    } = req.query;

    const query = {};

    if (type && type !== 'all') {
      query.type = type;
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (campusBuilding && campusBuilding !== 'All') {
      query.campusBuilding = campusBuilding;
    }

    if (status && status !== 'all') {
      query.status = status;
    } else {
      // By default don't show archived items
      query.status = { $ne: 'archived' };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { locationName: { $regex: search, $options: 'i' } },
        { campusBuilding: { $regex: search, $options: 'i' } }
      ];
    }

    let sort = { createdAt: -1 }; // newest first by default
    if (sortBy === 'oldest') sort = { createdAt: 1 };
    else if (sortBy === 'views') sort = { viewsCount: -1 };
    else if (sortBy === 'date') sort = { dateTime: -1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [items, total] = await Promise.all([
      Item.find(query)
        .populate('reportedBy', 'name email avatar department role')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Item.countDocuments(query)
    ]);

    // Sanitize sensitive details for items not reported by the user
    const sanitizedItems = items.map((item) => {
      const itemObj = item.toObject();
      if (itemObj.isSensitive && (!req.user || req.user.id !== itemObj.reportedBy._id.toString())) {
        itemObj.sensitiveDetailsHidden = '[Protected Sensitive Detail]';
      }
      return itemObj;
    });

    return res.status(200).json({
      success: true,
      count: sanitizedItems.length,
      total,
      totalPages: Math.ceil(total / parseInt(limit)),
      currentPage: parseInt(page),
      items: sanitizedItems
    });
  } catch (err) {
    console.error('Get items error:', err);
    return res.status(500).json({ success: false, message: 'Error retrieving items' });
  }
};

// @desc    Get single item by ID
// @route   GET /api/items/:id
// @access  Public (optional auth)
exports.getItemById = async (req, res) => {
  try {
    const rawId = req.params.id;
    let item = null;

    if (rawId.match(/^[0-9a-fA-F]{24}$/)) {
      item = await Item.findById(rawId)
        .populate('reportedBy', 'name email avatar department role phone')
        .populate('claimedBy', 'name email department')
        .populate('returnedBy', 'name email department avatar')
        .populate('foundRequest.requestedBy', 'name email avatar department rollNumber')
        .populate('matchedItems.item', 'title category images locationName status type itemCode complaintId');
    }

    if (!item) {
      item = await Item.findOne({
        $or: [
          { complaintId: rawId.trim().toUpperCase() },
          { itemCode: rawId.trim().toUpperCase() }
        ]
      })
        .populate('reportedBy', 'name email avatar department role phone')
        .populate('claimedBy', 'name email department')
        .populate('returnedBy', 'name email department avatar')
        .populate('foundRequest.requestedBy', 'name email avatar department rollNumber')
        .populate('matchedItems.item', 'title category images locationName status type itemCode complaintId');
    }

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    // Auto-generate complaintId & itemCode if missing on legacy documents
    if (!item.complaintId) {
      const year = new Date().getFullYear();
      const randomNum = Math.floor(100000 + Math.random() * 900000);
      item.complaintId = `CF-${year}-${randomNum}`;
      if (!item.itemCode) item.itemCode = item.complaintId;
      await item.save();
    }

    // Increment views
    item.viewsCount += 1;
    await item.save();

    const itemObj = item.toObject();

    // Mask phone number to protect privacy
    if (itemObj.reportedBy && itemObj.reportedBy.phone) {
      itemObj.reportedBy.phone = '••••••' + itemObj.reportedBy.phone.slice(-4);
    }

    // Sanitize sensitive details
    const isOwner = req.user && req.user.id === itemObj.reportedBy._id.toString();
    const isAdmin = req.user && req.user.role === 'admin';
    if (itemObj.isSensitive && !isOwner && !isAdmin) {
      itemObj.sensitiveDetailsHidden = '[Protected Sensitive Detail: Requires verification]';
    }

    return res.status(200).json({ success: true, item: itemObj });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error fetching item details' });
  }
};

// @desc    Get user's personal reports (lost & found) and submitted found requests
// @route   GET /api/items/my-reports
// @access  Private
exports.getMyReports = async (req, res) => {
  try {
    const [items, submittedRequests] = await Promise.all([
      Item.find({ reportedBy: req.user.id })
        .populate('foundRequest.requestedBy', 'name email avatar department rollNumber')
        .sort({ createdAt: -1 }),
      Item.find({ 'foundRequest.requestedBy': req.user.id })
        .populate('reportedBy', 'name department')
        .sort({ 'foundRequest.requestedAt': -1 })
    ]);

    return res.status(200).json({
      success: true,
      count: items.length,
      items,
      submittedRequests: submittedRequests || []
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error fetching your reports' });
  }
};

// @desc    Get items for digital notice board on landing page
// @route   GET /api/items/notice-board
// @access  Public
exports.getNoticeBoardItems = async (req, res) => {
  try {
    const recentFound = await Item.find({
      type: 'found',
      status: 'active'
    })
      .sort({ createdAt: -1 })
      .limit(6)
      .select('title category images locationName campusBuilding dateTime createdAt');

    const emergencyLost = await Item.find({
      isEmergencyId: true,
      status: 'active'
    })
      .sort({ createdAt: -1 })
      .limit(4)
      .select('title category images locationName idCardRollNo dateTime createdAt');

    return res.status(200).json({
      success: true,
      recentFound,
      emergencyLost
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error loading notice board' });
  }
};

// @desc    Check potential duplicate before posting
// @route   POST /api/items/check-duplicate
// @access  Private
exports.checkDuplicateItem = async (req, res) => {
  try {
    const { title, category, type, locationName } = req.body;
    const result = await checkDuplicate({ title, category, type, locationName });
    return res.status(200).json({ success: true, ...result });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Duplicate check failed' });
  }
};

// @desc    Trigger AI visual match for an item on demand
// @route   POST /api/items/:id/ai-match
// @access  Private
exports.runAiMatch = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const oppositeType = item.type === 'lost' ? 'found' : 'lost';
    const candidates = await Item.find({
      type: oppositeType,
      status: 'active'
    }).lean();

    const queryImage = item.images && item.images.length > 0 ? item.images[0] : null;
    const matches = await matchItemImages(queryImage, candidates, item.category);

    return res.status(200).json({
      success: true,
      item: item.title,
      matchesFound: matches.length,
      matches
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error running AI matching' });
  }
};

// @desc    Update item report
// @route   PUT /api/items/:id
// @access  Private
exports.updateItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    if (item.reportedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this report' });
    }

    const updated = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true });
    return res.status(200).json({ success: true, item: updated });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error updating report' });
  }
};

// @desc    Delete item report
// @route   DELETE /api/items/:id
// @access  Private
exports.deleteItem = async (req, res) => {
  try {
    const item = await Item.findById(req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    if (item.reportedBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this report' });
    }

    await Item.findByIdAndDelete(req.params.id);
    return res.status(200).json({ success: true, message: 'Report removed successfully' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error deleting report' });
  }
};

// @desc    Preview item before return handover using Item ID
// @route   POST /api/items/preview-return
// @access  Private
exports.previewReturnById = async (req, res) => {
  try {
    const { itemCode } = req.body;
    if (!itemCode || !itemCode.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide the Item ID.' });
    }

    const cleanCode = itemCode.trim().toUpperCase();
    let item = await Item.findOne({
      $or: [{ complaintId: cleanCode }, { itemCode: cleanCode }]
    }).populate('reportedBy', 'name email department rollNumber avatar');
    if (!item && cleanCode.match(/^[0-9a-fA-F]{24}$/)) {
      item = await Item.findById(cleanCode).populate('reportedBy', 'name email department rollNumber avatar');
    }

    if (!item) {
      return res.status(404).json({
        success: false,
        message: `No item found matching Item ID "${cleanCode}". Please double check the ID entered.`
      });
    }

    const isAlreadyReturned = item.status === 'returned';

    return res.status(200).json({
      success: true,
      item: {
        _id: item._id,
        itemCode: item.itemCode,
        title: item.title,
        type: item.type,
        category: item.category,
        description: item.description,
        status: item.status,
        locationName: item.locationName,
        campusBuilding: item.campusBuilding,
        dateTime: item.dateTime,
        images: item.images,
        reportedBy: item.reportedBy ? {
          name: item.reportedBy.name,
          email: item.reportedBy.email,
          department: item.reportedBy.department,
          rollNumber: item.reportedBy.rollNumber,
          avatar: item.reportedBy.avatar
        } : null,
        recoveredAt: item.recoveredAt
      },
      canReturn: !isAlreadyReturned,
      message: isAlreadyReturned
        ? `This item was already marked as RETURNED on ${new Date(item.recoveredAt).toLocaleString()}.`
        : 'Item verified! You can proceed to confirm return handover.'
    });
  } catch (err) {
    console.error('Preview return error:', err);
    return res.status(500).json({ success: false, message: 'Error looking up item' });
  }
};

// @desc    Submit item return using Item ID (Awards +50 Karma Points to returner)
// @route   POST /api/items/return-by-id
// @access  Private
exports.returnItemById = async (req, res) => {
  try {
    const { itemCode, returnNotes, returnedLocation } = req.body;

    if (!itemCode || !itemCode.trim()) {
      return res.status(400).json({ success: false, message: 'Please enter the Item ID to submit return.' });
    }

    const cleanCode = itemCode.trim().toUpperCase();
    let item = await Item.findOne({
      $or: [{ complaintId: cleanCode }, { itemCode: cleanCode }]
    }).populate('reportedBy', 'name email department rollNumber');
    if (!item && cleanCode.match(/^[0-9a-fA-F]{24}$/)) {
      item = await Item.findById(cleanCode).populate('reportedBy', 'name email department rollNumber');
    }

    if (!item) {
      return res.status(404).json({
        success: false,
        message: `Invalid Item ID "${cleanCode}". Please verify the code generated when the item was reported.`
      });
    }

    if (item.status === 'returned') {
      return res.status(400).json({
        success: false,
        message: `This item was already marked returned on ${new Date(item.recoveredAt || item.updatedAt).toLocaleString()}.`
      });
    }

    // Mark item as returned
    item.status = 'returned';
    item.recoveredAt = new Date();
    item.returnedBy = req.user.id;
    item.returnNotes = returnNotes || 'Item returned to owner / campus desk';
    if (returnedLocation) {
      item.returnedLocation = returnedLocation;
    }
    await item.save();

    // Award 50 Karma points to the person who returned it
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

    // Notify the user who reported the lost item
    const owner = item.reportedBy;
    if (owner && owner._id) {
      await Notification.create({
        recipient: owner._id,
        title: 'Your Lost Item Has Been Returned! 🎉',
        message: `Great news! "${item.title}" was returned by ${returner ? returner.name : 'a good Samaritan'} via Item ID ${item.itemCode}.`,
        type: 'item_returned',
        relatedItem: item._id
      });

      if (req.io) {
        req.io.to(`user_${owner._id}`).emit('notification', {
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
      message: `Return verified successfully! Item "${item.title}" is now marked as RECOVERED. You earned +50 Campus Karma Points!`,
      itemTitle: item.title,
      itemCode: item.itemCode,
      category: item.category,
      itemImage: item.images && item.images.length > 0 ? item.images[0] : null,
      returnedAt: item.recoveredAt,
      ownerName: owner ? owner.name : 'Reporter',
      returnerName: returner ? returner.name : 'Campus Member',
      rewardPointsGranted: 50
    });
  } catch (err) {
    console.error('Return item by ID error:', err);
    return res.status(500).json({ success: false, message: err.message || 'Error processing item return' });
  }
};

// @desc    Verify Complaint ID for Found Item Request (Without exposing private owner info)
// @route   POST /api/items/verify-complaint-id
// @access  Private
exports.verifyComplaintId = async (req, res) => {
  try {
    const rawId = req.body.complaintId || req.body.itemCode;
    if (!rawId || !rawId.trim()) {
      return res.status(400).json({ success: false, message: 'Please enter a Complaint ID.' });
    }

    const cleanId = rawId.trim().toUpperCase();

    // Query by complaintId or itemCode (or ObjectId fallback if applicable)
    let item = await Item.findOne({
      $or: [{ complaintId: cleanId }, { itemCode: cleanId }]
    }).populate('reportedBy', 'name department');

    if (!item && cleanId.match(/^[0-9a-fA-F]{24}$/)) {
      item = await Item.findById(cleanId).populate('reportedBy', 'name department');
    }

    // Exact user requirement: "If the ID is incorrect, show "Invalid Complaint ID""
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Invalid Complaint ID'
      });
    }

    // Ensure the complaint is registered as a lost item
    if (item.type !== 'lost') {
      return res.status(400).json({
        success: false,
        message: 'This Complaint ID does not belong to a lost item complaint.'
      });
    }

    // Check if complaint is eligible for a found request
    if (['resolved', 'returned'].includes(item.status)) {
      return res.status(400).json({
        success: false,
        message: `This complaint was already resolved on ${new Date(item.recoveredAt || item.updatedAt).toLocaleDateString()}.`
      });
    }

    if (item.status === 'handover_pending') {
      return res.status(400).json({
        success: false,
        message: 'A found item request has already been accepted and handover is currently pending.'
      });
    }

    if (item.status === 'verification_pending') {
      return res.status(400).json({
        success: false,
        message: 'A verification request is already pending review by the complaint owner.'
      });
    }

    // Prevent complaint owner from submitting found request to their own complaint
    if (req.user && item.reportedBy && item.reportedBy._id.toString() === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'You cannot submit a found item request for your own complaint.'
      });
    }

    // Mask owner name to protect private information (e.g. "Aravind Kumar" -> "A*** K***")
    const ownerName = item.reportedBy?.name || 'Campus Member';
    const maskedOwnerName = ownerName
      .split(' ')
      .map((part) => (part.length > 1 ? part[0] + '***' : part + '***'))
      .join(' ');

    // Record verification check in audit history
    item.verificationHistory.push({
      action: 'id_verification_check',
      performedBy: req.user ? req.user.id : null,
      performedByName: req.user ? req.user.name : 'Finder',
      timestamp: new Date(),
      notes: `Complaint ID ${item.complaintId || item.itemCode} verified successfully by ${req.user ? req.user.name : 'finder'}.`
    });
    await item.save();

    return res.status(200).json({
      success: true,
      message: 'Complaint ID verified successfully! You can proceed with the Found Item Request.',
      complaint: {
        _id: item._id,
        complaintId: item.complaintId || item.itemCode,
        itemCode: item.itemCode,
        title: item.title,
        category: item.category,
        description: item.description,
        locationName: item.locationName,
        campusBuilding: item.campusBuilding,
        dateTime: item.dateTime,
        images: item.images,
        status: item.status,
        ownerPreview: {
          name: maskedOwnerName,
          department: item.reportedBy?.department || 'Campus Department'
        }
      }
    });
  } catch (err) {
    console.error('Verify Complaint ID error:', err);
    return res.status(500).json({ success: false, message: 'Error verifying Complaint ID' });
  }
};

// @desc    Submit a Found Item Request against a Lost Complaint ID
// @route   POST /api/items/found-request
// @access  Private
exports.submitFoundRequest = async (req, res) => {
  try {
    const { complaintId, foundNotes, foundLocation, foundImage } = req.body;

    if (!complaintId || !complaintId.trim()) {
      return res.status(400).json({ success: false, message: 'Complaint ID is required' });
    }
    if (!foundLocation || !foundLocation.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide the location where you found the item' });
    }

    const cleanId = complaintId.trim().toUpperCase();

    let item = await Item.findOne({
      $or: [{ complaintId: cleanId }, { itemCode: cleanId }]
    }).populate('reportedBy', 'name email');

    if (!item && cleanId.match(/^[0-9a-fA-F]{24}$/)) {
      item = await Item.findById(cleanId).populate('reportedBy', 'name email');
    }

    if (!item) {
      return res.status(404).json({ success: false, message: 'Invalid Complaint ID' });
    }

    if (item.type !== 'lost') {
      return res.status(400).json({ success: false, message: 'This Complaint ID is not registered as a lost item' });
    }

    if (item.reportedBy && item.reportedBy._id.toString() === req.user.id) {
      return res.status(400).json({ success: false, message: 'You cannot submit a found item request for your own complaint.' });
    }

    if (['resolved', 'returned'].includes(item.status)) {
      return res.status(400).json({ success: false, message: 'This complaint has already been resolved.' });
    }

    if (item.status === 'handover_pending') {
      return res.status(400).json({ success: false, message: 'A found request has already been accepted and handover is pending.' });
    }

    if (item.status === 'verification_pending') {
      return res.status(400).json({ success: false, message: 'A verification request is already pending review by the complaint owner.' });
    }

    // Process uploaded image if sent via multipart form
    let processedImage = foundImage || '';
    if (req.file) {
      processedImage = req.file.path || `/uploads/${req.file.filename}`;
    }

    // Update item status to verification_pending (DO NOT resolve automatically!)
    item.status = 'verification_pending';
    item.foundRequest = {
      requestedBy: req.user.id,
      requestedByName: req.user.name,
      foundNotes: foundNotes ? foundNotes.trim() : 'Item found and submitted for verification',
      foundLocation: foundLocation.trim(),
      foundImage: processedImage,
      requestedAt: new Date(),
      status: 'pending_approval'
    };

    // Audit history entry
    item.verificationHistory.push({
      action: 'found_request_submitted',
      performedBy: req.user.id,
      performedByName: req.user.name,
      timestamp: new Date(),
      notes: `Found Item Request submitted by ${req.user.name} (Location: ${foundLocation.trim()})`
    });

    await item.save();

    // Notify the original complaint owner
    const ownerId = item.reportedBy?._id || item.reportedBy;
    if (ownerId) {
      await Notification.create({
        recipient: ownerId,
        title: `Found Item Request Received (${item.complaintId || item.itemCode})`,
        message: `${req.user.name} reported finding your lost item "${item.title}". Please review their request in your dashboard to accept or reject.`,
        type: 'found_request_received',
        relatedItem: item._id,
        metadata: {
          complaintId: item.complaintId || item.itemCode,
          finderName: req.user.name,
          foundLocation: foundLocation.trim(),
          foundNotes: foundNotes || ''
        }
      });

      if (req.io) {
        req.io.to(`user_${ownerId}`).emit('notification', {
          title: `Found Item Request Received (${item.complaintId || item.itemCode})`,
          message: `${req.user.name} reported finding your lost item "${item.title}". Review to accept or reject.`,
          type: 'found_request_received',
          itemId: item._id,
          complaintId: item.complaintId || item.itemCode
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Found Item Request submitted successfully! The complaint owner has been notified to review and approve.',
      complaintId: item.complaintId || item.itemCode,
      item
    });
  } catch (err) {
    console.error('Submit found request error:', err);
    return res.status(500).json({ success: false, message: 'Error submitting found item request' });
  }
};

// @desc    Complaint Owner accepts or rejects a Found Item Request
// @route   POST /api/items/:id/owner-decision
// @access  Private (Owner only)
exports.handleOwnerDecision = async (req, res) => {
  try {
    const { action, rejectionReason } = req.body; // 'accept' or 'reject'
    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action. Must be "accept" or "reject".' });
    }

    const item = await Item.findById(req.params.id).populate('reportedBy', 'name email');
    if (!item) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Verify ownership
    if (item.reportedBy._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only the original complaint owner is authorized to accept or reject this request.'
      });
    }

    // Ensure complaint is in verification_pending status
    if (item.status !== 'verification_pending' || !item.foundRequest || item.foundRequest.status !== 'pending_approval') {
      return res.status(400).json({
        success: false,
        message: 'There is no pending found item request awaiting approval for this complaint.'
      });
    }

    const finderId = item.foundRequest.requestedBy;
    const finderName = item.foundRequest.requestedByName || 'Finder';

    if (action === 'accept') {
      // Transition to handover_pending
      item.status = 'handover_pending';
      item.foundRequest.status = 'accepted';
      item.foundRequest.ownerResponseAt = new Date();

      item.verificationHistory.push({
        action: 'owner_accepted_request',
        performedBy: req.user.id,
        performedByName: req.user.name,
        timestamp: new Date(),
        notes: `Complaint owner approved the found item request from ${finderName}. Handover arranged.`
      });

      await item.save();

      // Notify the finder
      if (finderId) {
        await Notification.create({
          recipient: finderId,
          title: `Found Item Request Accepted! 🤝 (${item.complaintId || item.itemCode})`,
          message: `The owner approved your request for "${item.title}". Please arrange item handover. Once handover is completed, the owner will confirm receipt.`,
          type: 'found_request_accepted',
          relatedItem: item._id
        });

        if (req.io) {
          req.io.to(`user_${finderId}`).emit('notification', {
            title: `Found Item Request Accepted! 🤝 (${item.complaintId || item.itemCode})`,
            message: `The owner approved your request for "${item.title}". Please arrange handover.`,
            type: 'found_request_accepted',
            itemId: item._id
          });
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Request accepted! Handover is now arranged. Once you receive the item, please confirm receipt to resolve the complaint.',
        item
      });
    } else {
      // Rejection: revert complaint status to 'active'
      item.status = 'active';
      item.foundRequest.status = 'rejected';
      item.foundRequest.ownerResponseAt = new Date();
      item.foundRequest.ownerRejectionReason = rejectionReason ? rejectionReason.trim() : 'Owner confirmed this is not their item';

      item.verificationHistory.push({
        action: 'owner_rejected_request',
        performedBy: req.user.id,
        performedByName: req.user.name,
        timestamp: new Date(),
        notes: `Complaint owner rejected request from ${finderName}. Reason: ${item.foundRequest.ownerRejectionReason}`
      });

      await item.save();

      // Notify the finder
      if (finderId) {
        await Notification.create({
          recipient: finderId,
          title: `Found Item Request Not Accepted (${item.complaintId || item.itemCode})`,
          message: `The owner reviewed your found item request for "${item.title}" and did not confirm it was their item. The complaint remains active.`,
          type: 'found_request_rejected',
          relatedItem: item._id
        });

        if (req.io) {
          req.io.to(`user_${finderId}`).emit('notification', {
            title: `Found Item Request Not Accepted (${item.complaintId || item.itemCode})`,
            message: `The owner of "${item.title}" did not confirm the found request.`,
            type: 'found_request_rejected',
            itemId: item._id
          });
        }
      }

      return res.status(200).json({
        success: true,
        message: 'Found item request rejected. Your lost complaint remains active on the platform.',
        item
      });
    }
  } catch (err) {
    console.error('Owner decision error:', err);
    return res.status(500).json({ success: false, message: 'Error processing owner decision' });
  }
};

// @desc    Complaint Owner confirms item receipt and finalizes handover (Marks complaint RESOLVED)
// @route   POST /api/items/:id/confirm-received
// @access  Private (Owner only)
exports.confirmItemReceived = async (req, res) => {
  try {
    const { handoverNotes } = req.body;
    const item = await Item.findById(req.params.id).populate('reportedBy', 'name email');
    if (!item) {
      return res.status(404).json({ success: false, message: 'Complaint not found' });
    }

    // Verify ownership
    if (item.reportedBy._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only the original complaint owner can confirm receipt and resolve this complaint.'
      });
    }

    // Prevent multiple users from resolving the same complaint or resolving prematurely
    if (['resolved', 'returned'].includes(item.status)) {
      return res.status(400).json({
        success: false,
        message: `This complaint was already resolved on ${new Date(item.recoveredAt || item.updatedAt).toLocaleDateString()}.`
      });
    }

    if (item.status !== 'handover_pending') {
      return res.status(400).json({
        success: false,
        message: 'Cannot confirm handover until a found item request has been accepted.'
      });
    }

    const finderId = item.foundRequest?.requestedBy;
    const finderName = item.foundRequest?.requestedByName || 'Finder';

    // Transition complaint status to RESOLVED
    item.status = 'resolved';
    item.recoveredAt = new Date();
    item.returnedBy = finderId;
    item.returnNotes = handoverNotes ? handoverNotes.trim() : 'Handover confirmed by owner';
    if (item.foundRequest) {
      item.foundRequest.status = 'confirmed_received';
      item.foundRequest.handoverConfirmedAt = new Date();
    }

    // Audit history entry
    item.verificationHistory.push({
      action: 'handover_confirmed_resolved',
      performedBy: req.user.id,
      performedByName: req.user.name,
      timestamp: new Date(),
      notes: `Complaint owner confirmed item receipt from ${finderName}. Complaint status changed to RESOLVED.`
    });

    await item.save();

    // Award +50 Karma Points to the finder
    let rewardPointsGranted = 0;
    if (finderId) {
      const finder = await User.findById(finderId);
      if (finder) {
        finder.rewardPoints = (finder.rewardPoints || 0) + 50;
        finder.itemsReturnedCount = (finder.itemsReturnedCount || 0) + 1;
        await finder.save();
        rewardPointsGranted = 50;

        await Reward.create({
          user: finder._id,
          points: 50,
          type: 'item_returned',
          description: `Handover verified! Returned item for Complaint ${item.complaintId || item.itemCode} ("${item.title}")`,
          item: item._id
        });

        // Notify finder
        await Notification.create({
          recipient: finder._id,
          title: 'Item Handover Confirmed! 🎉 +50 Karma Points',
          message: `The owner confirmed receipt of "${item.title}" (${item.complaintId || item.itemCode}). Complaint is now officially RESOLVED. Thank you for your honesty!`,
          type: 'item_returned',
          relatedItem: item._id
        });

        if (req.io) {
          req.io.to(`user_${finder._id}`).emit('notification', {
            title: 'Item Handover Confirmed! 🎉 +50 Karma Points',
            message: `The owner confirmed receipt of "${item.title}". You earned +50 Karma points!`,
            type: 'item_returned',
            rewardPoints: 50
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Item handover confirmed! Complaint status has been changed to RESOLVED.',
      complaintId: item.complaintId || item.itemCode,
      status: item.status,
      recoveredAt: item.recoveredAt,
      rewardPointsGranted,
      item
    });
  } catch (err) {
    console.error('Confirm item received error:', err);
    return res.status(500).json({ success: false, message: 'Error confirming item receipt' });
  }
};

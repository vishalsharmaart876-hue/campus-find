const Item = require('../models/Item');

/**
 * Checks for potential duplicate reports based on title similarity,
 * category, and reported location within the last 14 days.
 */
exports.checkDuplicate = async ({ title, category, type, locationName }) => {
  if (!title) return { hasDuplicate: false, potentialDuplicates: [] };

  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

  // Extract clean keywords from title (words > 2 letters)
  const keywords = title
    .toLowerCase()
    .replace(/[^a-zA-Z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2);

  if (keywords.length === 0) {
    return { hasDuplicate: false, potentialDuplicates: [] };
  }

  // Build regex query matching any of the main keywords
  const regexPattern = keywords.map((k) => `(?=.*${k})`).join('');
  const regex = new RegExp(keywords.join('|'), 'i');

  const candidates = await Item.find({
    type, // Match same type (lost vs lost or found vs found)
    status: { $in: ['active', 'claim_pending'] },
    category,
    createdAt: { $gte: fourteenDaysAgo }
  })
    .select('_id title category locationName dateTime images createdAt')
    .limit(5)
    .lean();

  const matchingItems = candidates.filter((item) => {
    // Check if title has keyword matches
    const itemTitle = item.title.toLowerCase();
    const hasWordMatch = keywords.some((kw) => itemTitle.includes(kw));
    return hasWordMatch;
  });

  return {
    hasDuplicate: matchingItems.length > 0,
    potentialDuplicates: matchingItems
  };
};

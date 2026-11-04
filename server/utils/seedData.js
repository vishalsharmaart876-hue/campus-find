const User = require('../models/User');
const Item = require('../models/Item');
const Claim = require('../models/Claim');
const CampusLocation = require('../models/CampusLocation');
const Reward = require('../models/Reward');
const Notification = require('../models/Notification');

const seedInitialData = async () => {
  try {
    const locationCount = await CampusLocation.countDocuments();
    if (locationCount > 0) {
      console.log('[Seed] Campus locations already present. Skipping seed.');
      return;
    }

    console.log('[Seed] Seeding standard campus landmarks...');

    // Only create standard campus locations (No dummy users)
    await CampusLocation.create([
      {
        name: 'Central Library',
        code: 'LIB-01',
        category: 'Library',
        lat: 28.5458,
        lng: 77.1926,
        description: 'Main 3-storey university library. Safekeeping desk located at Ground Floor reception.',
        safekeepingDeskAvailable: true
      },
      {
        name: 'Science & Technology Block',
        code: 'TECH-A',
        category: 'Academic',
        lat: 28.5469,
        lng: 77.1942,
        description: 'Computer Science, Electrical and Mechanical Engineering labs.',
        safekeepingDeskAvailable: true
      },
      {
        name: 'Student Activity Center & Food Court',
        code: 'SAC-01',
        category: 'Food & Dining',
        lat: 28.5442,
        lng: 77.1915,
        description: 'Campus cafeteria, recreational hall, and lost & found drop box.',
        safekeepingDeskAvailable: true
      },
      {
        name: 'Sports Complex & Gymnasium',
        code: 'SPT-GYM',
        category: 'Sports',
        lat: 28.5431,
        lng: 77.1955,
        description: 'Indoor courts, gym and football field bleachers.',
        safekeepingDeskAvailable: false
      },
      {
        name: 'Hostel Block 3 (Vindhya)',
        code: 'HST-03',
        category: 'Hostel',
        lat: 28.5475,
        lng: 77.1898,
        description: 'Residential dormitories and common study room.',
        safekeepingDeskAvailable: false
      },
      {
        name: 'Campus Main Gate 1 & Security HQ',
        code: 'GATE-01',
        category: 'Gate/Security',
        lat: 28.5422,
        lng: 77.1901,
        description: 'Central security office and designated safe exchange point.',
        safekeepingDeskAvailable: true
      }
    ]);

    console.log('[Seed] Campus landmarks seeded successfully.');
  } catch (err) {
    console.error('[Seed] Error seeding locations:', err);
  }
};

module.exports = { seedInitialData };

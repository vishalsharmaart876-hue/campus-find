const User = require('../models/User');
const Item = require('../models/Item');
const Claim = require('../models/Claim');
const CampusLocation = require('../models/CampusLocation');
const Reward = require('../models/Reward');
const Notification = require('../models/Notification');

const seedInitialData = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount > 0) {
      console.log('[Seed] Database already contains records. Skipping automatic seed.');
      return;
    }

    console.log('[Seed] Empty database detected. Seeding realistic campus data...');

    // 1. Create Users
    const adminUser = await User.create({
      name: 'Dr. Rajesh Verma',
      email: 'admin@poornima.edu.in',
      password: 'Admin@123',
      role: 'admin',
      department: 'Campus Security & Administration',
      rollNumber: 'EMP-ADM-001',
      phone: '9876543210',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      rewardPoints: 120,
      isVerified: true
    });

    const student1 = await User.create({
      name: 'Aravind Sharma',
      email: 'aravind@poornima.edu.in',
      password: 'Student@123',
      role: 'student',
      department: 'Computer Science & Engineering',
      rollNumber: 'CS2024-042',
      phone: '9811223344',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150',
      rewardPoints: 150,
      itemsReportedCount: 3,
      itemsReturnedCount: 2,
      isVerified: true
    });

    const student2 = await User.create({
      name: 'Priya Patel',
      email: 'priya@poornima.edu.in',
      password: 'Student@123',
      role: 'student',
      department: 'Electronics & Communication',
      rollNumber: 'EC2024-118',
      phone: '9822334455',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      rewardPoints: 80,
      itemsReportedCount: 2,
      itemsReturnedCount: 1,
      isVerified: true
    });

    const facultyUser = await User.create({
      name: 'Prof. Sunita Rao',
      email: 'prof.sharma@poornima.edu.in',
      password: 'Faculty@123',
      role: 'faculty',
      department: 'Department of Mechanical Engineering',
      rollNumber: 'FAC-MECH-04',
      phone: '9833445566',
      avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150',
      rewardPoints: 50,
      itemsReportedCount: 1,
      itemsReturnedCount: 1,
      isVerified: true
    });

    // 2. Create Campus Locations (Coordinates centred near a typical university campus)
    const locations = await CampusLocation.create([
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

    // 3. Create Items (Skip if SEED_SAMPLE_ITEMS is set to false)
    if (process.env.SEED_SAMPLE_ITEMS === 'false') {
      console.log('[Seed] SEED_SAMPLE_ITEMS=false: Skipping demo items, claims, and notifications for clean start.');
      console.log('[Seed] Accounts ready:');
      console.log('       Admin: admin@poornima.edu.in / Admin@123');
      console.log('       Student: aravind@poornima.edu.in / Student@123');
      console.log('       Student 2: priya@poornima.edu.in / Student@123');
      console.log('       Faculty: prof.sharma@poornima.edu.in / Faculty@123');
      return;
    }

    const item1 = await Item.create({
      type: 'found',
      title: 'HP 15-inch Laptop with Blue Neoprene Sleeve',
      category: 'Electronics',
      description: 'Found on a study desk on the 2nd floor of Central Library near the quiet reading zone. The laptop is in a navy blue zippered sleeve.',
      images: [
        'https://images.unsplash.com/photo-1588872657578-7efd1f1555ed?w=600'
      ],
      locationName: 'Central Library, 2nd Floor Reading Zone',
      campusBuilding: 'Central Library',
      coordinates: { lat: 28.5458, lng: 77.1926 },
      dateTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      contactPreference: 'in_app_chat',
      isSensitive: true,
      sensitiveDetailsHidden: 'Contains a sticker of GitHub Octocat and specific wallpaper picture.',
      verificationQuestions: [
        'What specific brand sticker is on the laptop lid?',
        'What color is the zipper pull on the blue sleeve?'
      ],
      status: 'active',
      reportedBy: student2._id,
      viewsCount: 42
    });

    const item2 = await Item.create({
      type: 'lost',
      title: 'HP Pavilion Laptop in Blue Case',
      category: 'Electronics',
      description: 'Lost my HP Pavilion laptop while studying for Midterms in the library. Left it on table 14 while taking a break.',
      images: [
        'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=600'
      ],
      locationName: 'Central Library 2nd Floor',
      campusBuilding: 'Central Library',
      coordinates: { lat: 28.5459, lng: 77.1927 },
      dateTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      contactPreference: 'in_app_chat',
      status: 'active',
      reportedBy: student1._id,
      viewsCount: 29
    });

    // Pair item1 and item2 with simulated match
    item2.matchedItems = [
      {
        item: item1._id,
        similarityScore: 84.5,
        matchedAt: new Date()
      }
    ];
    await item2.save();

    const itemEmergency = await Item.create({
      type: 'lost',
      title: 'Lost Student ID Card - Aravind Sharma (CS2024-042)',
      category: 'ID & Cards',
      description: 'Misplaced my official university student identification card near the cafeteria counter. Needed urgently for upcoming lab exams!',
      images: [
        'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600'
      ],
      locationName: 'Food Court Counter 3',
      campusBuilding: 'Student Activity Center & Food Court',
      coordinates: { lat: 28.5442, lng: 77.1915 },
      dateTime: new Date(Date.now() - 5 * 60 * 60 * 1000),
      isEmergencyId: true,
      idCardRollNo: 'CS2024-042',
      contactPreference: 'in_app_chat',
      status: 'active',
      reportedBy: student1._id,
      viewsCount: 65
    });

    const item3 = await Item.create({
      type: 'found',
      title: 'Casio Scientific Calculator FX-991EX',
      category: 'Electronics',
      description: 'Found on table in Room 304 after Engineering Thermodynamics lecture. Black casing with transparent slip-cover.',
      images: [
        'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?w=600'
      ],
      locationName: 'Science & Technology Block, Room 304',
      campusBuilding: 'Science & Technology Block',
      coordinates: { lat: 28.5469, lng: 77.1942 },
      dateTime: new Date(Date.now() - 24 * 60 * 60 * 1000),
      contactPreference: 'safekeeping_desk',
      isSensitive: false,
      verificationQuestions: ['Is there any name written on the back cover?'],
      status: 'active',
      reportedBy: facultyUser._id,
      viewsCount: 18
    });

    const item4 = await Item.create({
      type: 'found',
      title: 'Titan Silver Wristwatch with Brown Strap',
      category: 'Jewelry',
      description: 'Found near badminton court bleachers in the indoor sports complex during evening practice.',
      images: [
        'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=600'
      ],
      locationName: 'Sports Complex Badminton Court #2',
      campusBuilding: 'Sports Complex & Gymnasium',
      coordinates: { lat: 28.5431, lng: 77.1955 },
      dateTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      contactPreference: 'in_app_chat',
      isSensitive: true,
      sensitiveDetailsHidden: 'Dial has Roman numerals and a small scratch at the 4 o’clock position.',
      verificationQuestions: [
        'What color is the dial face?',
        'Describe the buckle type.'
      ],
      status: 'active',
      reportedBy: student1._id,
      viewsCount: 35
    });

    const item5 = await Item.create({
      type: 'lost',
      title: 'Black North Face Backpack with Notebooks',
      category: 'Bags & Wallets',
      description: 'Left on the bench at North Campus Bus Stop while waiting for route 7 bus. Has lecture notebooks for Signals and Systems.',
      images: [
        'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600'
      ],
      locationName: 'North Campus Bus Stop',
      campusBuilding: 'Campus Main Gate 1 & Security HQ',
      coordinates: { lat: 28.5422, lng: 77.1901 },
      dateTime: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
      status: 'active',
      reportedBy: student2._id,
      viewsCount: 51
    });

    // 4. Create an Approved Claim with QR code for demonstration
    const claimDemo = await Claim.create({
      item: item1._id,
      claimant: student1._id,
      answers: [
        { question: 'What specific brand sticker is on the laptop lid?', answer: 'GitHub Octocat holographic sticker' },
        { question: 'What color is the zipper pull on the blue sleeve?', answer: 'Bright orange zipper pull' }
      ],
      proofDescription: 'I have the original purchase invoice and serial number matching HP-CNU91823. I can unlock with fingerprint.',
      status: 'approved',
      reviewedBy: student2._id,
      reviewNotes: 'Verified sticker and orange zipper pull match the item. QR code generated for collection.',
      qrCodeToken: 'CF-PICKUP-DEMO-9942',
      qrCodeExpiresAt: new Date(Date.now() + 48 * 60 * 60 * 1000)
    });

    // 5. Seed initial notifications
    await Notification.create([
      {
        recipient: student1._id,
        title: 'Claim Approved! Ready for pickup',
        message: 'Your claim for "HP 15-inch Laptop" was approved. Show your pickup QR code to the finder.',
        type: 'claim_approved',
        relatedItem: item1._id,
        relatedClaim: claimDemo._id
      },
      {
        recipient: student1._id,
        title: 'AI Visual Match Detected',
        message: 'A found laptop with 84.5% visual similarity was reported at Central Library.',
        type: 'match_found',
        relatedItem: item2._id
      }
    ]);

    // 6. Seed Rewards
    await Reward.create({
      user: student1._id,
      points: 50,
      type: 'item_returned',
      description: 'Successfully handed over lost scientific calculator to owner',
      item: item3._id
    });

    console.log('[Seed] Realistic campus data seeded successfully!');
    console.log('[Seed] Accounts ready:');
    console.log('       Admin: admin@poornima.edu.in / Admin@123');
    console.log('       Student: aravind@poornima.edu.in / Student@123');
    console.log('       Student 2: priya@poornima.edu.in / Student@123');
    console.log('       Faculty: prof.sharma@poornima.edu.in / Faculty@123');
  } catch (err) {
    console.error('[Seed] Error seeding data:', err);
  }
};

module.exports = { seedInitialData };

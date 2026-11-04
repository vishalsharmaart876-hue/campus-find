require('dotenv').config();
const readline = require('readline');
const mongoose = require('mongoose');
const { connectDB } = require('./config/db');
const User = require('./models/User');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const askQuestion = (query) => new Promise((resolve) => rl.question(query, resolve));

const run = async () => {
  try {
    await connectDB();
    console.log('\n======================================================');
    console.log('       CampusFind - Master Admin Account Creator       ');
    console.log('======================================================\n');

    const name = await askQuestion('Enter Admin Full Name: ');
    const email = await askQuestion('Enter Admin Poornima Email (@poornima.edu.in): ');
    const password = await askQuestion('Enter Secure Admin Password (min 6 chars): ');
    const phone = await askQuestion('Enter Contact Phone (optional): ');

    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail.endsWith('@poornima.edu.in')) {
      console.error('\n❌ Error: Admin email must end with @poornima.edu.in\n');
      process.exit(1);
    }

    if (!password || password.length < 6) {
      console.error('\n❌ Error: Password must be at least 6 characters long.\n');
      process.exit(1);
    }

    // Check if user already exists
    let existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      console.log(`\n⚠️  An account with ${cleanEmail} already exists. Updating to ADMIN role...`);
      existingUser.role = 'admin';
      existingUser.name = name.trim() || existingUser.name;
      existingUser.password = password; // Pre-save hook will hash it with bcrypt
      existingUser.isVerified = true;
      existingUser.isBanned = false;
      await existingUser.save();
      console.log(`\n✅ Account updated to Super Admin successfully!`);
    } else {
      await User.create({
        name: name.trim() || 'System Administrator',
        email: cleanEmail,
        password: password, // Will be bcrypt-hashed automatically by User model
        role: 'admin',
        department: 'Campus Security & Administration',
        rollNumber: 'ADMIN-01',
        phone: phone.trim() || '',
        isVerified: true
      });
      console.log(`\n✅ Master Admin account created successfully!`);
    }

    console.log('\n------------------------------------------------------');
    console.log(`Admin Email   : ${cleanEmail}`);
    console.log(`Admin Role    : admin (Full Privileges)`);
    console.log('------------------------------------------------------\n');

    process.exit(0);
  } catch (err) {
    console.error('\n❌ Error creating admin:', err.message);
    process.exit(1);
  } finally {
    rl.close();
  }
};

run();


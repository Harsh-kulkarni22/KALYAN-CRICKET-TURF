import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import User from './models/User.js';

dotenv.config();

const runPromotion = async () => {
  try {
    await connectDB();
    const email = 'hkkulkarni2212@gmail.com';
    let user = await User.findOne({ email });
    if (user) {
      console.log(`Found user: ${user.name}, current role: ${user.role}`);
      if (user.role !== 'admin') {
        user.role = 'admin';
        await user.save();
        console.log(`Promoted user ${email} to admin successfully.`);
      } else {
        console.log(`User ${email} is already an admin.`);
      }
    } else {
      console.log(`User ${email} not found in database. They will be auto-promoted to admin on their first login since ADMIN_CONTACT matches.`);
    }
  } catch (err) {
    console.error("Promotion failed:", err);
  } finally {
    process.exit(0);
  }
};

runPromotion();

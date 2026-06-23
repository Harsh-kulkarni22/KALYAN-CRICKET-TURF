import dotenv from 'dotenv';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import Settings from './models/Settings.js';

dotenv.config();

const checkSettings = async () => {
  try {
    await connectDB();
    const count = await Settings.countDocuments();
    const allSettings = await Settings.find();
    console.log(`Total Settings documents in DB: ${count}`);
    console.log("Documents:", allSettings);
  } catch (err) {
    console.error("Check settings failed:", err);
  } finally {
    process.exit(0);
  }
};

checkSettings();

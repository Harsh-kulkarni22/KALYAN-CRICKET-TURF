import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { sendEmail } from '../utils/emailService.js';
import User from '../models/User.js';
import OTP from '../models/OTP.js';



const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID1);

const rateLimitMap = new Map();

const isRateLimited = (contact) => {
  const now = Date.now();
  if (!rateLimitMap.has(contact)) {
    rateLimitMap.set(contact, [now]);
    return false;
  }

  const requests = rateLimitMap.get(contact).filter(time => now - time < 60000);
  if (requests.length >= 3) {
    rateLimitMap.set(contact, requests);
    return true;
  }

  requests.push(now);
  rateLimitMap.set(contact, requests);
  return false;
};

export const sendOTP = async (req, res) => {
  const { contact } = req.body;

  if (!contact) {
    return res.status(400).json({
      error: "Contact is required",
    });
  }

  try {
    if (isRateLimited(contact)) {
      return res.status(429).json({
        error: "Too many requests. Please try again later.",
      });
    }

    const isEmail = contact.includes("@");

    if (!isEmail) {
      return res.status(400).json({
        error: "Only email OTP is supported.",
      });
    }

    // Generate OTP
    const otp = crypto.randomInt(100000, 999999).toString();

    // Remove previous OTP
    await OTP.deleteOne({ contact });

    // Save new OTP
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await OTP.create({
      contact,
      otp,
      expiresAt,
    });

    // Send email using shared emailService
    await sendEmail(
      contact,
      "Turf Booking Login OTP",
      `
        <div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #1b4332; margin-top: 0;">🏏 KALYAN Cricket Turf</h2>
          <p>Your OTP for login is:</p>
          <h1 style="color: #1b4332; font-size: 32px; letter-spacing: 2px; margin: 10px 0;">${otp}</h1>
          <p>This OTP will expire in 5 minutes.</p>
        </div>
      `
    );

    return res.status(200).json({
      message: "OTP sent successfully",
    });
  } catch (error) {
    console.error("OTP Delivery Error:", error);

    return res.status(500).json({
      error: error.message,
    });
  }
};


export const verifyOTP = async (req, res) => {
  const { contact, otp, name } = req.body;
  if (!contact || !otp) return res.status(400).json({ error: 'Contact and OTP are required' });

  try {
    const isEmail = contact.includes('@');
    if (!isEmail) {
      return res.status(400).json({ error: 'Backend OTP confirmation is disabled for phones.' });
    }

    const record = await OTP.findOne({ contact, otp });
    if (!record) return res.status(400).json({ error: 'Invalid or expired OTP' });
    if (record.expiresAt < new Date()) {
      await OTP.deleteOne({ _id: record._id });
      return res.status(400).json({ error: 'OTP expired' });
    }

    // Find or create user
    let user = await User.findOne({ $or: [{ email: contact }, { phone: contact }] });

    if (user && user.isBlocked) {
      return res.status(403).json({ error: 'Your account has been blocked. Please contact admin.' });
    }

    if (!user) {
      if (!name) return res.status(400).json({ error: 'Profile setup required. Provide name.', needsProfile: true });
      const isAdmin = process.env.ADMIN_CONTACT && (contact === process.env.ADMIN_CONTACT);
      user = new User({
        name,
        email: isEmail ? contact : undefined,
        phone: !isEmail ? contact : undefined,
        authType: isEmail ? 'email' : 'phone',
        role: isAdmin ? 'admin' : 'user'
      });
      await user.save();
    } else if (process.env.ADMIN_CONTACT && (contact === process.env.ADMIN_CONTACT) && user.role !== 'admin') {
      user.role = 'admin';
      await user.save();
    }

    // OTP fully consumed, clear it
    await OTP.deleteOne({ _id: record._id });

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ message: 'Login successful', token, user });

  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const googleLogin = async (req, res) => {
  const { credential, accessToken } = req.body;
  if (!credential && !accessToken) return res.status(400).json({ error: 'Google credentials or accessToken are required' });

  try {
    let email, name, googleId;

    if (credential) {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
      const payload = ticket.getPayload();
      email = payload.email;
      name = payload.name;
      googleId = payload.sub;
    } else {
      const response = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const data = await response.json();
      if (!response.ok) return res.status(400).json({ error: 'Failed to fetch Google profile' });
      email = data.email;
      name = data.name;
      googleId = data.sub;
    }

    let user = await User.findOne({ email });
    if (user && user.isBlocked) {
      return res.status(403).json({ error: 'Your account has been blocked. Please contact admin.' });
    }

    if (!user) {
      const isAdmin = process.env.ADMIN_CONTACT && (email === process.env.ADMIN_CONTACT);
      user = new User({ name, email, googleId, authType: 'google', role: isAdmin ? 'admin' : 'user' });
      await user.save();
    } else {
      let updated = false;
      if (!user.googleId) {
        user.googleId = googleId;
        updated = true;
      }
      if (process.env.ADMIN_CONTACT && (email === process.env.ADMIN_CONTACT) && user.role !== 'admin') {
        user.role = 'admin';
        updated = true;
      }
      if (updated) {
        await user.save();
      }
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ message: 'Google login successful', token, user });

  } catch (error) {
    res.status(400).json({ error: 'Invalid Google token' });
  }
};

export const firebaseLogin = async (req, res) => {
  const { phone, name } = req.body;
  if (!phone) return res.status(400).json({ error: 'Phone is required for sync' });

  try {
    let user = await User.findOne({ phone });
    if (user && user.isBlocked) {
      return res.status(403).json({ error: 'Your account has been blocked. Please contact admin.' });
    }

    if (!user) {
      if (!name) return res.status(200).json({ needsProfile: true });
      const isAdmin = process.env.ADMIN_CONTACT && (phone === process.env.ADMIN_CONTACT);
      user = new User({ name, phone, authType: 'phone', role: isAdmin ? 'admin' : 'user' });
      await user.save();
    } else if (process.env.ADMIN_CONTACT && (phone === process.env.ADMIN_CONTACT) && user.role !== 'admin') {
      user.role = 'admin';
      await user.save();
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ message: 'Login successful', token, user });
  } catch (error) {
    console.error("Firebase Sync Error:", error);
    res.status(500).json({ error: 'Firebase synchronization failed' });
  }
};

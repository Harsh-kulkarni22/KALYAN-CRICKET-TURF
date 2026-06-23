import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import nodemailer from 'nodemailer';
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
  if (process.env.GOOGLE_CLIENT_ID1) {
    process.env.GOOGLE_CLIENT_ID1 = process.env.GOOGLE_CLIENT_ID1;
  }
  if (process.env.GOOGLE_CLIENT_SECRET1) {
    process.env.GOOGLE_CLIENT_SECRET1 = process.env.GOOGLE_CLIENT_SECRET1;
  }
  const { contact } = req.body;
  if (!contact) return res.status(400).json({ error: 'Contact (email or phone) is required' });

  try {
    if (isRateLimited(contact)) {
      return res.status(429).json({ error: 'Too many requests. Please try again after a minute.' });
    }

    const isEmail = contact.includes('@');
    if (!isEmail) {
      return res.status(400).json({ error: 'Mobile verifications are strictly restricted to Firebase! This API handles emails only.' });
    }

    console.log("Request body:", req.body);
    console.log("Contact:", contact);

    const otp = crypto.randomInt(100000, 999999).toString();
    console.log("Generated OTP:", otp);

    await OTP.deleteOne({ contact });

    const expiresAt = new Date(Date.now() + 5 * 60000); // 5 minutes

    try {
      await OTP.create({ contact, otp, expiresAt });
      console.log("OTP saved to MongoDB");
    } catch (error) {
      console.error("OTP CREATE ERROR:", error);
      throw error;
    }

    console.log("EMAIL_USER:", process.env.EMAIL_USER1);
    console.log("CLIENT_ID exists:", !!process.env.GOOGLE_CLIENT_ID1);
    console.log("CLIENT_SECRET exists:", !!process.env.GOOGLE_CLIENT_SECRET1);
    console.log("REFRESH_TOKEN exists:", !!process.env.GOOGLE_REFRESH_TOKEN1);

    console.log(!!process.env.EMAIL_USER1);
    console.log(!!process.env.GOOGLE_CLIENT_ID1);
    console.log(!!process.env.GOOGLE_CLIENT_SECRET1);
    console.log(!!process.env.GOOGLE_REFRESH_TOKEN);

    if (
      process.env.EMAIL_USER1 &&
      process.env.GOOGLE_CLIENT_ID1 &&
      process.env.GOOGLE_CLIENT_SECRET1 &&
      process.env.GOOGLE_REFRESH_TOKEN1
    ) {
      console.log("Creating OAuth client...");
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID1,
        process.env.GOOGLE_CLIENT_SECRET1,
        "http://localhost"
      );

      oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN
      });

      console.log("Generating access token...");
      let accessTokenResponse;
      try {
        accessTokenResponse = await oauth2Client.getAccessToken();
        console.log("Access token generated");
      } catch (error) {
        console.error("GET ACCESS TOKEN ERROR:", error);
        throw error;
      }

      console.log("Creating transporter...");
      let transporter;
      try {
        transporter = nodemailer.createTransport({
          service: "gmail",
          auth: {
            type: "OAuth2",
            user: process.env.EMAIL_USER1,
            clientId: process.env.GOOGLE_CLIENT_ID1,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET1,
            refreshToken: process.env.GOOGLE_REFRESH_TOKEN,
            accessToken: accessTokenResponse.token
          }
        });
      } catch (error) {
        console.error("CREATE TRANSPORTER ERROR:", error);
        throw error;
      }

      console.log("Sending email...");
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: contact,
          subject: "Turf Booking Login OTP",
          text: `Your OTP for Turf Booking login is: ${otp}. It expires in 5 minutes.`
        });
        console.log("Email sent successfully");
      } catch (error) {
        console.error("SEND MAIL ERROR:", error);
        throw error;
      }

      return res.status(200).json({
        message: "OTP sent successfully"
      });
    } else {
      console.log(
        `[DEV MODE] Email OTP for ${contact}: ${otp}`
      );
      return res.status(200).json({
        message: "OTP generated in DEV mode (check logs)"
      });
    }
  } catch (error) {
    console.error("OTP Delivery Error:", error);
    return res.status(500).json({
      error: error.message,
      stack: error.stack
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

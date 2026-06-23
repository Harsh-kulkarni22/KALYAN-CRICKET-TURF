import express from 'express';
import { sendOTP, verifyOTP, googleLogin, firebaseLogin } from '../controllers/authController.js';

const router = express.Router();

router.post('/send-otp', sendOTP);
router.post('/verify-otp', verifyOTP);
router.post('/google-login', googleLogin);
// Phone OTP disabled temporarily.
router.post('/firebase-login', firebaseLogin);

export default router;

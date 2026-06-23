import mongoose from 'mongoose';

const otpSchema = new mongoose.Schema({
  contact: { type: String, required: true }, // email or phone
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true, index: { expires: '5m' } }
}, { timestamps: true });

export default mongoose.model('OTP', otpSchema);

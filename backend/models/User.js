import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: false }, // optional if phone-only
  phone: { type: String, required: false }, // optional if email-only/google
  authType: { type: String, required: true, enum: ['phone', 'email', 'google'] },
  googleId: { type: String, required: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isBlocked: { type: Boolean, default: false },
  lastLogin: { type: Date }
}, { timestamps: true });

export default mongoose.model('User', userSchema);

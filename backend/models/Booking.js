import mongoose from 'mongoose';

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // Format YYYY-MM-DD
  startTime: { type: String, required: true }, // e.g., '14:00'
  duration: { type: Number, required: true }, // duration in hours, e.g., 1 or 2
  totalAmount: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['cash', 'online'], default: 'cash' },
  paymentStatus: { type: String, default: 'successful' },
  // paymentStatus: { type: String, enum: ['pending', 'successful', 'failed', 'cash'], default: 'pending' },
  bookingStatus: { type: String, enum: ['locked', 'confirmed', 'cancelled', 'expired'], default: 'locked' },
  razorpayOrderId: { type: String, required: false },
  razorpayPaymentId: { type: String, required: false },
  lockedUntil: { type: Date, required: false }, // Used for temporary slot locking
  reminderSent: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('Booking', bookingSchema);

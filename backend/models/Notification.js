import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  type: { 
    type: String, 
    required: true, 
    enum: ['new_booking', 'cancelled_booking', 'payment_received'] 
  },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  seenAt: { type: Date, required: false },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: false }
}, { timestamps: true });

export default mongoose.model('Notification', notificationSchema);

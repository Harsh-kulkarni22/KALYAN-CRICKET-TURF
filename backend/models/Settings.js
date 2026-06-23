import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema({
  pricePerHour: { type: Number, default: 600 },
  openTime: { type: String, default: '06:30' },
  closeTime: { type: String, default: '23:30' },
  instagramLink: { type: String, default: '' },
  googleMapsLink: { type: String, default: '' },
  maxBookingDuration: { type: Number, default: 2 },
  cashPaymentEnabled: { type: Boolean, default: true },
  onlinePaymentEnabled: { type: Boolean, default: true },
  emailNotificationsEnabled: { type: Boolean, default: false },
  smtpSenderEmail: { type: String, default: '' }
}, { timestamps: true });

export default mongoose.model('Settings', settingsSchema);

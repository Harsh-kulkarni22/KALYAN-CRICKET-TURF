import mongoose from 'mongoose';

const emailLogSchema = new mongoose.Schema({
  email: { type: String, required: true },
  messageType: { type: String, required: true },
  status: { type: String, enum: ['sent', 'failed', 'pending'], default: 'pending' },
  response: { type: String, required: false }
}, { timestamps: true });

export default mongoose.model('EmailLog', emailLogSchema);

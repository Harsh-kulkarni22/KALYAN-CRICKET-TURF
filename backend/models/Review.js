import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  rating: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 5 
  },
  review: { 
    type: String, 
    required: false,
    trim: true
  },
  venueId: { 
    type: String, 
    default: "KALYAN_CRICKET_TURF", 
    required: true,
    index: true
  }
}, { timestamps: true });

// A user can submit only one review per venue
reviewSchema.index({ userId: 1, venueId: 1 }, { unique: true });

export default mongoose.model('Review', reviewSchema);

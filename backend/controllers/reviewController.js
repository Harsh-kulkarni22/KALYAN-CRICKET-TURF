import Review from '../models/Review.js';
import Booking from '../models/Booking.js';

// Submit review (POST /api/reviews)
export const submitReview = async (req, res) => {
  const { rating, review } = req.body;
  const userId = req.user.id;

  if (!rating) {
    return res.status(400).json({ error: 'Rating is required' });
  }

  try {
    // Check if user has at least one confirmed booking
    const confirmedBooking = await Booking.findOne({
      userId,
      bookingStatus: 'confirmed'
    });

    if (!confirmedBooking) {
      return res.status(403).json({
        error: 'Only customers with bookings can review this venue.'
      });
    }

    // Upsert review (1 review per user for venueId "KALYAN_CRICKET_TURF")
    const updatedReview = await Review.findOneAndUpdate(
      { userId, venueId: "KALYAN_CRICKET_TURF" },
      { rating, review },
      { new: true, upsert: true, runValidators: true }
    );

    res.status(200).json({
      message: 'Review submitted successfully',
      review: updatedReview
    });
  } catch (error) {
    console.error('Submit review error:', error);
    res.status(500).json({ error: 'Failed to submit review' });
  }
};

// Get all reviews (GET /api/reviews)
export const getReviews = async (req, res) => {
  try {
    // 1. Calculate stats (average, total, and distribution)
    const stats = await Review.aggregate([
      { $match: { venueId: "KALYAN_CRICKET_TURF" } },
      {
        $group: {
          _id: null,
          averageRating: { $avg: "$rating" },
          totalReviews: { $sum: 1 },
          star5: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
          star4: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
          star3: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
          star2: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
          star1: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } }
        }
      }
    ]);

    // 2. Fetch populated reviews
    const reviews = await Review.find({ venueId: "KALYAN_CRICKET_TURF" })
      .populate('userId', 'name')
      .sort({ createdAt: -1 });

    const avg = stats[0] ? Number(stats[0].averageRating.toFixed(1)) : 0;
    const total = stats[0] ? stats[0].totalReviews : 0;
    const distribution = stats[0] ? {
      5: stats[0].star5,
      4: stats[0].star4,
      3: stats[0].star3,
      2: stats[0].star2,
      1: stats[0].star1
    } : { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };

    res.status(200).json({
      averageRating: avg,
      totalReviews: total,
      distribution,
      reviews
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
};

// Get current user's review (GET /api/reviews/my-review)
export const getMyReview = async (req, res) => {
  const userId = req.user.id;
  try {
    const userReview = await Review.findOne({ userId, venueId: "KALYAN_CRICKET_TURF" });
    res.status(200).json(userReview);
  } catch (error) {
    console.error('Get my-review error:', error);
    res.status(500).json({ error: 'Failed to fetch your review' });
  }
};

// Delete review (DELETE /api/reviews/:id)
export const deleteReview = async (req, res) => {
  const { id } = req.params;
  try {
    const deleted = await Review.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Review not found' });
    }
    res.status(200).json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ error: 'Failed to delete review' });
  }
};

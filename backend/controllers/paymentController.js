import crypto from 'crypto';
import Booking from '../models/Booking.js';
import Settings from '../models/Settings.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import { sendEmailNotification } from '../utils/sendEmailNotification.js';

const toMinutes = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

const checkOverlap = (start1, dur1, start2, dur2) => {
  const s1 = toMinutes(start1);
  const e1 = s1 + dur1 * 60;
  const s2 = toMinutes(start2);
  const e2 = s2 + dur2 * 60;
  return s1 < e2 && s2 < e1;
};

export const verifyPayment = async (req, res) => {
  return res.status(400).json({ error: 'Online payment is temporarily disabled.' });

  /* TEMPORARILY DISABLED
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, bookingData } = req.body;
  const userId = req.user.id;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !bookingData) {
    return res.status(400).json({ error: 'Incomplete payment details' });
  }

  try {
    // 1. Verify User status
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.isBlocked) {
      return res.status(403).json({ error: 'Your account has been blocked. Payment cannot be verified.' });
    }

    // 2. Find pre-locked booking
    const booking = await Booking.findOne({ razorpayOrderId: razorpay_order_id });
    if (!booking) {
      return res.status(404).json({ error: 'Matching checkout slot not found.' });
    }

    // 3. Verify signature
    const text = razorpay_order_id + '|' + razorpay_payment_id;
    const generated_signature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    if (generated_signature === razorpay_signature) {
      // 4. Overlap check for finalized slot (just in case slot was expired and someone else booked it)
      const activeBookings = await Booking.find({
        date: booking.date,
        _id: { $ne: booking._id },
        bookingStatus: 'confirmed'
      });

      const isOverlapping = activeBookings.some(b => 
        checkOverlap(b.startTime, b.duration, booking.startTime, booking.duration)
      );

      if (isOverlapping) {
        booking.bookingStatus = 'expired';
        await booking.save();
        return res.status(400).json({ error: 'Checkout session expired and slot has been booked by someone else. Refund will be initiated.' });
      }

      // 5. Confirm booking & payment
      booking.bookingStatus = 'confirmed';
      booking.paymentStatus = 'successful';
      booking.razorpayPaymentId = razorpay_payment_id;
      booking.lockedUntil = null;
      await booking.save();

      // Create Admin Notifications
      await Notification.create({
        type: 'new_booking',
        message: `New booking: ${user.name} booked ${booking.duration} Hr(s) on ${booking.date} at ${booking.startTime} (Online)`,
        bookingId: booking._id
      });

      await Notification.create({
        type: 'payment_received',
        message: `Online Payment Received: ₹${booking.totalAmount} from ${user.name} (ID: ${razorpay_payment_id})`,
        bookingId: booking._id
      });

      // Send Email message in background asynchronously
      sendEmailNotification({
        email: user.email,
        customerName: user.name,
        date: booking.date,
        time: booking.startTime,
        duration: `${booking.duration} Hr${booking.duration > 1 ? 's' : ''}`,
        amount: booking.totalAmount,
        paymentMethod: 'Online',
        bookingId: booking._id,
        type: 'booking_confirmation'
      }).catch(err => console.error('Email background error:', err));

      res.status(200).json({ message: 'Payment verified and booking confirmed', booking });
    } else {
      // Mark booking as cancelled due to invalid signature
      booking.bookingStatus = 'cancelled';
      await booking.save();
      res.status(400).json({ error: 'Invalid payment signature' });
    }
  } catch (error) {
    console.error('Verify payment error:', error);
    res.status(500).json({ error: 'Payment verification failed' });
  }
  */
};

import Booking from '../models/Booking.js';
import Settings from '../models/Settings.js';
import User from '../models/User.js';
import Notification from '../models/Notification.js';
import Razorpay from 'razorpay';
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

export const checkAvailability = async (req, res) => {
  const { date } = req.query; // YYYY-MM-DD
  if (!date) return res.status(400).json({ error: 'Date is required' });

  try {
    // Find bookings for the date that are either successful, cash, or locked (and lock is still valid)
    const bookings = await Booking.find({
      date,
      $or: [
        { bookingStatus: 'confirmed' },
        { bookingStatus: 'locked', lockedUntil: { $gt: new Date() } }
      ]
    }).select('startTime duration bookingStatus');

    res.status(200).json({ bookings });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch availability' });
  }
};

export const createBooking = async (req, res) => {
  const { date, startTime, duration } = req.body;
  const paymentMethod = "cash"; // TEMPORARY ONLINE PAYMENT DISABLE MODE - Force cash
  const userId = req.user.id;

  if (!date || !startTime || !duration) {
    return res.status(400).json({ error: 'All fields are required' });
  }

  try {
    // 1. Check if user is blocked
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.isBlocked) {
      return res.status(403).json({ error: 'Your account has been blocked. You cannot make bookings.' });
    }

    // 2. Fetch Settings and validate
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
      await settings.save();
    }

    // Check payment method enablement (Bypassed for temporary cash-only mode)
    /*
    if (paymentMethod === 'cash' && !settings.cashPaymentEnabled) {
      return res.status(400).json({ error: 'Cash payment is currently disabled by admin.' });
    }
    if (paymentMethod === 'online' && !settings.onlinePaymentEnabled) {
      return res.status(400).json({ error: 'Online payment is currently disabled by admin.' });
    }
    */

    // Check maximum booking duration
    if (duration > settings.maxBookingDuration) {
      return res.status(400).json({ error: `Maximum booking duration is restricted to ${settings.maxBookingDuration} hours.` });
    }

    // Check opening and closing hours
    const startMin = toMinutes(startTime);
    const endMin = startMin + duration * 60;
    const openMin = toMinutes(settings.openTime);
    const closeMin = toMinutes(settings.closeTime);

    if (startMin < openMin || endMin > closeMin) {
      return res.status(400).json({ error: `Booking must be within turf operating hours: ${settings.openTime} to ${settings.closeTime}.` });
    }

    // 3. Overlap Check
    const activeBookings = await Booking.find({
      date,
      $or: [
        { bookingStatus: 'confirmed' },
        { bookingStatus: 'locked', lockedUntil: { $gt: new Date() } }
      ]
    });

    const isOverlapping = activeBookings.some(b => checkOverlap(b.startTime, b.duration, startTime, duration));
    if (isOverlapping) {
      return res.status(400).json({ error: 'This time slot is already booked or locked for checkout. Please choose another slot.' });
    }

    const totalAmount = settings.pricePerHour * duration;

    // 4. Handle Cash Payment directly
    if (paymentMethod === 'cash') {
      const booking = new Booking({
        userId,
        date,
        startTime,
        duration,
        totalAmount,
        paymentMethod: 'cash',
        paymentStatus: 'successful',
        bookingStatus: 'confirmed'
      });
      await booking.save();

      // Create Admin Notification
      await Notification.create({
        type: 'new_booking',
        message: `New booking: ${user.name} booked ${duration} Hr(s) on ${date} at ${startTime} (Cash)`,
        bookingId: booking._id
      });

      // Send Email message in background asynchronously
      sendEmailNotification({
        email: user.email,
        customerName: user.name,
        date,
        time: startTime,
        duration: `${duration} Hr${duration > 1 ? 's' : ''}`,
        amount: totalAmount,
        paymentMethod: 'Cash',
        bookingId: booking._id,
        type: 'booking_confirmation'
      }).catch(err => console.error('Email background error:', err));

      return res.status(201).json({ message: 'Booking Successful', booking });
    }

    /* TEMPORARILY DISABLED ONLINE PAYMENT FLOW
    // 5. Initiate Online Payment Configuration
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const options = {
      amount: totalAmount * 100, // in paisa
      currency: "INR",
      receipt: `rcpt_${Date.now().toString().slice(-6)}_${userId.toString().slice(-6)}`,
    };

    const order = await razorpay.orders.create(options);

    // Create locked booking in database
    const booking = new Booking({
      userId,
      date,
      startTime,
      duration,
      totalAmount,
      paymentMethod: 'online',
      paymentStatus: 'pending',
      bookingStatus: 'locked',
      lockedUntil: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes timeout
      razorpayOrderId: order.id
    });
    await booking.save();

    res.status(201).json({
      message: 'Order created and slot locked',
      orderId: order.id,
      amount: order.amount,
      bookingId: booking._id
    });
    */

  } catch (error) {
    console.error('Create booking error:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
};

export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.user.id })
      .sort({ date: -1, startTime: -1 });
    res.status(200).json({ bookings });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch your bookings.' });
  }
};

export const cancelMyBooking = async (req, res) => {
  try {
    const booking = await Booking.findOne({ _id: req.params.id, userId: req.user.id }).populate('userId');
    if (!booking) {
      return res.status(404).json({ error: 'Booking not found.' });
    }

    if (booking.bookingStatus === 'cancelled') {
      return res.status(400).json({ error: 'Booking is already cancelled.' });
    }

    // Verify slot date is in the future
    const now = new Date();
    const bookingTime = new Date(`${booking.date}T${booking.startTime}:00`);
    if (bookingTime <= now) {
      return res.status(400).json({ error: 'You can only cancel future bookings.' });
    }

    booking.bookingStatus = 'cancelled';
    await booking.save();

    // Create Admin Notification
    await Notification.create({
      type: 'cancelled_booking',
      message: `User Cancelled Booking: ${booking.userId?.name || 'Unknown'} cancelled slot on ${booking.date} at ${booking.startTime}`,
      bookingId: booking._id
    });

    // Send Email confirmation for cancellation in background
    sendEmailNotification({
      email: booking.userId?.email,
      customerName: booking.userId?.name,
      date: booking.date,
      time: booking.startTime,
      duration: `${booking.duration} Hr${booking.duration > 1 ? 's' : ''}`,
      amount: booking.totalAmount,
      paymentMethod: booking.paymentMethod === 'online' ? 'Online' : 'Cash',
      bookingId: booking._id,
      type: 'booking_cancelled'
    }).catch(err => console.error('Email background error:', err));

    res.status(200).json({ message: 'Booking cancelled successfully.', booking });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({ error: 'Failed to cancel booking.' });
  }
};

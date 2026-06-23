import cron from 'node-cron';
import Booking from '../models/Booking.js';
import { sendEmailNotification } from '../utils/sendEmailNotification.js';

export const initCronJobs = () => {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();

      // 1. Slot Locking Invalidation Sweep
      const expiredLocks = await Booking.updateMany(
        { 
          bookingStatus: 'locked', 
          lockedUntil: { $lt: now } 
        },
        { 
          bookingStatus: 'expired' 
        }
      );

      if (expiredLocks.modifiedCount > 0) {
        console.log(`[Cron] Sweep completed. Expired ${expiredLocks.modifiedCount} locked slots.`);
      }

      // 2. 1-Hour Pre-Match Reminders
      const bookings = await Booking.find({
        bookingStatus: 'confirmed',
        reminderSent: { $ne: true }
      }).populate('userId');

      const minDiff = 50 * 60 * 1000;  // 50 minutes
      const maxDiff = 70 * 60 * 1000;  // 70 minutes

      for (const b of bookings) {
        if (!b.userId || !b.userId.email) continue;
        
        const bTime = new Date(`${b.date}T${b.startTime}:00`);
        const diff = bTime.getTime() - now.getTime();

        if (diff >= minDiff && diff <= maxDiff) {
          console.log(`[Cron] Sending 1-hour pre-match email reminder to ${b.userId.name} (${b.userId.email}) for booking on ${b.date} at ${b.startTime}`);
          
          await sendEmailNotification({
            email: b.userId.email,
            customerName: b.userId.name,
            date: b.date,
            time: b.startTime,
            duration: `${b.duration} Hr${b.duration > 1 ? 's' : ''}`,
            amount: b.totalAmount,
            paymentMethod: b.paymentMethod === 'online' ? 'Online' : 'Cash',
            bookingId: b._id,
            type: 'match_reminder'
          });

          b.reminderSent = true;
          await b.save();
        }
      }

    } catch (err) {
      console.error("[Cron Error] Failed to run cron sweeps:", err);
    }
  });

  console.log("Scheduler jobs (expired locks sweep & pre-match reminders) initialized.");
};

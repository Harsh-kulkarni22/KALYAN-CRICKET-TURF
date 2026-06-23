import { sendEmail } from './emailService.js';
import Settings from '../models/Settings.js';
import EmailLog from '../models/EmailLog.js';

export const sendEmailNotification = async ({
  email,
  customerName,
  date,
  time,
  duration,
  amount,
  paymentMethod,
  bookingId,
  type = 'booking_confirmation'
}) => {
  try {
    if (!email) {
      console.log("[Email] Skipped: Recipient email address is empty.");
      return;
    }

    const settings = await Settings.findOne() || new Settings();

    // Check if email notifications are globally enabled
    if (!settings.emailNotificationsEnabled) {
      console.log(`[Email] Skipped: Email notifications are disabled in admin settings.`);
      return;
    }

    // 1. Create a pending email log entry
    const log = new EmailLog({
      email,
      messageType: type,
      status: 'pending'
    });
    await log.save();

    // 2. Build template content
    let subject = '';
    let html = '';

    if (type === 'match_reminder') {
      subject = 'Reminder - Your Turf Booking Starts in 1 Hour';
      html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #1b4332; margin-top: 0;">🏏 KALYAN CRICKET TURF</h2>
          <p>Hello <strong>${customerName}</strong>,</p>
          <p>This is a reminder that your booking starts in 1 hour.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="margin: 5px 0;">📅 <strong>Date:</strong> ${date}</p>
          <p style="margin: 5px 0;">🕗 <strong>Time:</strong> ${time}</p>
          <p style="margin: 5px 0;">⏱ <strong>Duration:</strong> ${duration}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="margin-bottom: 0;">See you soon!</p>
        </div>
      `;
    } else if (type === 'booking_cancelled') {
      subject = 'KALYAN Cricket Turf Booking Cancellation';
      html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #c1121f; margin-top: 0;">🏏 KALYAN CRICKET TURF</h2>
          <p>Hello <strong>${customerName}</strong>,</p>
          <p style="font-size: 16px; color: #c1121f;"><strong>Booking Cancelled ❌</strong></p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="margin: 5px 0;">📅 <strong>Date:</strong> ${date}</p>
          <p style="margin: 5px 0;">🕗 <strong>Time:</strong> ${time}</p>
          <p style="margin: 5px 0;">⏱ <strong>Duration:</strong> ${duration}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="margin-bottom: 0; color: #666; font-size: 12px;">Your booking has been cancelled successfully.</p>
        </div>
      `;
    } else {
      // default: booking_confirmation
      subject = 'KALYAN Cricket Turf Booking Confirmation';
      html = `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #1b4332; margin-top: 0;">🏏 KALYAN CRICKET TURF</h2>
          <p>Hello <strong>${customerName}</strong>,</p>
          <p style="font-size: 16px; color: #1b4332;"><strong>Booking Confirmed ✅</strong></p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="margin: 5px 0;">📅 <strong>Date:</strong> ${date}</p>
          <p style="margin: 5px 0;">🕗 <strong>Time:</strong> ${time}</p>
          <p style="margin: 5px 0;">⏱ <strong>Duration:</strong> ${duration}</p>
          <p style="margin: 5px 0;">💰 <strong>Amount:</strong> ₹${amount}</p>
          <p style="margin: 5px 0;">💳 <strong>Payment Method:</strong> ${paymentMethod}</p>
          <p style="margin: 5px 0; font-size: 12px; color: #666;"><strong>Booking ID:</strong> ${bookingId}</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p>Thank you for choosing KALYAN CRICKET TURF. Enjoy your game!</p>
        </div>
      `;
    }

    const info = await sendEmail(email, subject, html);

    // 4. Update log status to sent
    log.status = 'sent';
    log.response = JSON.stringify(info);
    await log.save();

    console.log(`[Email] Mail sent successfully to ${email}. Log ID: ${log._id}`);

  } catch (error) {
    console.error('[Email Notification Error] Transmission failed:', error.message);
    try {
      if (email) {
        await EmailLog.create({
          email,
          messageType: type,
          status: 'failed',
          response: error.message
        });
      }
    } catch (dbErr) {
      console.error('[Email Logging Failure] Could not persist failed log:', dbErr.message);
    }
  }
};

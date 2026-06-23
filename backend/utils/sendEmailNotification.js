import nodemailer from 'nodemailer';
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

    const userEmail = process.env.EMAIL_USER;
    const passEmail = process.env.EMAIL_PASS;

    if (!userEmail || !passEmail) {
      console.log("[Email] Skipped: Nodemailer credentials (EMAIL_USER/EMAIL_PASS) are not defined in environment.");
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
    let body = '';

    if (type === 'match_reminder') {
      subject = 'Reminder - Your Turf Booking Starts in 1 Hour';
      body = `🏏 KALYAN CRICKET TURF

Hello ${customerName},

This is a reminder that your booking starts in 1 hour.

📅 Date : ${date}

🕗 Time : ${time}

⏱ Duration : ${duration}

See you soon!`;
    } else if (type === 'booking_cancelled') {
      subject = 'KALYAN Cricket Turf Booking Cancellation';
      body = `🏏 KALYAN CRICKET TURF

Hello ${customerName},

Booking Cancelled ❌

📅 Date : ${date}

🕗 Time : ${time}

⏱ Duration : ${duration}

Your booking has been cancelled successfully.`;
    } else {
      // default: booking_confirmation
      subject = 'KALYAN Cricket Turf Booking Confirmation';
      body = `🏏 KALYAN CRICKET TURF

Hello ${customerName},

Booking Confirmed ✅

📅 Date : ${date}

🕗 Time : ${time}

⏱ Duration : ${duration}

💰 Amount : ₹${amount}

💳 Payment : ${paymentMethod}

Booking ID : ${bookingId}

Thank you for choosing KALYAN CRICKET TURF.

Enjoy your game!`;
    }

    // 3. Dispatch using Nodemailer with Gmail service configuration
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: userEmail,
        pass: passEmail
      }
    });

    const sender = settings.smtpSenderEmail || userEmail;

    const mailOptions = {
      from: `KALYAN Cricket Turf <${sender}>`,
      to: email,
      subject: subject,
      text: body
    };

    const info = await transporter.sendMail(mailOptions);

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

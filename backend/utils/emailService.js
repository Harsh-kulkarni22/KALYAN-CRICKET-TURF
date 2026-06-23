import { google } from "googleapis";
import nodemailer from "nodemailer";

export const sendEmail = async (to, subject, html) => {
  console.log(`[Email Service] Preparing to send email to: ${to}, Subject: "${subject}"`);

  // Map GOOGLE_CLIENT_ID1/GOOGLE_CLIENT_SECRET1 if they exist (local development fallback)
  const clientId = process.env.GOOGLE_CLIENT_ID1 || process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET1 || process.env.GOOGLE_CLIENT_SECRET;
  const userEmail = process.env.EMAIL_USER;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!userEmail || !clientId || !clientSecret || !refreshToken) {
    console.error("[Email Service] Missing required environment variables for OAuth2 email sending.");
    throw new Error("Missing required email environment variables.");
  }

  try {
    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      "http://localhost"
    );

    oauth2Client.setCredentials({
      refresh_token: refreshToken
    });

    console.log("[Email Service] Requesting dynamic access token...");
    const accessTokenResponse = await oauth2Client.getAccessToken();
    console.log("[Email Service] Dynamic access token successfully retrieved.");

    console.log("[Email Service] Initializing Nodemailer OAuth2 transporter...");
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: userEmail,
        clientId: clientId,
        clientSecret: clientSecret,
        refreshToken: refreshToken,
        accessToken: accessTokenResponse.token
      }
    });

    const mailOptions = {
      from: `"KALYAN Cricket Turf" <${userEmail}>`,
      to,
      subject,
      html,
      text: html.replace(/<[^>]*>/g, '') // Strip HTML tags for plain text fallback
    };

    console.log("[Email Service] Sending email via Nodemailer...");
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email Service] Email successfully sent to ${to}. Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`[Email Service] Critical error sending email to ${to}:`, error.message);
    throw error;
  }
};

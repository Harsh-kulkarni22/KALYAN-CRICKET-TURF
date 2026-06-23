import { google } from "googleapis";

let oauth2Client;
let gmail;

const initGmailClient = () => {
  if (!oauth2Client) {
    oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      "http://localhost"
    );

    oauth2Client.setCredentials({
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });

    gmail = google.gmail({
      version: "v1",
      auth: oauth2Client
    });
  }
};

export const sendEmail = async (to, subject, html) => {
  console.log("[Email Service] Preparing email");
  initGmailClient();

  try {
    // Get access token automatically
    await oauth2Client.getAccessToken();
    console.log("[Email Service] Access token acquired");

    const boundary = "boundary_string";
    const plainText = html.replace(/<[^>]*>/g, '');

    const messageParts = [
      `From: "KALYAN Cricket Turf" <${process.env.EMAIL_USER}>`,
      `To: ${to}`,
      `Subject: =?utf-8?B?${Buffer.from(subject).toString('base64')}?=`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      ``,
      `--${boundary}`,
      `Content-Type: text/plain; charset=utf-8`,
      `Content-Transfer-Encoding: 7bit`,
      ``,
      plainText,
      ``,
      `--${boundary}`,
      `Content-Type: text/html; charset=utf-8`,
      `Content-Transfer-Encoding: 7bit`,
      ``,
      html,
      ``,
      `--${boundary}--`
    ];

    const message = messageParts.join('\r\n');
    const encodedMessage = Buffer.from(message).toString('base64url');

    console.log("[Email Service] Sending via Gmail API");
    const result = await gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedMessage
      }
    });

    console.log("[Email Service] Email sent successfully");
    return result.data;
  } catch (error) {
    console.error("[Email Service] Error:", error);
    throw error;
  }
};

import readline from "readline";
import { google } from "googleapis";
import dotenv from "dotenv";
dotenv.config();

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    "http://localhost"
);

const scopes = [
    "https://mail.google.com/"
];

const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
});

console.log("Authorize this app by visiting:\n", url);

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question("Paste code here: ", async (code) => {
    const { tokens } = await oauth2Client.getToken(code);
    console.log(tokens);
    rl.close();
});
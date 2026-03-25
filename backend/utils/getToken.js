const { google } = require("googleapis");
require("dotenv").config();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// 👉 PASTE YOUR CODE HERE
const code = "4/0Aci98E9dV267uxMqvSZekrMH-jL04EqtK2KxYwaPRKhdpL0JzYOU9vlTsfizy5qeCe1t6g";

async function getToken() {
  try {
    const { tokens } = await oauth2Client.getToken(code);
    console.log("TOKENS:\n", tokens);
  } catch (error) {
    console.error("Error getting token:", error);
  }
}

getToken();
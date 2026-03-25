const { google } = require("googleapis");
require("dotenv").config();

// Create OAuth client
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Set credentials (using YOUR refresh token)
oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
});

// Create calendar instance
const calendar = google.calendar({ version: "v3", auth: oauth2Client });

// Function to create event
async function createCalendarEvent({ summary, description, start, end }) {
  try {
    const event = {
      summary,
      description,
      start: {
        dateTime: start,
        timeZone: "America/New_York",
      },
      end: {
        dateTime: end,
        timeZone: "America/New_York",
      },
    };

    const response = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
    });

    console.log("Event created:", response.data.htmlLink);

    return response.data;
  } catch (error) {
    console.error("Calendar Error:", error.message);
    throw error;
  }
}

module.exports = { createCalendarEvent };
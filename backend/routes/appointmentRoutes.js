const express = require("express");
const router = express.Router();
const { createCalendarEvent } = require("../utils/googleCalendar");

// POST /api/appointments
router.post("/", async (req, res) => {
  try {
    const { title, description, startTime, endTime } = req.body;

    if (!title || !startTime || !endTime) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const event = await createCalendarEvent({
      summary: title,
      description,
      start: startTime,
      end: endTime,
    });

    res.status(201).json({
      message: "Appointment scheduled successfully",
      event,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error scheduling appointment" });
  }
});

module.exports = router;
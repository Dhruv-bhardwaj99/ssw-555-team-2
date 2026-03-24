const express = require("express");
const mongoose = require("mongoose");
const Message = require("../models/message");

const router = express.Router();

const badWords = ["badword1", "badword2", "badword3"];

function hasProfanity(text) {
  const lowerText = text.toLowerCase();
  return badWords.some((word) => lowerText.includes(word));
}

// POST /messages
router.post("/", async (req, res) => {
  try {
    const { patient_id, doctor_id, subject, body, encrypted } = req.body;

    if (!patient_id || !doctor_id || !subject || !body) {
      return res.status(400).json({
        message: "patient_id, doctor_id, subject, and body are required",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(patient_id) ||
      !mongoose.Types.ObjectId.isValid(doctor_id)
    ) {
      return res.status(400).json({
        message: "Invalid patient_id or doctor_id",
      });
    }

    if (body.length > 5000) {
      return res.status(400).json({
        message: "Message body cannot be more than 5000 characters",
      });
    }

    if (hasProfanity(subject) || hasProfanity(body)) {
      return res.status(400).json({
        message: "Message contains inappropriate language",
      });
    }

    const newMessage = new Message({
      patient_id,
      doctor_id,
      subject,
      body,
      encrypted: encrypted || false,
    });

    const savedMessage = await newMessage.save();
    res.status(201).json(savedMessage);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// GET /messages
router.get("/", async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: -1 });
    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// PUT /messages/:id/read
router.put("/:id/read", async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid message id" });
    }

    const updatedMessage = await Message.findByIdAndUpdate(
      id,
      { read: true },
      { new: true }
    );

    if (!updatedMessage) {
      return res.status(404).json({ message: "Message not found" });
    }

    res.status(200).json(updatedMessage);
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

module.exports = router;
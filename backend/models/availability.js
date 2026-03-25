const mongoose = require("mongoose");

const availabilitySchema = new mongoose.Schema(
  {
    doctor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    workingHours: [
      {
        day: {
          type: String,
          enum: [
            "Monday",
            "Tuesday",
            "Wednesday",
            "Thursday",
            "Friday",
            "Saturday",
            "Sunday",
          ],
        },
        startTime: { type: String, default: "09:00 AM" },
        endTime: { type: String, default: "05:00 PM" },
        isAvailable: { type: Boolean, default: true },
      },
    ],
  },
  {
    timestamps: true,
  },
);
module.exports = mongoose.model("Availability", availabilitySchema);

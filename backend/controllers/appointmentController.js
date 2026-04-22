const Appointment = require("../models/appointment");
const User = require("../models/user");
const Availability = require("../models/availability");

// ── Slot generator helper ────────────────────────────────────────────────────
function parseTimeToMinutes(timeStr) {
  // Handles both "HH:MM AM/PM" and plain "HH:MM" 24-hour formats
  const parts = timeStr.trim().split(" ");
  const [h, m] = parts[0].split(":").map(Number);
  const period = parts[1]?.toUpperCase();
  let hours = h;
  if (period === "AM" && h === 12) hours = 0;
  else if (period === "PM" && h !== 12) hours = h + 12;
  return hours * 60 + m;
}

function generateSlots(startTime, endTime) {
  const slots = [];
  let current = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);

  while (current < end) {
    const h = Math.floor(current / 60);
    const m = current % 60;
    const period = h < 12 ? "AM" : "PM";
    const displayH = h % 12 === 0 ? 12 : h % 12;
    slots.push(`${displayH}:${String(m).padStart(2, "0")} ${period}`);
    current += 30;
  }
  return slots;
}

// GET /appointments/doctors/:doctorId/availability
const getDoctorAvailability = async (req, res) => {
  try {
    const doctorId = req.params.doctorId ?? req.params.id;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({ message: "date query param is required" });
    }

    const [year, month, day] = date.split("-").map(Number);
    const searchDate = new Date(year, month - 1, day);
    const dayName = [
      "Sunday", "Monday", "Tuesday", "Wednesday",
      "Thursday", "Friday", "Saturday",
    ][searchDate.getDay()];

    const schedule = await Availability.findOne({ doctor_id: doctorId });
    if (!schedule) {
      return res.status(404).json({ message: "No availability set for this doctor" });
    }
    const dayConfig = schedule.workingHours.find((h) => h.day === dayName);

    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== "provider") {
      return res.status(404).json({ message: "Doctor not found" });
    }

    if (!dayConfig || !dayConfig.isAvailable) {
      return res.status(200).json({
        doctor: {
          id: doctor._id,
          firstName: doctor.firstName,
          lastName: doctor.lastName,
          role: doctor.role,
        },
        date,
        availableSlots: [],
      });
    }

    const allPossibleSlots = generateSlots(dayConfig.startTime, dayConfig.endTime);

    const startOfDay = new Date(searchDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(searchDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointments = await Appointment.find({
      doctor_id: doctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: "scheduled",
    });
    const takenSlots = existingAppointments.map((a) => a.time);
    const availableSlots = allPossibleSlots.filter((slot) => !takenSlots.includes(slot));

    res.status(200).json({
      doctor: {
        id: doctor._id,
        firstName: doctor.firstName,
        lastName: doctor.lastName,
        role: doctor.role,
      },
      date,
      availableSlots,
    });
  } catch (error) {
    console.error("Error fetching availability:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// POST /appointments
const createAppointment = async (req, res) => {
  try {
    const { patient_id, doctor_id, date, time, notes } = req.body;

    if (!patient_id || !doctor_id || !date || !time) {
      return res.status(400).json({ message: "patient_id, doctor_id, date, and time are required" });
    }

    const appointment = await Appointment.create({
      patient_id,
      doctor_id,
      date,
      time,
      notes,
      status: "scheduled",
    });

    res.status(201).json({
      message: "Appointment scheduled successfully",
      appointment,
    });
  } catch (error) {
    console.error("Error creating appointment:", error.message);
    res.status(500).json({
      error: "Failed to schedule appointment",
      details: error.message,
    });
  }
};

// PUT /appointments/:id/cancel
const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ error: "Appointment not found" });
    }
    if (appointment.status === "cancelled") {
      return res.status(400).json({ message: "Appointment is already cancelled" });
    }

    appointment.status = "cancelled";
    await appointment.save();

    res.status(200).json({
      message: "Appointment cancelled successfully",
      appointment,
    });
  } catch (error) {
    console.error("Error cancelling appointment:", error.message);
    res.status(500).json({
      error: "Failed to cancel appointment",
      details: error.message,
    });
  }
};

// GET /appointments/user/:id — works for both patients and providers
const getUserAppointments = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let appointments;

    if (user.role === "patient") {
      appointments = await Appointment.find({ patient_id: userId })
        .populate("doctor_id", "firstName lastName email role")
        .sort({ date: 1, time: 1 });
    } else if (user.role === "provider") {
      appointments = await Appointment.find({ doctor_id: userId })
        .populate("patient_id", "firstName lastName email role")
        .sort({ date: 1, time: 1 });
    } else {
      return res.status(400).json({ message: "User role not supported" });
    }

    res.status(200).json({
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      appointments,
    });
  } catch (error) {
    console.error("Error fetching appointments:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /appointments/user/:id/history
const getAppointmentHistory = async (req, res) => {
  try {
    const userId = req.params.id;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    let query = {};

    if (user.role === "patient") {
      query = { patient_id: userId, status: { $in: ["completed", "cancelled"] } };
    } else if (user.role === "provider") {
      query = { doctor_id: userId, status: { $in: ["completed", "cancelled"] } };
    } else {
      return res.status(400).json({ message: "User role not supported" });
    }

    const appointments = await Appointment.find(query)
      .populate("doctor_id", "firstName lastName email role")
      .populate("patient_id", "firstName lastName email role")
      .sort({ date: -1, time: -1 });

    res.status(200).json({
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      appointments,
    });
  } catch (error) {
    console.error("Error fetching appointment history:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// POST /appointments/availability
const updateAvailability = async (req, res) => {
  try {
    const { doctor_id, workingHours } = req.body;
    if (!doctor_id || !workingHours) {
      return res.status(400).json({ message: "doctor_id and workingHours are required" });
    }

    const doctor = await User.findById(doctor_id);
    if (!doctor || doctor.role !== "provider") {
      return res.status(400).json({ message: "Only providers can set availability" });
    }

    const availability = await Availability.findOneAndUpdate(
      { doctor_id },
      { workingHours },
      { returnDocument: "after", upsert: true }
    );

    res.status(200).json({
      message: "Availability updated successfully",
      availability,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// GET /appointments/doctors/:doctorId/schedule
const getDoctorSchedule = async (req, res) => {
  try {
    const doctorId = req.params.doctorId ?? req.params.id;
    const schedule = await Availability.findOne({ doctor_id: doctorId });

    if (!schedule) {
      return res.status(200).json({ availableDays: [] });
    }

    const availableDays = schedule.workingHours
      .filter((h) => h.isAvailable)
      .map((h) => h.day);

    res.status(200).json({ availableDays });
  } catch (error) {
    console.error("Error fetching doctor schedule:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// ── ADMIN ROUTES ─────────────────────────────────────────────────────────────

// PUT /appointments/:id/complete — provider marks an appointment as done
const completeAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    if (appointment.status === "completed") {
      return res.status(400).json({ message: "Appointment is already completed" });
    }

    if (appointment.status === "cancelled") {
      return res.status(400).json({ message: "Cannot complete a cancelled appointment" });
    }

    appointment.status = "completed";
    await appointment.save();

    res.status(200).json({
      message: "Appointment marked as completed",
      appointment,
    });
  } catch (error) {
    console.error("Error completing appointment:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /appointments/all — admin: fetch every appointment
const getAllAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate("doctor_id", "firstName lastName email role")
      .populate("patient_id", "firstName lastName email role")
      .sort({ date: -1, time: -1 });

    res.status(200).json({ appointments });
  } catch (error) {
    console.error("Error fetching all appointments:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// DELETE /appointments/:id — admin: hard-delete an appointment
const deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    await Appointment.findByIdAndDelete(id);

    res.status(200).json({ message: "Appointment deleted successfully" });
  } catch (error) {
    console.error("Error deleting appointment:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

// GET /appointments/doctors/:id/working-hours
// Returns the full workingHours array (day + startTime + endTime + isAvailable)
// Used by the provider's Set Availability screen to pre-populate saved settings
const getFullWorkingHours = async (req, res) => {
  try {
    const doctorId = req.params.id;
    const schedule = await Availability.findOne({ doctor_id: doctorId });

    if (!schedule) {
      // No schedule saved yet — return empty so the frontend uses its defaults
      return res.status(200).json({ workingHours: [] });
    }

    res.status(200).json({ workingHours: schedule.workingHours });
  } catch (error) {
    console.error("Error fetching working hours:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = {
  getDoctorAvailability,
  createAppointment,
  cancelAppointment,
  completeAppointment,
  updateAvailability,
  getUserAppointments,
  getDoctorSchedule,
  getAppointmentHistory,
  getAllAppointments,
  deleteAppointment,
  getFullWorkingHours,
};
const Appointment = require("../models/appointment");
const User = require("../models/user");
const Availability = require("../models/availability");
const { createCalendarEvent } = require("../utils/googleCalendar");

const generateSlots = (startTime, endTime) => {
  const slots = [];
  let current = new Date(`2000-01-01 ${startTime}`);
  const end = new Date(`2000-01-01 ${endTime}`);

  while (current < end) {
    let hours = current.getHours();
    const ampm = hours >= 12 ? "PM" : "AM";
    hours = hours % 12;
    hours = hours ? hours : 12;
    const strTime = `${hours.toString().padStart(2, "0")}:00 ${ampm}`;

    slots.push(strTime);
    current.setHours(current.getHours() + 1);
  }
  return slots;
};

// Get /appointments/doctors/:id/availability?date=YYYY-MM-DD
const getDoctorAvailability = async (req, res) => {
  try {
    const doctorId = req.params.id;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        message: "Date query parameter is required",
      });
    }

    const [year, month, day] = date.split("-").map(Number);
    const searchDate = new Date(year, month - 1, day);
    const dayName = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
    }).format(searchDate);

    const schedule = await Availability.findOne({ doctor_id: doctorId });
    if (!schedule) {
      return res.status(404).json({
        message: "Doctor schedule not configured.",
      });
    }
    const dayConfig = schedule.workingHours.find((h) => h.day === dayName);

    const doctor = await User.findById(doctorId);

    if (!doctor || doctor.role !== "provider") {
      return res.status(404).json({
        message: "Doctor not found",
      });
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

    const allPossibleSlots = generateSlots(
      dayConfig.startTime,
      dayConfig.endTime,
    );

    const startOfDay = new Date(searchDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(searchDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointments = await Appointment.find({
      doctor_id: doctorId,
      date: { $gte: startOfDay, $lte: endOfDay },
      status: "scheduled",
    });
    const takenSlots = existingAppointments.map((appointment) => {
      return appointment.time;
    });
    const availableSlots = allPossibleSlots.filter((slot) => {
      return !takenSlots.includes(slot);
    });
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
    console.error("Error fetching avaiability:", error.message);
    res.status(500).json({
      message: "Server error",
    });
  }
};

// post appointment/availiability

const updateAvailability = async (req, res) => {
  try {
    const { doctor_id, workingHours } = req.body;
    if (!doctor_id || !workingHours) {
      return res.status(400).json({
        message: "doctor_id and workingHours are requrired ",
      });
    }

    const doctor = await User.findById(doctor_id);
    if (!doctor || doctor.role !== "provider") {
      return res.status(400).json({
        message: "Only providers can set availability",
      });
    }

    const availability = await Availability.findOneAndUpdate(
      {
        doctor_id,
      },
      { workingHours },
      { returnDocument: "after", upsert: true },
    );

    res.status(200).json({
      message: "Availability updated successfully",
      availability,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

//post appointments
const createAppointment = async (req, res) => {
  try {
    const { patient_id, doctor_id, date, time, notes } = req.body;

    if (!patient_id || !doctor_id || !date || !time) {
      return res.status(400).json({
        error: "patient_id, doctor_id, date, and time are required",
      });
    }

    const patient = await User.findById(patient_id);
    const doctor = await User.findById(doctor_id);

    if (!patient || patient.role !== "patient") {
      return res.status(400).json({
        message: "Only a patient can book an appointment",
      });
    }

    if (!doctor || doctor.role !== "provider") {
      return res.status(400).json({
        message: "Appintments can only be booked with a provider",
      });
    }

    const schedule = await Availability.findOne({ doctor_id });
    if (!schedule) {
      return res.status(404).json({
        message: "Doctor schedule not configured",
      });
    }

    const [year, month, day] = date.split("-").map(Number);
    const appointmentDate = new Date(year, month - 1, day);
    if (!year || !month || !day || isNaN(appointmentDate.getTime())) {
      return res.status(400).json({
        message: "Invalid date format. Use YYYY-MM-DD",
      });
    }
    const dayName = new Intl.DateTimeFormat("en-US", {
      weekday: "long",
    }).format(appointmentDate);
    const dayConfig = schedule.workingHours.find((h) => h.day === dayName);

    if (!dayConfig) {
      return res.status(400).json({
        message: `Doctor does not have office hours on ${dayName}s.`,
      });
    }

    if (!dayConfig.isAvailable) {
      return res.status(400).json({
        message: `Doctor is marked as unavailable on this specific ${dayName}.`,
      });
    }

    const validSlots = generateSlots(dayConfig.startTime, dayConfig.endTime);
    if (!validSlots.includes(time)) {
      return res.status(400).json({
        message: `Invalid time slot. On ${dayName}s, doctor only works from ${dayConfig.startTime} to ${dayConfig.endTime}.`,
      });
    }

    const startOfDay = new Date(appointmentDate);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(appointmentDate);
    endOfDay.setHours(23, 59, 59, 999);

    const existingAppointment = await Appointment.findOne({
      doctor_id,
      date: { $gte: startOfDay, $lte: endOfDay },
      time,
      status: "scheduled",
    });

    if (existingAppointment) {
      return res.status(409).json({
        message: "This time slot is already booked",
      });
    }

    const appointment = new Appointment({
      patient_id,
      doctor_id,
      date: appointmentDate,
      time,
      notes,
    });

    const savedAppointment = await appointment.save();

    // Sync to Google Calendar — non-blocking, failure won't affect the booking
    try {
      const [hour, minutePart] = time.split(":");
      const [min, period] = minutePart.split(" ");
      let startHour = parseInt(hour);
      if (period === "PM" && startHour !== 12) startHour += 12;
      if (period === "AM" && startHour === 12) startHour = 0;

      const startISO = `${date}T${String(startHour).padStart(2, "0")}:${min}:00`;
      const endHour = (startHour + 1) % 24;
      const endISO = `${date}T${String(endHour).padStart(2, "0")}:${min}:00`;

      await createCalendarEvent({
        summary: `Appointment: ${patient.firstName} ${patient.lastName} with Dr. ${doctor.lastName}`,
        description: notes || "",
        start: startISO,
        end: endISO,
      });
    } catch (calendarError) {
      console.error("Google Calendar sync failed:", calendarError.message);
    }

    res.status(201).json({
      message: "Appointment scheduled successfully",
      appointment: savedAppointment,
    });
  } catch (error) {
    console.error("Error creating appointment:", error.message);
    res.status(500).json({
      error: "Failed to schedule appointment",
      details: error.message,
    });
  }
};

//put appointments cancellation
const cancelAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({
        error: "Appointment not found",
      });
    }

    if (appointment.status === "cancelled") {
      return res.status(400).json({
        message: "Appointment is already cancelled",
      });
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

//get appointments patients
const getPatientAppointments = async (req, res) => {
    try {
        const patientId = req.params.id;
        const patient = await User.findById(patientId);
        if(!patient || patient.role !== "patient"){
            return res.status(404).json({
                message: "Patient not found"
            });
        }
        const appointments = await Appointment.find({
            patient_id: patientId
        }).populate("doctor_id", "firstName lastName email role").sort({date: 1, time: 1});

        res.status(200).json({
            patient: {
                id: patient.id,
                firstName: patient.firstName,
                lastName: patient.lastName,
                role: patient.role
            },
            appointments,
        })
    } catch (error) {
        console.error("Error fetching appointments:", error.message);
        res.status(500).json({
            message: "Server error"
        })
    }
}

//get appointments for providers by id
const getProviderAppointments = async(req, res) => {
    try {
        const providerId = req.params.id;

        const provider = await User.findById(providerId);
        if(!provider || provider.role !== "provider"){
            return res.status(404).json({
                message: "Provider not found",
            });
        }

        const appointments = await Appointment.find({
            doctor_id: providerId
        }).populate("patient_id", "firstName lastName email role").sort({date: 1, time: 1});

        res.status(200).json({
            provider: {
                id: provider._id,
                firstName: provider.firstName,
                lastName: provider.lastName,
                role: provider.role
            },
            appointments
        });
    } catch (error) {
        console.error("Error fetching provider appointments:", error.message);
        res.status(500).json({
            message: "Server Error"
        })
    }
}

module.exports = {
  getDoctorAvailability,
  createAppointment,
  cancelAppointment,
  updateAvailability,
  getPatientAppointments,
  getProviderAppointments
};

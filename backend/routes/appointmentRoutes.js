const express = require("express");
const router = express.Router();
 
const {
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
} = require("../controllers/appointmentController");
 
// Availability
router.post("/availability", updateAvailability);
router.get("/doctors/:id/availability", getDoctorAvailability);
router.get("/doctors/:id/schedule", getDoctorSchedule);
router.get("/doctors/:id/working-hours", getFullWorkingHours);
 
// Appointments
router.post("/", createAppointment);
router.put("/:id/cancel", cancelAppointment);
router.put("/:id/complete", completeAppointment);
router.get("/user/:id", getUserAppointments);
router.get("/user/:id/history", getAppointmentHistory);
 
// Admin-only routes
router.get("/all", getAllAppointments);
router.delete("/:id", deleteAppointment);
 
module.exports = router;
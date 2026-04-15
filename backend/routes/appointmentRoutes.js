const express = require("express");
const router = express.Router();

const {
    getDoctorAvailability,
    createAppointment,
    cancelAppointment,
    updateAvailability,
    getUserAppointments,
    getDoctorSchedule,
    getAppointmentHistory
} = require("../controllers/appointmentController");

router.post("/availability", updateAvailability);
router.get("/doctors/:id/availability", getDoctorAvailability)
router.post("/", createAppointment);
router.put("/:id/cancel", cancelAppointment);
router.get("/user/:id", getUserAppointments);
router.get("/doctors/:id/schedule", getDoctorSchedule);
router.get("/user/:id/history", getAppointmentHistory);

module.exports = router;
const express = require("express");
const router = express.Router();

const {
    getDoctorAvailability,
    createAppointment,
    cancelAppointment,
    updateAvailability
} = require("../controllers/appointmentController");

router.post("/availability", updateAvailability);
router.get("/doctors/:id/availability", getDoctorAvailability)
router.post("/", createAppointment);
router.put("/:id/cancel", cancelAppointment);

module.exports = router;
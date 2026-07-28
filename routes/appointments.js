const express = require("express");
const router = express.Router();

const {
  bookAppointment,
  patientAppointments,
  doctorAppointments,
  updateAppointment,
  cancelAppointment,
} = require("../controllers/appointmentController");

// Book Appointment
router.post("/", bookAppointment);

// Patient Appointments
router.get("/patient/:id", patientAppointments);

// Doctor Appointments
router.get("/doctor/:id", doctorAppointments);

// Update Appointment Status
router.put("/:id", updateAppointment);

// Cancel Appointment
router.put("/cancel/:id", cancelAppointment);

module.exports = router;
const express = require("express");

const router = express.Router();

const {
  bookAppointment,
  patientAppointments,
  doctorAppointments,
  updateAppointment,
  cancelAppointment,
} = require("../controllers/appointmentController");

router.post("/", bookAppointment);

router.get("/patient/:id", patientAppointments);

router.get("/doctor/:id", doctorAppointments);

router.put("/:id", updateAppointment);
router.put("/cancel/:id", cancelAppointment);


module.exports = router;
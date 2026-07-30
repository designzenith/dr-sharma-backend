const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");

const {
  bookAppointment,
  patientAppointments,
  getMyPatientAppointments,
  doctorAppointments,
  acceptAppointment,
  rejectAppointment,
  updateAppointment,
  cancelAppointment,
  startCall,
  endCall,
  getAppointmentByRoom,
} = require("../controllers/appointmentController");


// ===============================
// Book Appointment
// ===============================
router.post(
  "/",
  auth,
  bookAppointment
);


// ===============================
// Logged In Patient Appointments
// ===============================
router.get(
  "/patient",
  auth,
  getMyPatientAppointments
);


// ===============================
// Patient Appointments By ID
// ===============================
router.get(
  "/patient/:id",
  patientAppointments
);


// ===============================
// Doctor Appointments
// ===============================
router.get(
  "/doctor/:id",
  auth,
  doctorAppointments
);


// ===============================
// Doctor Accept Appointment
// ===============================
router.put(
  "/accept/:id",
  auth,
  acceptAppointment
);


// ===============================
// Doctor Reject Appointment
// ===============================
router.put(
  "/reject/:id",
  auth,
  rejectAppointment
);


// ===============================
// Get Appointment By Room ID
// ===============================
router.get(
  "/room/:roomId",
  auth,
  getAppointmentByRoom
);


// ===============================
// Update Appointment
// ===============================
router.put(
  "/:id",
  auth,
  updateAppointment
);


// ===============================
// Cancel Appointment
// ===============================
router.put(
  "/cancel/:id",
  auth,
  cancelAppointment
);


// ===============================
// Start Video / Audio Call
// ===============================
router.put(
  "/start/:id",
  auth,
  startCall
);


// ===============================
// End Video / Audio Call
// ===============================
router.put(
  "/end/:id",
  auth,
  endCall
);


module.exports = router;
const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");

const {
  bookAppointment,
  patientAppointments,
  getMyPatientAppointments,
   patientHistory,
  doctorAppointments,
  acceptAppointment,
  rejectAppointment,
  updateAppointment,
  cancelAppointment,
  startCall,
  endCall,
  getAppointmentByRoom,
   adminDashboard,
} = require("../controllers/appointmentController");

// =====================================================
// ADMIN ROUTES
// =====================================================

// GET /api/appointments/admin
// Admin can see complete platform data
router.get(
  "/admin",
  adminAuth,
  adminDashboard
);
// =====================================================
// PATIENT ROUTES
// =====================================================


// Book Appointment
// POST /api/appointments
router.post(
  "/",
  auth,
  bookAppointment
);


// Logged-in Patient Appointments
// GET /api/appointments/patient
router.get(
  "/patient",
  auth,
  getMyPatientAppointments
);

// =====================================================
// PATIENT HISTORY
// =====================================================

// GET /api/appointments/history
router.get(
  "/history",
  auth,
  patientHistory
);
// Patient Appointments By User ID
// GET /api/appointments/patient/:id
router.get(
  "/patient/:id",
  auth,
  patientAppointments
);


// Patient Cancel Appointment
// PUT /api/appointments/cancel/:id
router.put(
  "/cancel/:id",
  auth,
  cancelAppointment
);


// =====================================================
// DOCTOR ROUTES
// =====================================================


// Logged-in Doctor Appointments
// GET /api/appointments/doctor
//
// IMPORTANT:
// No :id is required.
// Backend gets doctor from req.user._id.
router.get(
  "/doctor",
  auth,
  doctorAppointments
);


// Doctor Accept Appointment
// PUT /api/appointments/:id/accept
router.put(
  "/:id/accept",
  auth,
  acceptAppointment
);


// Doctor Reject Appointment
// PUT /api/appointments/:id/reject
router.put(
  "/:id/reject",
  auth,
  rejectAppointment
);


// Start Video / Audio Consultation
// PUT /api/appointments/:id/start
router.put(
  "/:id/start",
  auth,
  startCall
);


// End Video / Audio Consultation
// PUT /api/appointments/:id/end
router.put(
  "/:id/end",
  auth,
  endCall
);


// =====================================================
// APPOINTMENT ROUTES
// =====================================================


// Get Appointment By Room ID
// GET /api/appointments/room/:roomId
router.get(
  "/room/:roomId",
  auth,
  getAppointmentByRoom
);


// Update Appointment
// PUT /api/appointments/:id
router.put(
  "/:id",
  auth,
  updateAppointment
);


module.exports = router;
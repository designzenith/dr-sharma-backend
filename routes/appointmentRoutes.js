const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");

const {
  bookAppointment,
  getAppointmentById,
  createPayuPayment,
  markAppointmentPaid,
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
// ADMIN
// =====================================================

router.get("/admin", adminAuth, adminDashboard);

// =====================================================
// PATIENT
// =====================================================

// Book appointment
router.post("/", auth, bookAppointment);

// Get patient's appointments
router.get("/patient", auth, getMyPatientAppointments);

// Get patient appointment history
router.get("/patient/history", auth, patientHistory);

// Get patient appointment
router.get("/patient/:id", auth, patientAppointments);

// Cancel appointment
// PATCH /api/appointments/:id/cancel
router.patch("/:id/cancel", auth, cancelAppointment);

// =====================================================
// DOCTOR
// =====================================================

// Get doctor appointments
router.get("/doctor", auth, doctorAppointments);

// Accept appointment
router.put("/:id/accept", auth, acceptAppointment);

// Reject appointment
router.put("/:id/reject", auth, rejectAppointment);

// Start call
router.put("/:id/start", auth, startCall);

// End call
router.put("/:id/end", auth, endCall);

// =====================================================
// ROOM
// =====================================================

// Get appointment by room ID
router.get("/room/:roomId", auth, getAppointmentByRoom);

// =====================================================
// PAYMENT
// =====================================================

// Create PayU payment
router.post("/:id/create-payu", auth, createPayuPayment);

// Mark appointment as paid
router.patch("/:id/pay", auth, markAppointmentPaid);

// =====================================================
// GENERIC ROUTES
// MUST BE LAST
// =====================================================

// Get appointment by ID
router.get("/:id", auth, getAppointmentById);

// Update appointment
router.put("/:id", auth, updateAppointment);

// =====================================================

module.exports = router;
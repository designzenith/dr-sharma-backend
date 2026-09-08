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
router.post("/", auth, bookAppointment);

router.get("/patient", auth, getMyPatientAppointments);
router.get("/patient/history", auth, patientHistory);
router.get("/patient/:id", auth, patientAppointments);
router.put("/cancel/:id", auth, cancelAppointment);

// =====================================================
// DOCTOR
// =====================================================
router.get("/doctor", auth, doctorAppointments);

router.put("/:id/accept", auth, acceptAppointment);
router.put("/:id/reject", auth, rejectAppointment);
router.put("/:id/start", auth, startCall);
router.put("/:id/end", auth, endCall);

// =====================================================
// ROOM
// =====================================================
router.get("/room/:roomId", auth, getAppointmentByRoom);

// =====================================================
// PAYMENT
// =====================================================
router.post("/:id/create-payu", auth, createPayuPayment);
router.patch("/:id/pay", auth, markAppointmentPaid);

// =====================================================
// GENERIC ROUTES (MUST BE LAST)
// =====================================================
router.post("/", auth, bookAppointment);
router.get("/:id", auth, getAppointmentById);
router.put("/:id", auth, updateAppointment);

module.exports = router;
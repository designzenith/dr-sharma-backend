const Appointment = require("../models/Appointment"); // path check kar lena
const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const adminAuth = require("../middleware/adminAuth");

const {
  bookAppointment,
  getAppointmentById,
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
router.patch("/:id/cancel", auth, cancelAppointment);

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
// GENERIC ROUTES (MUST BE LAST)
// =====================================================
router.get("/:id", auth, getAppointmentById);
router.put("/:id", auth, updateAppointment);
// Mark appointment as paid after successful payment
router.post("/:id/mark-paid", auth, async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const { paymentId } = req.body;

    // Appointment find karo
    const appointment = await Appointment.findById(appointmentId);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Update status
    appointment.paymentStatus = "paid";
    appointment.status = "Pending"; // doctor approval ke liye
    if (paymentId) {
      appointment.paymentId = paymentId; // agar field exist karti hai
    }

    await appointment.save();

    return res.status(200).json({
      success: true,
      message: "Payment marked as successful",
      appointment,
    });
  } catch (error) {
    console.error("mark-paid error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update payment status",
    });
  }
});
module.exports = router;
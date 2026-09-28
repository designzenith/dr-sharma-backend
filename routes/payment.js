const express = require("express");
const router = express.Router();

const Appointment = require("../models/Appointment");
const { sendConsultationEmails } = require("../utils/sendConsultationEmail");
const auth = require("../middleware/auth");

// =====================================================
// CONFIRM PAYMENT
// =====================================================
// This endpoint should be called ONLY after the payment
// has been successfully verified with Cashfree.
//
// Flow:
// Cashfree Payment Success
//        ↓
// Verify payment
//        ↓
// This API
//        ↓
// paymentStatus = paid
// status = Pending
//        ↓
// Doctor accepts appointment
//        ↓
// status = Confirmed
// roomId generated
// =====================================================

router.post("/confirm-payment/:id", auth, async (req, res) => {
  try {
    const appointmentId = req.params.id;

    console.log("====================================");
    console.log("CONFIRM PAYMENT");
    console.log("Appointment ID:", appointmentId);
    console.log("User ID:", req.user?._id);
    console.log("====================================");

    // =====================================================
    // FIND APPOINTMENT
    // =====================================================

    const appointment = await Appointment.findOne({
      _id: appointmentId,
      patient: req.user._id,
    })
      .populate("patient", "name email phone")
      .populate("doctor", "name email");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // =====================================================
    // CHECK APPOINTMENT STATUS
    // =====================================================

    if (appointment.status !== "Pending Payment") {
      return res.status(400).json({
        success: false,
        message: `Appointment is not awaiting payment. Current status: ${appointment.status}`,
      });
    }

    // =====================================================
    // PAYMENT ID
    // =====================================================
    // Cashfree order/payment ID can be sent from frontend
    // after successful payment verification.

    const paymentId =
      req.body.paymentId ||
      req.body.orderId ||
      appointment.paymentId ||
      null;

    // =====================================================
    // MARK PAYMENT AS PAID
    // =====================================================

    appointment.paymentStatus = "paid";

    appointment.paymentId = paymentId;

    appointment.paidAt = new Date();

    // IMPORTANT:
    // Do NOT set Confirmed here.
    //
    // Your existing doctor accept flow changes:
    //
    // Pending → Confirmed
    //
    // after doctor accepts the appointment.

    appointment.status = "Pending";

    await appointment.save();

    console.log("Payment marked as paid");
    console.log("Payment ID:", appointment.paymentId);

    // =====================================================
    // SEND CONSULTATION EMAILS
    // =====================================================
    //
    // NOTE:
    // Your existing sendConsultationEmails() function
    // appears to return a roomId.
    //
    // Your current doctor acceptAppointment() also creates
    // a roomId for video/audio appointments.
    //
    // Therefore we only use the returned roomId if one
    // does not already exist.
    // =====================================================

    let roomId = appointment.roomId || null;

    try {
      const emailRoomId = await sendConsultationEmails({
        patientName: appointment.patient?.name || "Patient",

        patientEmail: appointment.patient?.email || "",

        doctorName: appointment.doctor?.name || "Doctor",

        doctorEmail: appointment.doctor?.email || "",

        // CORRECT FIELD NAMES
        appointmentDate: appointment.appointmentDate,

        appointmentTime: appointment.appointmentTime,
      });

      // Only save returned room ID if appointment doesn't
      // already have one.
      if (!roomId && emailRoomId) {
        roomId = emailRoomId;

        appointment.roomId = emailRoomId;

        await appointment.save();
      }
    } catch (emailError) {
      // Payment is already marked successful.
      // Don't make payment fail just because email failed.

      console.error(
        "Consultation email failed:",
        emailError.message
      );
    }

    // =====================================================
    // RESPONSE
    // =====================================================

    return res.status(200).json({
      success: true,

      message:
        "Payment confirmed successfully. Appointment is waiting for doctor approval.",

      appointment: {
        _id: appointment._id,

        status: appointment.status,

        paymentStatus: appointment.paymentStatus,

        paymentId: appointment.paymentId,

        paidAt: appointment.paidAt,

        appointmentDate: appointment.appointmentDate,

        appointmentTime: appointment.appointmentTime,

        consultationType: appointment.consultationType,

        roomId: appointment.roomId || roomId || null,
      },
    });
  } catch (error) {
    console.error("====================================");
    console.error("CONFIRM PAYMENT ERROR");
    console.error(error);
    console.error("====================================");

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to confirm payment",
    });
  }
});

module.exports = router;
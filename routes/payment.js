const express = require("express");
const router = express.Router();
const axios = require("axios");

const Appointment = require("../models/Appointment");
const { sendConsultationEmails } = require("../utils/sendConsultationEmail");
const auth = require("../middleware/auth");

// =====================================================
// CONFIRM PAYMENT (Secure version)
// =====================================================
router.post("/confirm-payment/:id", auth, async (req, res) => {
  try {
    const appointmentId = req.params.id;
    const orderId = req.body.orderId || req.body.paymentId;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "orderId is required",
      });
    }

    // =====================================================
    // 1. FIND APPOINTMENT
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

    // Already paid
    if (appointment.paymentStatus === "paid") {
      return res.status(200).json({
        success: true,
        message: "Payment already confirmed",
        appointment,
      });
    }

    if (appointment.status !== "Pending Payment") {
      return res.status(400).json({
        success: false,
        message: `Appointment is not awaiting payment. Current status: ${appointment.status}`,
      });
    }

    // =====================================================
    // 2. VERIFY WITH CASHFREE (IMPORTANT)
    // =====================================================
    const appId = process.env.CASHFREE_APP_ID?.trim();
    const secretKey = process.env.CASHFREE_SECRET_KEY?.trim();

    if (!appId || !secretKey) {
      return res.status(500).json({
        success: false,
        message: "Cashfree credentials missing",
      });
    }

    const apiBase = "https://api.cashfree.com/pg";

    // Get payments for this order
    const paymentsResponse = await axios.get(
      `${apiBase}/orders/${orderId}/payments`,
      {
        headers: {
          "x-client-id": appId,
          "x-client-secret": secretKey,
          "x-api-version": "2025-01-01",
          Accept: "application/json",
        },
        timeout: 20000,
      },
    );

    const payments = Array.isArray(paymentsResponse.data)
      ? paymentsResponse.data
      : [];

    const successfulPayment = payments.find(
      (p) => p.payment_status === "SUCCESS",
    );

    if (!successfulPayment) {
      return res.status(400).json({
        success: false,
        message: "Payment not successful on Cashfree",
        paymentStatus: payments[0]?.payment_status || "FAILED",
      });
    }

    // =====================================================
    // 3. MARK AS PAID
    // =====================================================
    appointment.paymentStatus = "paid";
    appointment.paymentId = orderId;
    appointment.paidAt = new Date();
    appointment.status = "Pending"; // waiting for doctor approval

    await appointment.save();

    // =====================================================
    // 4. SEND EMAILS (optional)
    // =====================================================
    try {
      await sendConsultationEmails({
        patientName: appointment.patient?.name || "Patient",
        patientEmail: appointment.patient?.email || "",
        doctorName: appointment.doctor?.name || "Doctor",
        doctorEmail: appointment.doctor?.email || "",
        appointmentDate: appointment.appointmentDate,
        appointmentTime: appointment.appointmentTime,
      });
    } catch (emailError) {
      console.error("Consultation email failed:", emailError.message);
      // Don't fail the request because of email
    }

    // =====================================================
    // 5. RESPONSE
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
        roomId: appointment.roomId || null,
      },
    });
  } catch (error) {
    console.error("CONFIRM PAYMENT ERROR:", error.response?.data || error.message);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to confirm payment",
    });
  }
});

module.exports = router;
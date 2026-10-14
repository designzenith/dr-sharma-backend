const axios = require("axios");
const Appointment = require("../models/Appointment");
const User = require("../models/User");
const Doctor = require("../models/Doctor");
const { incrementCouponUsage } = require("./couponController");
const Notification = require("../models/Notification");
const { sendConsultationEmails } = require("../utils/sendConsultationEmail");

// =====================================================
// HELPERS
// =====================================================
const createNotification = async ({
  user,
  appointment,
  title,
  message,
  type = "general",
}) => {
  try {
    if (!user || !title || !message) return null;

    return await Notification.create({
      user,
      appointment: appointment?._id || appointment || null,
      title,
      message,
      type: [
        "appointment-reminder",
        "appointment-30-minutes",
        "general",
      ].includes(type)
        ? type
        : "general",
      isRead: false,
    });
  } catch (error) {
    console.error("Notification error:", error.message);
    return null;
  }
};

// =====================================================
// 1. CREATE CASHFREE ORDER
// =====================================================
const createCashfreePayment = async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id || req.body.appointmentId,
      patient: req.user._id,
    }).populate("doctor", "name consultationFee");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    if (appointment.status !== "Pending Payment") {
      return res.status(400).json({
        success: false,
        message: `This appointment is not eligible for payment. Current status: ${appointment.status}`,
      });
    }

    const appId = process.env.CASHFREE_APP_ID?.trim();
    const secretKey = process.env.CASHFREE_SECRET_KEY?.trim();

    if (!appId || !secretKey) {
      console.error("Cashfree credentials missing");
      return res.status(500).json({
        success: false,
        message: "Cashfree credentials are not configured",
      });
    }

    const amount = Number(
      appointment.finalAmount ??
        appointment.consultationFee ??
        appointment.doctor?.consultationFee ??
        0
    );

    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment amount",
      });
    }

    const orderAmount = Number(amount.toFixed(2));
    const orderId = `APPT_${appointment._id.toString().slice(-8)}_${Date.now()}`;

    const patientUser = await User.findById(req.user._id).select(
      "name email phone"
    );

    if (!patientUser) {
      return res.status(404).json({
        success: false,
        message: "Patient user not found",
      });
    }

    const customerName = String(patientUser.name || "Patient")
      .replace(/[^a-zA-Z0-9 ]/g, "")
      .trim()
      .substring(0, 100);

    const customerEmail = patientUser.email || "patient@example.com";

    const customerPhone = String(patientUser.phone || "")
      .replace(/\D/g, "")
      .slice(-10);

    if (customerPhone.length !== 10) {
      return res.status(400).json({
        success: false,
        message:
          "A valid 10-digit patient phone number is required for payment",
      });
    }

    const apiBase = "https://api.cashfree.com/pg";
    const frontendUrl = process.env.FRONTEND_URL || "https://irenemedics.com";
    const backendUrl = process.env.BACKEND_URL || "https://api.irenemedics.com";

    const payload = {
      order_id: orderId,
      order_amount: orderAmount,
      order_currency: "INR",
      customer_details: {
        customer_id: req.user._id.toString(),
        customer_name: customerName || "Patient",
        customer_email: customerEmail,
        customer_phone: customerPhone,
      },
      order_meta: {
        return_url: `${frontendUrl}/payment/success?order_id={order_id}&appointment_id=${appointment._id}`,
        notify_url: `${backendUrl}/api/cashfree/webhook`,
      },
      order_note: `Doctor Consultation - ${appointment.doctor?.name || "Doctor"}`,
    };

    console.log("========== CASHFREE CREATE ORDER ==========");
    console.log("Order ID:", orderId);
    console.log("Amount:", orderAmount);
    console.log("==========================================");

    const response = await axios.post(`${apiBase}/orders`, payload, {
      headers: {
        "x-client-id": appId,
        "x-client-secret": secretKey,
        "x-api-version": "2025-01-01",
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });

    const cashfreeOrder = response.data;

    if (!cashfreeOrder?.order_id || !cashfreeOrder?.payment_session_id) {
      return res.status(500).json({
        success: false,
        message: "Cashfree did not return a valid payment session",
      });
    }

    appointment.paymentId = cashfreeOrder.order_id;
    await appointment.save();

    return res.status(200).json({
      success: true,
      paymentData: {
        order_id: cashfreeOrder.order_id,
        payment_session_id: cashfreeOrder.payment_session_id,
        order_amount: cashfreeOrder.order_amount,
        order_currency: cashfreeOrder.order_currency || "INR",
        env: "production",
      },
    });
  } catch (error) {
    console.error("CASHFREE CREATE ERROR:", error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      success: false,
      message:
        error.response?.data?.message ||
        error.message ||
        "Cashfree payment creation failed",
    });
  }
};

// =====================================================
// COMMON FUNCTION: Mark as Paid + Confirmed + Send Email
// =====================================================
const markAppointmentAsPaidAndConfirmed = async (appointment) => {
  // Already processed
  if (
    appointment.paymentStatus === "paid" &&
    appointment.status === "Confirmed"
  ) {
    return appointment;
  }

  // Mark as paid + confirmed
  appointment.status = "Confirmed";
  appointment.paymentStatus = "paid";
  appointment.paidAt = new Date();

  // Generate roomId for video if not already present
  if (appointment.consultationType === "video" && !appointment.roomId) {
    const id = Math.floor(100000 + Math.random() * 900000);
    appointment.roomId = `VC-${id}`;
  }

  await appointment.save();

  // Increment coupon usage
  if (appointment.couponCode) {
    await incrementCouponUsage(appointment.couponCode);
  }

  // Get doctor + patient details
  const doctorProfile = await Doctor.findById(appointment.doctor)
    .select(
      "name email phone mobile clinicAddress clinicCity clinicPincode hospital address user"
    )
    .populate("user", "name email phone");

  const patientUser = await User.findById(appointment.patient).select(
    "name email phone"
  );

  const doctorPhone =
    doctorProfile?.phone ||
    doctorProfile?.mobile ||
    doctorProfile?.user?.phone ||
    "";

  const clinicAddress =
    doctorProfile?.clinicAddress ||
    doctorProfile?.address ||
    doctorProfile?.hospital ||
    "";

  // ---------- Send Confirmation Emails ----------
  try {
    const roomId = await sendConsultationEmails({
      patientName: patientUser?.name || "Patient",
      patientEmail: patientUser?.email || "",
      doctorName: doctorProfile?.name || "Doctor",
      doctorEmail:
        doctorProfile?.email || doctorProfile?.user?.email || "",
      doctorPhone,
      clinicAddress,
      appointmentDate: appointment.appointmentDate
        ? new Date(appointment.appointmentDate).toLocaleDateString("en-IN")
        : "",
      appointmentTime: appointment.appointmentTime || "",
      consultationType: appointment.consultationType || "video",
      roomId: appointment.roomId,
    });

    // Save roomId if generated by email utility
    if (roomId && !appointment.roomId) {
      appointment.roomId = roomId;
      await appointment.save();
    }

    console.log("✅ Consultation emails sent. RoomId:", roomId || appointment.roomId);
  } catch (emailError) {
    console.error("❌ Email sending failed:", emailError.message);
  }

  // ---------- In-app Notifications ----------
  if (doctorProfile?.user) {
    await createNotification({
      user: doctorProfile.user._id || doctorProfile.user,
      appointment,
      title: "New Confirmed Appointment",
      message: `${patientUser?.name || "A patient"} has paid and the appointment is confirmed.`,
      type: "appointment-booked",
    });
  }

  await createNotification({
    user: appointment.patient,
    appointment,
    title: "Appointment Confirmed",
    message: `Your ${appointment.consultationType} consultation has been confirmed after successful payment.`,
    type: "appointment-booked",
  });

  return appointment;
};

// =====================================================
// 2. VERIFY PAYMENT
// =====================================================
const verifyCashfreePayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const appointmentId = req.query.appointment_id || req.body.appointmentId;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        paymentStatus: "FAILED",
        message: "orderId is required",
      });
    }

    const appId = process.env.CASHFREE_APP_ID?.trim();
    const secretKey = process.env.CASHFREE_SECRET_KEY?.trim();

    if (!appId || !secretKey) {
      return res.status(500).json({
        success: false,
        paymentStatus: "FAILED",
        message: "Cashfree credentials missing",
      });
    }

    const apiBase = "https://api.cashfree.com/pg";

    // 1. Get Order
    const orderResponse = await axios.get(`${apiBase}/orders/${orderId}`, {
      headers: {
        "x-client-id": appId,
        "x-client-secret": secretKey,
        "x-api-version": "2025-01-01",
        Accept: "application/json",
      },
      timeout: 20000,
    });

    const orderData = orderResponse.data;

    // 2. Get Payments
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
      }
    );

    const payments = Array.isArray(paymentsResponse.data)
      ? paymentsResponse.data
      : [];

    const successfulPayment = payments.find(
      (p) => p.payment_status === "SUCCESS"
    );
    const latestPayment = payments[0] || null;

    // ========== CASE 1: SUCCESS ==========
    if (successfulPayment) {
      const appointment = await Appointment.findOne({
        $or: [{ paymentId: orderId }, { _id: appointmentId }],
        patient: req.user._id,
      });

      if (!appointment) {
        return res.status(404).json({
          success: false,
          paymentStatus: "FAILED",
          message: "Appointment not found for this payment",
        });
      }

      // Mark as Paid + Confirmed + Send Email
      const updatedAppointment = await markAppointmentAsPaidAndConfirmed(
        appointment
      );

      const populated = await Appointment.findById(updatedAppointment._id)
        .populate(
          "doctor",
          "name specialization hospital image consultationFee phone mobile clinicAddress clinicCity clinicPincode address"
        )
        .populate("patient", "name email phone");

      return res.status(200).json({
        success: true,
        paymentStatus: "SUCCESS",
        message: "Payment successful. Appointment confirmed.",
        appointment: populated,
      });
    }

    // ========== CASE 2: NOT SUCCESS ==========
    let paymentStatus = "FAILED";
    let message = "Payment failed or was cancelled.";

    if (latestPayment) {
      paymentStatus = latestPayment.payment_status;
      message =
        latestPayment.payment_message ||
        latestPayment.error_details?.error_description ||
        latestPayment.error_details?.message ||
        `Payment ${paymentStatus.toLowerCase()}`;
    } else {
      paymentStatus =
        orderData.order_status === "ACTIVE" ? "PENDING" : "FAILED";
      message =
        orderData.order_status === "ACTIVE"
          ? "Payment is still pending."
          : "No payment attempt found.";
    }

    return res.status(200).json({
      success: false,
      paymentStatus,
      message,
      order_status: orderData.order_status,
    });
  } catch (error) {
    console.error("VERIFY PAYMENT ERROR:", error.response?.data || error.message);
    return res.status(error.response?.status || 500).json({
      success: false,
      paymentStatus: "FAILED",
      message:
        error.response?.data?.message ||
        error.message ||
        "Payment verification failed",
    });
  }
};

// =====================================================
// 3. WEBHOOK
// =====================================================
const cashfreeWebhook = async (req, res) => {
  try {
    // Always respond 200 quickly
    res.status(200).send("OK");

    const event = req.body;

    console.log("========== CASHFREE WEBHOOK ==========");
    console.log("Type:", event.type);
    console.log("Order ID:", event.data?.order?.order_id);
    console.log("======================================");

    if (
      event.type === "PAYMENT_SUCCESS_WEBHOOK" ||
      event.type === "PAYMENT_SUCCESS" ||
      event.data?.payment?.payment_status === "SUCCESS"
    ) {
      const orderId =
        event.data?.order?.order_id ||
        event.data?.payment?.order_id ||
        event.order_id;

      if (!orderId) return;

      const appointment = await Appointment.findOne({ paymentId: orderId });

      if (!appointment) {
        console.warn("Webhook: Appointment not found for order:", orderId);
        return;
      }

      // Mark as Paid + Confirmed + Send Email
      await markAppointmentAsPaidAndConfirmed(appointment);

      console.log("Webhook: Appointment confirmed →", appointment._id);
    }
  } catch (error) {
    console.error("Cashfree Webhook Error:", error.message);
  }
};

// =====================================================
// EXPORTS
// =====================================================
module.exports = {
  createCashfreePayment,
  verifyCashfreePayment,
  cashfreeWebhook,
};
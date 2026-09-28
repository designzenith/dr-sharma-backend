const axios = require("axios");
const crypto = require("crypto");
const Appointment = require("../models/Appointment");
const User = require("../models/User");
const Doctor = require("../models/Doctor");
const { incrementCouponUsage } = require("./couponController");
const Notification = require("../models/Notification");

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

    // ---------- Credentials ----------
    const appId = process.env.CASHFREE_APP_ID?.trim();
    const secretKey = process.env.CASHFREE_SECRET_KEY?.trim();
    const env = (process.env.CASHFREE_ENV || "TEST").toUpperCase();

    if (!appId || !secretKey) {
      console.error("Cashfree credentials missing");
      return res.status(500).json({
        success: false,
        message: "Cashfree credentials are not configured",
      });
    }

    // Safety: TEST mode me keys TEST_ se start honi chahiye
    // if (env === "TEST" && (!appId.startsWith("TEST_") || !secretKey.startsWith("TEST_"))) {
    //   return res.status(500).json({
    //     success: false,
    //     message: "Sandbox mode me App ID aur Secret Key TEST_ se start hone chahiye",
    //   });
    // }
    // Optional soft warning only
    if (
      env === "TEST" &&
      !secretKey.includes("test") &&
      !secretKey.startsWith("TEST_")
    ) {
      console.warn("Warning: Secret key does not look like a test key");
    }
    // ---------- Amount ----------
    const amount = Number(
      appointment.finalAmount ??
        appointment.consultationFee ??
        appointment.doctor?.consultationFee ??
        0,
    );

    if (isNaN(amount) || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment amount",
      });
    }

    const orderAmount = Number(amount.toFixed(2));

    // ---------- Unique Order ID ----------
    const orderId = `APPT_${appointment._id.toString().slice(-8)}_${Date.now()}`;

    // ---------- Patient details (safe way) ----------
    const patientUser = await User.findById(req.user._id).select(
      "name email phone",
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

    // ---------- API Base ----------
    const apiBase =
      env === "PROD"
        ? "https://api.cashfree.com/pg"
        : "https://sandbox.cashfree.com/pg";

    // ---------- Payload ----------
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
        return_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/payment/success?order_id={order_id}&appointment_id=${appointment._id}`,
        notify_url: `${process.env.BACKEND_URL || "http://localhost:5000"}/api/cashfree/webhook`,
      },
      order_note: `Doctor Consultation - ${appointment.doctor?.name || "Doctor"}`,
    };

    console.log("========== CASHFREE CREATE ORDER ==========");
    console.log("Env:", env);
    console.log("API Base:", apiBase);
    console.log("Order ID:", orderId);
    console.log("Amount:", orderAmount);
    console.log("Customer Phone:", `******${customerPhone.slice(-4)}`);
    console.log("==========================================");

    // ---------- Create Order ----------
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
      console.error("Invalid Cashfree response:", cashfreeOrder);
      return res.status(500).json({
        success: false,
        message: "Cashfree did not return a valid payment session",
      });
    }

    // Save order_id on appointment
    appointment.paymentId = cashfreeOrder.order_id;
    await appointment.save();

    return res.status(200).json({
      success: true,
      paymentData: {
        order_id: cashfreeOrder.order_id,
        payment_session_id: cashfreeOrder.payment_session_id,
        order_amount: cashfreeOrder.order_amount,
        order_currency: cashfreeOrder.order_currency || "INR",
        env: env === "PROD" ? "production" : "sandbox",
      },
    });
  } catch (error) {
    console.error("========== CASHFREE CREATE ERROR ==========");
    console.error("Status:", error.response?.status);
    console.error("Data:", error.response?.data);
    console.error("Message:", error.message);
    console.error("==========================================");

    const cashfreeData = error.response?.data;

    return res.status(error.response?.status || 500).json({
      success: false,
      message:
        cashfreeData?.message ||
        cashfreeData?.error_description ||
        error.message ||
        "Cashfree payment creation failed",
      cashfreeError: cashfreeData || null,
    });
  }
};

// =====================================================
// 2. VERIFY PAYMENT (Secure - calls Cashfree)
// =====================================================
const verifyCashfreePayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    const appointmentId = req.query.appointment_id || req.body.appointmentId;

    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: "orderId is required",
      });
    }

    const appId = process.env.CASHFREE_APP_ID?.trim();
    const secretKey = process.env.CASHFREE_SECRET_KEY?.trim();
    const env = (process.env.CASHFREE_ENV || "TEST").toUpperCase();

    if (!appId || !secretKey) {
      return res.status(500).json({
        success: false,
        message: "Cashfree credentials missing",
      });
    }
    console.log("========== CASHFREE KEYS DEBUG ==========");
    console.log("Env:", env);
    console.log("App ID:", appId);
    console.log("Secret (first 15):", secretKey?.substring(0, 15));
    console.log("App ID length:", appId?.length);
    console.log("Secret length:", secretKey?.length);
    console.log("=========================================");
    const apiBase =
      env === "PROD"
        ? "https://api.cashfree.com/pg"
        : "https://sandbox.cashfree.com/pg";

    // Get order details from Cashfree
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

    const payments = paymentsResponse.data || [];
    const successfulPayment = payments.find(
      (p) => p.payment_status === "SUCCESS",
    );

    if (!successfulPayment) {
      return res.status(400).json({
        success: false,
        message: "Payment not successful yet",
        order_status: orderData.order_status,
        payments,
      });
    }

    // Find appointment
    const appointment = await Appointment.findOne({
      $or: [{ paymentId: orderId }, { _id: appointmentId }],
      patient: req.user._id,
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found for this payment",
      });
    }

    // Already paid?
    if (appointment.paymentStatus === "paid") {
      return res.status(200).json({
        success: true,
        message: "Payment already verified",
        appointment,
      });
    }

    // Mark as paid
    appointment.status = "Pending"; // waiting for doctor approval
    appointment.paymentStatus = "paid";
    appointment.paymentId = orderId;
    appointment.paidAt = new Date();
    await appointment.save();

    // Coupon usage
    if (appointment.couponCode) {
      await incrementCouponUsage(appointment.couponCode);
    }

    // Notify doctor
    const doctorProfile = await Doctor.findById(appointment.doctor);
    const patientUser = await User.findById(appointment.patient).select(
      "name email phone",
    );

    if (doctorProfile?.user) {
      await createNotification({
        user: doctorProfile.user,
        appointment,
        title: "New Paid Appointment Request",
        message: `${patientUser?.name || "A patient"} has paid and requested an appointment.`,
        type: "appointment-booked",
      });
    }

    const populated = await Appointment.findById(appointment._id)
      .populate("doctor", "name specialization hospital image consultationFee")
      .populate("patient", "name email phone");

    return res.status(200).json({
      success: true,
      message: "Payment verified successfully. Waiting for doctor approval.",
      appointment: populated,
      payment: successfulPayment,
    });
  } catch (error) {
    console.error("========== VERIFY PAYMENT ERROR ==========");
    console.error(error.response?.data || error.message);
    console.error("==========================================");

    return res.status(error.response?.status || 500).json({
      success: false,
      message:
        error.response?.data?.message ||
        error.message ||
        "Payment verification failed",
    });
  }
};

// =====================================================
// 3. WEBHOOK (Cashfree → Backend)
// =====================================================
const cashfreeWebhook = async (req, res) => {
  try {
    // Always respond 200 quickly so Cashfree doesn't retry unnecessarily
    res.status(200).send("OK");

    const event = req.body;

    console.log("========== CASHFREE WEBHOOK ==========");
    console.log("Type:", event.type);
    console.log("Order ID:", event.data?.order?.order_id);
    console.log("======================================");

    // We mainly care about payment success
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

      if (appointment.paymentStatus === "paid") {
        console.log("Webhook: Already marked as paid");
        return;
      }

      appointment.status = "Pending";
      appointment.paymentStatus = "paid";
      appointment.paidAt = new Date();
      await appointment.save();

      if (appointment.couponCode) {
        await incrementCouponUsage(appointment.couponCode);
      }

      // Notify doctor
      const doctorProfile = await Doctor.findById(appointment.doctor);
      const patientUser = await User.findById(appointment.patient).select(
        "name",
      );

      if (doctorProfile?.user) {
        await createNotification({
          user: doctorProfile.user,
          appointment,
          title: "New Paid Appointment Request",
          message: `${patientUser?.name || "A patient"} has paid and requested an appointment.`,
          type: "appointment-booked",
        });
      }

      console.log("Webhook: Appointment marked as paid →", appointment._id);
    }
  } catch (error) {
    console.error("Cashfree Webhook Error:", error.message);
    // Already sent 200, so just log
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

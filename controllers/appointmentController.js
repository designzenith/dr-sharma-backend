const Appointment = require("../models/Appointment");

const Doctor = require("../models/Doctor");

const User = require("../models/User");

const validatePatientIntake = require("../utils/validatePatientIntake");

const { v4: uuidv4 } = require("uuid");

const DoctorLeave = require("../models/DoctorLeave");

const Notification = require("../models/Notification");

const { sendSMS } = require("../utils/notify");

const nodemailer = require("nodemailer");

const crypto = require("crypto");

const Coupon = require("../models/Coupon");

const { incrementCouponUsage } = require("./couponController");

// =====================================================

// EMAIL CONFIGURATION

// =====================================================

const emailTransporter = nodemailer.createTransport({
  service: "gmail",

  auth: {
    user: process.env.EMAIL_USER,

    pass: process.env.EMAIL_PASS,
  },
});

// =====================================================

// NOTIFICATION / EMAIL / SMS HELPERS

// =====================================================

const createAppointmentNotification = async ({
  user,

  appointment,

  title,

  message,

  type = "general",
}) => {
  try {
    if (!user || !title || !message) {
      console.warn("Notification skipped: missing user/title/message");

      return null;
    }

    const notification = await Notification.create({
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

    console.log("Notification created:", notification._id.toString());

    return notification;
  } catch (error) {
    console.error("Create appointment notification error:", error.message);

    return null;
  }
};

const escapeHtml = (value = "") => {
  return String(value)
    .replace(/&/g, "&amp;")

    .replace(/</g, "&lt;")

    .replace(/>/g, "&gt;")

    .replace(/"/g, "&quot;")

    .replace(/'/g, "&#039;");
};

const formatAppointmentDate = (date) => {
  if (!date) return "";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",

    month: "2-digit",

    year: "numeric",
  });
};

const formatEmailMessage = (message = "") => {
  return escapeHtml(message)
    .split(/\n\n+/)

    .map((paragraph) => {
      const formatted = paragraph

        .replace(
          /^(Doctor|Date|Time|Consultation|Reason):/gm,

          "<strong>$1:</strong>",
        )

        .replace(/\n/g, "<br />");

      return `

        <p style="

          margin: 0 0 14px 0;

          color: #374151;

          font-size: 15px;

          line-height: 1.7;

        ">

          ${formatted}

        </p>

      `;
    })

    .join("");
};

const sendAppointmentEmail = async ({ to, subject, message }) => {
  try {
    if (!to) {
      console.warn("Email skipped: recipient email is missing.");

      return null;
    }

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.warn("Email skipped: EMAIL_USER or EMAIL_PASS is missing.");

      return null;
    }

    const safeSubject = escapeHtml(subject);

    const htmlMessage = formatEmailMessage(message);

    const html = `

<!DOCTYPE html>

<html>

<head>

  <meta charset="UTF-8" />

  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <title>${safeSubject}</title>

</head>

<body style="margin: 0; padding: 0; background-color: #f3f4f6; font-family: Arial, Helvetica, sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f3f4f6; padding: 30px 15px;">

    <tr>

      <td align="center">

        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width: 600px; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">

          <tr>

            <td style="background-color: #2563eb; padding: 28px 30px; text-align: center;">

              <h1 style="margin: 0; color: #ffffff; font-size: 24px; line-height: 1.3; font-weight: 700;">

                Dr. Sharma Healthcare

              </h1>

              <p style="margin: 8px 0 0; color: #dbeafe; font-size: 14px; line-height: 1.5;">

                Healthcare &amp; Appointment Services

              </p>

            </td>

          </tr>

          <tr>

            <td style="padding: 32px 30px;">

              <h2 style="margin: 0 0 24px; color: #111827; font-size: 22px; line-height: 1.35; font-weight: 700;">

                ${safeSubject}

              </h2>

              ${htmlMessage}

            </td>

          </tr>

          <tr>

            <td style="padding: 20px 30px; background-color: #f9fafb; border-top: 1px solid #e5e7eb; text-align: center;">

              <p style="margin: 0; color: #6b7280; font-size: 13px; line-height: 1.6;">

                This is an automated email from Dr. Sharma Healthcare.

              </p>

              <p style="margin: 6px 0 0; color: #9ca3af; font-size: 12px; line-height: 1.5;">

                Please do not reply directly to this email.

              </p>

            </td>

          </tr>

        </table>

      </td>

    </tr>

  </table>

</body>

</html>

`;

    const result = await emailTransporter.sendMail({
      from: `"Dr. Sharma Healthcare" <${process.env.EMAIL_USER}>`,

      to,

      subject,

      text: message,

      html,
    });

    console.log("Email sent successfully:", result.messageId);

    return result;
  } catch (error) {
    console.error("Appointment email failed:", error.message);

    return null;
  }
};

const sendAppointmentSMS = async ({ to, message }) => {
  try {
    if (!to) {
      console.warn("SMS skipped: recipient phone is missing.");

      return {
        success: false,

        skipped: true,

        message: "Recipient phone is missing",
      };
    }

    if (typeof sendSMS !== "function") {
      console.warn("SMS skipped: sendSMS function is unavailable.");

      return {
        success: false,

        skipped: true,

        message: "sendSMS function is unavailable",
      };
    }

    const result = await sendSMS(to, message);

    if (result?.success) {
      console.log("Appointment SMS sent successfully:", result.sid || "");
    } else {
      console.warn(
        "Appointment SMS was not sent:",

        result?.message || result?.error || "Unknown SMS error",
      );
    }

    return result;
  } catch (error) {
    console.error("Appointment SMS failed:", error.message);

    return {
      success: false,

      error: error.message,
    };
  }
};

// =====================================================

// BOOK APPOINTMENT

// =====================================================

// =====================================================

// BOOK APPOINTMENT

// =====================================================

const calculateAppointmentCoupon = async (couponCode, appointmentAmount) => {
  const originalAmount = Number(Number(appointmentAmount || 0).toFixed(2));

  if (!couponCode) {
    return {
      couponCode: null,

      originalAmount,

      discountAmount: 0,

      finalAmount: originalAmount,
    };
  }

  const normalizedCode = String(couponCode).trim().toUpperCase();

  if (!normalizedCode) {
    return {
      couponCode: null,

      originalAmount,

      discountAmount: 0,

      finalAmount: originalAmount,
    };
  }

  const coupon = await Coupon.findOne({ code: normalizedCode });

  if (!coupon) {
    const error = new Error("Invalid coupon code");

    error.statusCode = 404;

    throw error;
  }

  if (coupon.status !== "Active") {
    const error = new Error("This coupon is not active");

    error.statusCode = 400;

    throw error;
  }

  if (!coupon.expiryDate || new Date() > new Date(coupon.expiryDate)) {
    const error = new Error("This coupon has expired");

    error.statusCode = 400;

    throw error;
  }

  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    const error = new Error("This coupon usage limit has been reached");

    error.statusCode = 400;

    throw error;
  }

  if (originalAmount < Number(coupon.minAmount || 0)) {
    const error = new Error(
      `Minimum order amount for this coupon is ₹${Number(coupon.minAmount || 0).toFixed(2)}`,
    );

    error.statusCode = 400;

    throw error;
  }

  let discountAmount = 0;

  if (coupon.discountType === "Percentage") {
    discountAmount = (originalAmount * Number(coupon.discount || 0)) / 100;

    if (coupon.maxDiscount > 0 && discountAmount > coupon.maxDiscount) {
      discountAmount = Number(coupon.maxDiscount);
    }
  } else {
    discountAmount = Number(coupon.discount || 0);
  }

  discountAmount = Math.min(discountAmount, originalAmount);

  discountAmount = Number(discountAmount.toFixed(2));

  const finalAmount = Number(
    Math.max(0, originalAmount - discountAmount).toFixed(2),
  );

  return {
    couponCode: coupon.code,

    originalAmount,

    discountAmount,

    finalAmount,
  };
};

const bookAppointment = async (req, res) => {
  try {
    const patientId = req.user._id;

    const {
      doctor,

      appointmentDate,

      appointmentTime,

      consultationType,

      patientIntake,

      couponCode,
    } = req.body;

    // Validate doctor

    const doctorProfile = await Doctor.findById(doctor);

    if (!doctorProfile) {
      return res.status(404).json({
        success: false,

        message: "Doctor not found",
      });
    }

    if (!doctorProfile.available) {
      return res.status(400).json({
        success: false,

        message: "Doctor is currently unavailable",
      });
    }

    // Validate consultation type

    if (
      !consultationType ||
      !["video", "audio", "clinic"].includes(consultationType)
    ) {
      return res.status(400).json({
        success: false,

        message: "Invalid consultation type",
      });
    }

    // ========== VALIDATE PATIENT INTAKE ==========

    const { isValid, errors } = validatePatientIntake(
      patientIntake,

      doctorProfile.intakeQuestions || [],
    );

    if (!isValid) {
      return res.status(400).json({
        success: false,

        message: "Please fill all required fields",

        errors,
      });
    }

    const selectedDate = new Date(appointmentDate);

    selectedDate.setHours(0, 0, 0, 0);

    // Check Doctor Leave

    const leave = await DoctorLeave.findOne({
      doctor: doctorProfile._id,

      status: "Active",

      isActive: true,

      fromDate: { $lte: selectedDate },

      toDate: { $gte: selectedDate },
    });

    if (leave) {
      if (["Full Day", "Vacation", "Emergency"].includes(leave.leaveType)) {
        return res.status(400).json({
          success: false,

          message: `Doctor is on leave (${leave.leaveType}) on this date`,
        });
      }

      if (leave.leaveType === "Weekly Off") {
        return res.status(400).json({
          success: false,

          message: "Doctor is on weekly off",
        });
      }

      if (leave.leaveType === "Half Day" && leave.fromTime && leave.toTime) {
        const [slotStart, slotEnd] = (appointmentTime || "")

          .split(" - ")

          .map((t) => t.trim());

        if (slotStart && slotEnd) {
          const overlaps = slotStart < leave.toTime && slotEnd > leave.fromTime;

          if (overlaps) {
            return res.status(400).json({
              success: false,

              message: `Doctor is on half-day leave (${leave.fromTime} - ${leave.toTime}). Please choose another time.`,
            });
          }
        }
      }
    }

    // Check if slot is already booked

    const existingAppointment = await Appointment.findOne({
      doctor: doctorProfile._id,

      appointmentDate: selectedDate,

      appointmentTime,

      status: {
        $in: ["Pending", "Confirmed", "In Progress", "Pending Payment"],
      },
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,

        message: "This appointment slot is already booked or pending approval",
      });
    }

    // Decide status based on consultation type

    let status = "Pending"; // default for clinic

    if (consultationType === "video" || consultationType === "audio") {
      status = "Pending Payment";
    }

    // ===============================

    // COUPON / FINAL AMOUNT

    // Coupons are applicable only to online consultations

    // because clinic appointments do not use the PayU payment flow.

    // ===============================

    const consultationFee = Number(doctorProfile.consultationFee || 0);

    if (couponCode && consultationType === "clinic") {
      return res.status(400).json({
        success: false,

        message: "Coupons can only be used for online consultations.",
      });
    }

    const couponResult = await calculateAppointmentCoupon(
      couponCode,

      consultationFee,
    );

    // Create appointment with final pricing

    const appointment = await Appointment.create({
      patient: patientId,

      doctor: doctorProfile._id,

      appointmentDate: selectedDate,

      appointmentTime,

      consultationType,

      status,

      consultationFee,

      originalAmount: couponResult.originalAmount,

      discountAmount: couponResult.discountAmount,

      finalAmount: couponResult.finalAmount,

      couponCode: couponResult.couponCode,

      patientIntake: patientIntake || null,
    });

    // Notifications / Email / SMS

    const patientUser =
      await User.findById(patientId).select("name email phone");

    const doctorUser = doctorProfile.user
      ? await User.findById(doctorProfile.user).select("name email phone")
      : null;

    const bookingDate = formatAppointmentDate(selectedDate);

    // Build patient intake summary for emails

    let intakeSummary = "";

    if (patientIntake) {
      intakeSummary =
        `\nPatient Details:\n` +
        `Name: ${patientIntake.fullName || "-"}\n` +
        `Age / Gender: ${patientIntake.age || "-"} / ${patientIntake.gender || "-"}\n` +
        `Phone: ${patientIntake.phone || "-"}\n` +
        `Email: ${patientIntake.email || "-"}\n` +
        `Chief Complaint: ${patientIntake.chiefComplaint || "-"}\n`;

      if (patientIntake.durationOfSymptoms) {
        intakeSummary += `Duration: ${patientIntake.durationOfSymptoms}\n`;
      }

      if (patientIntake.currentMedications) {
        intakeSummary += `Medications: ${patientIntake.currentMedications}\n`;
      }

      if (patientIntake.allergies) {
        intakeSummary += `Allergies: ${patientIntake.allergies}\n`;
      }

      if (patientIntake.pastMedicalHistory) {
        intakeSummary += `Past History: ${patientIntake.pastMedicalHistory}\n`;
      }

      // Specialty answers

      if (
        patientIntake.specialtyAnswers &&
        Object.keys(patientIntake.specialtyAnswers).length > 0
      ) {
        intakeSummary += `\nSpecialty Questions (${doctorProfile.specialization}):\n`;

        Object.entries(patientIntake.specialtyAnswers).forEach(
          ([key, value]) => {
            if (value) {
              intakeSummary += `${key}: ${value}\n`;
            }
          },
        );
      }

      if (patientIntake.additionalNotes) {
        intakeSummary += `\nAdditional Notes: ${patientIntake.additionalNotes}\n`;
      }
    }

    // Patient notification

    await createAppointmentNotification({
      user: patientId,

      appointment,

      title:
        consultationType === "clinic"
          ? "Appointment Request Sent"
          : "Appointment Created - Payment Required",

      message:
        consultationType === "clinic"
          ? "Your clinic visit request has been sent to the doctor and is waiting for approval."
          : "Your appointment has been created. Please complete the payment to confirm.",

      type: "appointment-booked",
    });

    // Doctor notification (only for clinic)

    if (consultationType === "clinic" && doctorProfile.user) {
      await createAppointmentNotification({
        user: doctorProfile.user,

        appointment,

        title: "New Clinic Visit Request",

        message: `${
          patientUser?.name || patientIntake?.fullName || "A patient"
        } requested a clinic visit for ${bookingDate} at ${appointmentTime}.`,

        type: "appointment-booked",
      });
    }

    // Emails

    await sendAppointmentEmail({
      to: patientUser?.email || patientIntake?.email,

      subject:
        consultationType === "clinic"
          ? "Clinic Visit Request Sent"
          : "Complete Payment for Your Appointment",

      message:
        `Hello ${patientUser?.name || patientIntake?.fullName || "Patient"},\n\n` +
        (consultationType === "clinic"
          ? `Your clinic visit request has been sent successfully.\n\n`
          : `Your appointment has been created. Please complete the payment.\n\n`) +
        `Doctor: ${doctorProfile.name}\n` +
        `Date: ${bookingDate}\n` +
        `Time: ${appointmentTime}\n` +
        `Consultation: ${consultationType}\n\n` +
        (consultationType === "clinic"
          ? `Please wait for the doctor's approval.`
          : `After payment, the doctor will review your request.`),
    });

    if (consultationType === "clinic") {
      await sendAppointmentEmail({
        to: doctorUser?.email,

        subject: "New Clinic Visit Request + Patient Info",

        message:
          `Hello ${doctorProfile.name || "Doctor"},\n\n` +
          `${patientUser?.name || patientIntake?.fullName || "A patient"} has requested a clinic visit.\n\n` +
          `Date: ${bookingDate}\n` +
          `Time: ${appointmentTime}\n` +
          intakeSummary +
          `\nPlease open your doctor dashboard to review the request.`,
      });
    } else {
      // For video/audio also send intake to doctor after booking (optional)

      await sendAppointmentEmail({
        to: doctorUser?.email,

        subject: "New Appointment Request (Payment Pending)",

        message:
          `Hello ${doctorProfile.name || "Doctor"},\n\n` +
          `${patientUser?.name || patientIntake?.fullName || "A patient"} has created an appointment (payment pending).\n\n` +
          `Date: ${bookingDate}\n` +
          `Time: ${appointmentTime}\n` +
          `Consultation: ${consultationType}\n` +
          intakeSummary,
      });
    }

    // SMS

    await sendAppointmentSMS({
      to: patientUser?.phone || patientIntake?.phone,

      message:
        consultationType === "clinic"
          ? `Dr. Sharma: Your clinic visit request was sent for ${bookingDate} at ${appointmentTime}. Waiting for doctor approval.`
          : `Dr. Sharma: Appointment created for ${bookingDate} at ${appointmentTime}. Please complete payment.`,
    });

    if (consultationType === "clinic") {
      await sendAppointmentSMS({
        to: doctorUser?.phone,

        message: `Dr. Sharma: New clinic visit request from ${
          patientUser?.name || patientIntake?.fullName || "patient"
        } for ${bookingDate} at ${appointmentTime}.`,
      });
    }

    const populatedAppointment = await Appointment.findById(appointment._id)

      .populate(
        "doctor",

        "name specialization qualification experience hospital image consultationFee clinicAddress",
      )

      .populate("patient", "name email phone");

    return res.status(201).json({
      success: true,

      message:
        consultationType === "clinic"
          ? "Clinic visit request sent. Waiting for doctor approval."
          : "Appointment created. Please complete payment.",

      appointment: populatedAppointment,

      pricing: {
        originalAmount: couponResult.originalAmount,

        discountAmount: couponResult.discountAmount,

        finalAmount: couponResult.finalAmount,

        couponCode: couponResult.couponCode,
      },
    });
  } catch (error) {
    console.error("Book Appointment Error:", error);

    return res.status(error.statusCode || 500).json({
      success: false,

      message: error.message,
    });
  }
};

const getAppointmentById = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)

      .populate(
        "doctor",

        "name specialization hospital image consultationFee",
      )

      .populate("patient", "name email phone");

    if (!appointment) {
      return res.status(404).json({
        success: false,

        message: "Appointment not found",
      });
    }

    // Only allow patient who owns it (or admin)

    if (
      appointment.patient._id.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({
        success: false,

        message: "Not authorized",
      });
    }

    res.status(200).json({
      success: true,

      appointment,
    });
  } catch (error) {
    console.error("Get Appointment Error:", error);

    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

// =====================================================

// CREATE PAYU PAYMENT

// =====================================================

const createPayuPayment = async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,

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

        message: "This appointment is not eligible for payment",
      });
    }

    // ========== PAYU CREDENTIALS ==========

    const key = process.env.PAYU_MERCHANT_KEY;

    const salt = process.env.PAYU_MERCHANT_SALT;

    if (!key || !salt) {
      return res.status(500).json({
        success: false,

        message: "PayU credentials not configured",
      });
    }

    const amount = Number(
      appointment.finalAmount ??
        appointment.consultationFee ??
        appointment.doctor?.consultationFee ??
        0,
    ).toFixed(2); // IMPORTANT: must be string with 2 decimals

    const txnid = `TXN${appointment._id.toString().slice(-8)}${Date.now()}`;

    const productinfo = "Doctor Consultation";

    const firstname = (req.user.name || "Patient").replace(
      /[^a-zA-Z0-9 ]/g,
      "",
    );

    const email = req.user.email || "patient@example.com";

    const phone = (req.user.phone || "9999999999")
      .toString()
      .replace(/\D/g, "")
      .slice(-10);

    const surl = `${process.env.FRONTEND_URL}/payment/success`;

    const furl = `${process.env.FRONTEND_URL}/payment/failure`;

    // ========== CORRECT HASH ==========

    // Sequence: key|txnid|amount|productinfo|firstname|email|||||||||||salt

    const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${salt}`;

    const hash = crypto

      .createHash("sha512")

      .update(hashString)

      .digest("hex");

    // Save txnid

    appointment.paymentId = txnid;

    await appointment.save();

    console.log("PayU Hash String →", hashString); // for debugging

    console.log("PayU Hash →", hash);

    return res.status(200).json({
      success: true,

      paymentData: {
        key,

        txnid,

        amount,

        productinfo,

        firstname,

        email,

        phone,

        surl,

        furl,

        hash,

        service_provider: "payu_paisa",
      },
    });
  } catch (error) {
    console.error("Create PayU Payment Error:", error);

    return res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

// =====================================================

// MARK APPOINTMENT AS PAID (Video / Audio)

// =====================================================

const markAppointmentPaid = async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,

      patient: req.user._id,
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,

        message: "Appointment not found",
      });
    }

    if (appointment.status !== "Pending Payment") {
      return res.status(400).json({
        success: false,

        message: `Cannot mark as paid. Current status: ${appointment.status}`,
      });
    }

    // Update status after successful payment

    appointment.status = "Pending"; // now waiting for doctor approval

    appointment.paymentStatus = "paid";

    appointment.paymentId = req.body.paymentId || appointment.paymentId || null;

    appointment.paidAt = new Date();

    await appointment.save();

    // Count the coupon only after successful payment.

    if (appointment.couponCode) {
      await incrementCouponUsage(appointment.couponCode);
    }

    // Notify doctor now (after payment)

    const doctorProfile = await Doctor.findById(appointment.doctor);

    const patientUser = await User.findById(appointment.patient).select(
      "name email phone",
    );

    if (doctorProfile?.user) {
      await createAppointmentNotification({
        user: doctorProfile.user,

        appointment,

        title: "New Paid Appointment Request",

        message: `${
          patientUser?.name || "A patient"
        } has paid and requested an appointment.`,

        type: "appointment-booked",
      });
    }

    const populated = await Appointment.findById(appointment._id)

      .populate(
        "doctor",

        "name specialization hospital image consultationFee",
      )

      .populate("patient", "name email phone");

    return res.status(200).json({
      success: true,

      message: "Payment successful. Waiting for doctor approval.",

      appointment: populated,
    });
  } catch (error) {
    console.error("Mark Paid Error:", error);

    return res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

// =====================================================

// PATIENT ALL APPOINTMENTS

// =====================================================

const patientAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({
      patient: req.params.id,
    })

      .populate(
        "doctor",

        "name specialization qualification experience hospital image consultationFee",
      )

      .sort({
        appointmentDate: -1,

        createdAt: -1,
      });

    res.status(200).json({
      success: true,

      count: appointments.length,

      appointments,
    });
  } catch (error) {
    console.error("Patient Appointments Error:", error);

    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

// =====================================================

// LOGGED-IN PATIENT APPOINTMENTS

// =====================================================

const getMyPatientAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({
      patient: req.user._id,
    })

      .populate(
        "doctor",

        "name specialization qualification experience hospital image consultationFee",
      )

      .sort({
        appointmentDate: -1,

        createdAt: -1,
      });

    res.status(200).json({
      success: true,

      count: appointments.length,

      appointments,
    });
  } catch (error) {
    console.error("My Patient Appointments Error:", error);

    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

// =====================================================

// PATIENT CONSULTATION HISTORY

// =====================================================

const patientHistory = async (req, res) => {
  try {
    const appointments = await Appointment.find({
      patient: req.user._id,

      status: {
        $in: ["Completed", "Cancelled"],
      },
    })

      .populate(
        "doctor",

        "name specialization qualification experience hospital image consultationFee",
      )

      .sort({
        appointmentDate: -1,

        createdAt: -1,
      });

    return res.status(200).json({
      success: true,

      count: appointments.length,

      appointments,
    });
  } catch (error) {
    console.error("Patient History Error:", error);

    return res.status(500).json({
      success: false,

      message: error.message || "Unable to load consultation history",
    });
  }
};

// =====================================================

// DOCTOR APPOINTMENTS

// =====================================================

const doctorAppointments = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({
      user: req.user._id,
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,

        message: "Doctor profile not found",
      });
    }

    const appointments = await Appointment.find({
      doctor: doctor._id,
    })

      .populate("patient", "name email phone")

      .populate(
        "doctor",

        "name specialization qualification experience hospital image consultationFee",
      )

      .sort({
        appointmentDate: 1,

        appointmentTime: 1,

        createdAt: -1,
      });

    res.status(200).json({
      success: true,

      count: appointments.length,

      appointments,
    });
  } catch (error) {
    console.error("Doctor Appointments Error:", error);

    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

// =====================================================

// DOCTOR ACCEPT APPOINTMENT

// =====================================================

// const acceptAppointment = async (req, res) => {

//   try {

//     const doctor = await Doctor.findOne({

//       user: req.user._id,

//     });

//     if (!doctor) {

//       return res.status(404).json({

//         success: false,

//         message: "Doctor profile not found",

//       });

//     }

//     const appointment = await Appointment.findOne({

//       _id: req.params.id,

//       doctor: doctor._id,

//     });

//     if (!appointment) {

//       return res.status(404).json({

//         success: false,

//         message: "Appointment not found or does not belong to you",

//       });

//     }

//     // Only Pending can be accepted

//     if (appointment.status !== "Pending") {

//       return res.status(400).json({

//         success: false,

//         message: `Appointment is already ${appointment.status}`,

//       });

//     }

//     // Generate room ID only for video/audio

//     if (

//       appointment.consultationType === "video" ||

//       appointment.consultationType === "audio"

//     ) {

//       appointment.roomId = uuidv4();

//     }

//     appointment.status = "Confirmed";

//     await appointment.save();

//     await appointment.populate("patient", "name email phone");

//     await appointment.populate(

//       "doctor",

//       "name specialization hospital image consultationFee"

//     );

//     const acceptedPatient = appointment.patient;

//     const acceptedDoctor = appointment.doctor;

//     await createAppointmentNotification({

//       user: acceptedPatient._id,

//       appointment,

//       title: "Appointment Accepted",

//       message:

//         `${acceptedDoctor?.name || "Your doctor"} has accepted your appointment. ` +

//         "Your appointment is now confirmed.",

//       type: "appointment-accepted",

//     });

//     await sendAppointmentEmail({

//       to: acceptedPatient.email,

//       subject: "Appointment Confirmed",

//       message:

//         `Hello ${acceptedPatient.name || "Patient"},\n\n` +

//         `${acceptedDoctor?.name || "Your doctor"} has accepted your appointment.\n\n` +

//         `Date: ${formatAppointmentDate(appointment.appointmentDate)}\n` +

//         `Time: ${appointment.appointmentTime}\n` +

//         `Consultation: ${appointment.consultationType}\n\n` +

//         "Your appointment is now confirmed.",

//     });

//     await sendAppointmentSMS({

//       to: acceptedPatient.phone,

//       message:

//         `Dr. Sharma: ${acceptedDoctor?.name || "Your doctor"} accepted your appointment ` +

//         `for ${formatAppointmentDate(appointment.appointmentDate)} at ${appointment.appointmentTime}.`,

//     });

//     res.status(200).json({

//       success: true,

//       message: "Appointment confirmed successfully",

//       appointment,

//     });

//   } catch (error) {

//     console.error("Accept Appointment Error:", error);

//     res.status(500).json({

//       success: false,

//       message: error.message,

//     });

//   }

// };

// =====================================================

// DOCTOR ACCEPT APPOINTMENT

// =====================================================

const acceptAppointment = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({
      user: req.user._id,
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,

        message: "Doctor profile not found",
      });
    }

    const appointment = await Appointment.findOne({
      _id: req.params.id,

      doctor: doctor._id,
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,

        message: "Appointment not found or does not belong to you",
      });
    }

    // Only Pending can be accepted

    if (appointment.status !== "Pending") {
      return res.status(400).json({
        success: false,

        message: `Appointment is already ${appointment.status}`,
      });
    }

    // Generate room ID only for video/audio

    if (
      appointment.consultationType === "video" ||
      appointment.consultationType === "audio"
    ) {
      appointment.roomId = uuidv4();
    }

    appointment.status = "Confirmed";

    await appointment.save();

    await appointment.populate("patient", "name email phone");

    await appointment.populate(
      "doctor",

      "name specialization hospital image consultationFee",
    );

    const acceptedPatient = appointment.patient;

    const acceptedDoctor = appointment.doctor;

    // ========== NOTIFICATION ==========

    await createAppointmentNotification({
      user: acceptedPatient._id,

      appointment,

      title: "Appointment Accepted",

      message:
        `${acceptedDoctor?.name || "Your doctor"} has accepted your appointment. ` +
        "Your appointment is now confirmed.",

      type: "appointment-accepted",
    });

    // ========== EMAIL WITH ROOM ID ==========

    const bookingDate = formatAppointmentDate(appointment.appointmentDate);

    const videoLink = `${process.env.FRONTEND_URL}/consult/${appointment.roomId}?type=video`;

    const audioNumber = "+918475897982"; // <-- your audio number

    // Email for Patient

    let patientMessage =
      `Hello ${acceptedPatient.name || "Patient"},\n\n` +
      `${acceptedDoctor?.name || "Your doctor"} has accepted your appointment.\n\n` +
      `Date: ${bookingDate}\n` +
      `Time: ${appointment.appointmentTime}\n` +
      `Consultation: ${appointment.consultationType}\n\n`;

    if (appointment.roomId) {
      patientMessage +=
        `Video Consult Room ID: ${appointment.roomId}\n` +
        `Video Join Link: ${videoLink}\n` +
        `Audio Number: ${audioNumber}\n\n`;
    }

    patientMessage += "Your appointment is now confirmed. Please join on time.";

    await sendAppointmentEmail({
      to: acceptedPatient.email,

      subject: "Appointment Confirmed ",

      message: patientMessage,
    });

    // Email for Doctor

    let doctorMessage =
      `Hello ${acceptedDoctor?.name || "Doctor"},\n\n` +
      `You have confirmed the appointment.\n\n` +
      `Patient: ${acceptedPatient.name}\n` +
      `Date: ${bookingDate}\n` +
      `Time: ${appointment.appointmentTime}\n` +
      `Consultation: ${appointment.consultationType}\n\n`;

    if (appointment.roomId) {
      doctorMessage +=
        `Video Consult Room ID: ${appointment.roomId}\n` +
        `Video Join Link: ${videoLink}\n` +
        `Audio Number: ${audioNumber}\n\n`;
    }

    doctorMessage += "Please join on time.";

    await sendAppointmentEmail({
      to: acceptedDoctor?.email || doctor.user?.email,

      subject: "Appointment Confirmed - Room Details",

      message: doctorMessage,
    });

    // ========== SMS ==========

    await sendAppointmentSMS({
      to: acceptedPatient.phone,

      message:
        `Dr. Sharma: ${acceptedDoctor?.name || "Your doctor"} accepted your appointment ` +
        `for ${bookingDate} at ${appointment.appointmentTime}.` +
        (appointment.roomId ? ` Room ID: ${appointment.roomId}` : ""),
    });

    res.status(200).json({
      success: true,

      message: "Appointment confirmed successfully",

      appointment,
    });
  } catch (error) {
    console.error("Accept Appointment Error:", error);

    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

// =====================================================

// DOCTOR REJECT / CANCEL APPOINTMENT

// =====================================================

const rejectAppointment = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({
      user: req.user._id,
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,

        message: "Doctor profile not found",
      });
    }

    const appointment = await Appointment.findOne({
      _id: req.params.id,

      doctor: doctor._id,
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,

        message: "Appointment not found or does not belong to you",
      });
    }

    if (appointment.status === "Completed") {
      return res.status(400).json({
        success: false,

        message: "Completed appointment cannot be cancelled",
      });
    }

    if (appointment.status === "Cancelled") {
      return res.status(400).json({
        success: false,

        message: "Appointment is already cancelled",
      });
    }

    appointment.status = "Cancelled";

    appointment.cancellationReason =
      req.body.reason || "Appointment cancelled by doctor";

    await appointment.save();

    const rejectedPatient = await User.findById(appointment.patient).select(
      "name email phone",
    );

    const rejectionReason =
      appointment.cancellationReason || "Appointment cancelled by doctor";

    await createAppointmentNotification({
      user: appointment.patient,

      appointment,

      title: "Appointment Cancelled",

      message: `Your appointment with Dr. ${
        doctor.name || "Doctor"
      } has been cancelled. Reason: ${rejectionReason}`,

      type: "appointment-cancelled",
    });

    await sendAppointmentEmail({
      to: rejectedPatient?.email,

      subject: "Appointment Cancelled",

      message:
        `Hello ${rejectedPatient?.name || "Patient"},\n\n` +
        `Your appointment with Dr. ${
          doctor.name || "Doctor"
        } has been cancelled.\n\n` +
        `Reason: ${rejectionReason}`,
    });

    await sendAppointmentSMS({
      to: rejectedPatient?.phone,

      message: `Dr. Sharma: Your appointment with Dr. ${
        doctor.name || "Doctor"
      } has been cancelled. Reason: ${rejectionReason}`,
    });

    res.status(200).json({
      success: true,

      message: "Appointment cancelled successfully",

      appointment,
    });
  } catch (error) {
    console.error("Reject Appointment Error:", error);

    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

// =====================================================

// START CONSULTATION

// =====================================================

const startCall = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({
      user: req.user._id,
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,

        message: "Doctor profile not found",
      });
    }

    const appointment = await Appointment.findOne({
      _id: req.params.id,

      doctor: doctor._id,
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,

        message: "Appointment not found",
      });
    }

    if (appointment.status !== "Confirmed") {
      return res.status(400).json({
        success: false,

        message: "Only confirmed appointments can be started",
      });
    }

    appointment.status = "In Progress";

    appointment.callStartedAt = new Date();

    await appointment.save();

    res.status(200).json({
      success: true,

      message: "Consultation started",

      appointment,
    });
  } catch (error) {
    console.error("Start Call Error:", error);

    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

// =====================================================

// END CONSULTATION

// =====================================================

const endCall = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({
      user: req.user._id,
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,

        message: "Doctor profile not found",
      });
    }

    const appointment = await Appointment.findOne({
      _id: req.params.id,

      doctor: doctor._id,
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,

        message: "Appointment not found",
      });
    }

    if (appointment.status !== "In Progress") {
      return res.status(400).json({
        success: false,

        message: "Only active consultations can be completed",
      });
    }

    appointment.status = "Completed";

    appointment.callEndedAt = new Date();

    if (appointment.callStartedAt) {
      const durationMs = appointment.callEndedAt - appointment.callStartedAt;

      appointment.duration = Math.max(0, Math.floor(durationMs / 1000 / 60));
    }

    await appointment.save();

    res.status(200).json({
      success: true,

      message: "Consultation completed successfully",

      appointment,
    });
  } catch (error) {
    console.error("End Call Error:", error);

    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

// =====================================================

// UPDATE APPOINTMENT

// =====================================================

const updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,

        message: "Appointment not found",
      });
    }

    const allowedFields = [
      "appointmentDate",

      "appointmentTime",

      "consultationType",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        appointment[field] = req.body[field];
      }
    });

    await appointment.save();

    res.status(200).json({
      success: true,

      message: "Appointment updated successfully",

      appointment,
    });
  } catch (error) {
    console.error("Update Appointment Error:", error);

    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

// =====================================================

// PATIENT CANCEL APPOINTMENT

// =====================================================

const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,

      patient: req.user._id,
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,

        message: "Appointment not found",
      });
    }

    if (appointment.status === "Completed") {
      return res.status(400).json({
        success: false,

        message: "Completed appointment cannot be cancelled",
      });
    }

    if (appointment.status === "Cancelled") {
      return res.status(400).json({
        success: false,

        message: "Appointment is already cancelled",
      });
    }

    appointment.status = "Cancelled";

    appointment.cancellationReason = req.body.reason || "Cancelled by patient";

    await appointment.save();

    const cancelledDoctor = await Doctor.findById(appointment.doctor).select(
      "user name",
    );

    const cancelledDoctorUser = cancelledDoctor?.user
      ? await User.findById(cancelledDoctor.user).select("name email phone")
      : null;

    const cancellingPatient = await User.findById(appointment.patient).select(
      "name email phone",
    );

    const patientCancellationReason =
      appointment.cancellationReason || "Cancelled by patient";

    if (cancelledDoctor?.user) {
      await createAppointmentNotification({
        user: cancelledDoctor.user,

        appointment,

        title: "Appointment Cancelled",

        message:
          `${cancellingPatient?.name || "Patient"} has cancelled the appointment. ` +
          `Reason: ${patientCancellationReason}`,

        type: "appointment-cancelled",
      });
    }

    await sendAppointmentEmail({
      to: cancelledDoctorUser?.email,

      subject: "Appointment Cancelled by Patient",

      message:
        `Hello ${cancelledDoctorUser?.name || "Doctor"},\n\n` +
        `${
          cancellingPatient?.name || "Patient"
        } has cancelled the appointment.\n\n` +
        `Reason: ${patientCancellationReason}`,
    });

    await sendAppointmentSMS({
      to: cancelledDoctorUser?.phone,

      message: `Dr. Sharma: ${
        cancellingPatient?.name || "Patient"
      } cancelled the appointment. Reason: ${patientCancellationReason}`,
    });

    res.status(200).json({
      success: true,

      message: "Appointment cancelled successfully",

      appointment,
    });
  } catch (error) {
    console.error("Cancel Appointment Error:", error);

    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

// =====================================================

// GET APPOINTMENT BY ROOM ID

// =====================================================

const getAppointmentByRoom = async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      roomId: req.params.roomId,
    })

      .populate(
        "doctor",

        "name specialization qualification experience hospital image",
      )

      .populate("patient", "name email phone");

    if (!appointment) {
      return res.status(404).json({
        success: false,

        message: "Appointment not found",
      });
    }

    res.status(200).json({
      success: true,

      appointment,
    });
  } catch (error) {
    console.error("Get Appointment By Room Error:", error);

    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

// =====================================================

// ADMIN DASHBOARD

// =====================================================

// =====================================================

// ADMIN DASHBOARD

// =====================================================

const adminDashboard = async (req, res) => {
  try {
    // ===============================

    // BASIC COUNTS

    // ===============================

    const totalPatients = await User.countDocuments({
      role: "patient",
    });

    const totalDoctors = await Doctor.countDocuments();

    const totalAppointments = await Appointment.countDocuments();

    // ===============================

    // GET APPOINTMENTS

    // ===============================

    const appointments = await Appointment.find()

      .populate(
        "patient",

        "name email phone",
      )

      .populate(
        "doctor",

        "name specialization qualification experience hospital image consultationFee",
      )

      .sort({
        appointmentDate: -1,

        createdAt: -1,
      })

      .lean();

    // ===============================

    // TOTAL REVENUE

    // ONLY PAID PAYMENTS

    // ===============================

    const totalRevenue = appointments.reduce(
      (total, appointment) => {
        // Do NOT count pending payments

        if (appointment.paymentStatus !== "paid") {
          return total;
        }

        // Do NOT count cancelled appointments

        if (appointment.status === "Cancelled") {
          return total;
        }

        const fee =
          Number(appointment.finalAmount ?? appointment.consultationFee) || 0;

        return total + fee;
      },

      0,
    );

    // ===============================

    // FORMAT APPOINTMENTS

    // ===============================

    const formattedAppointments = appointments.map((appointment) => ({
      _id: appointment._id,

      // Patient

      patient: {
        _id: appointment.patient?._id || null,

        name:
          appointment.patient?.name ||
          appointment.patientIntake?.fullName ||
          "Patient",

        email:
          appointment.patient?.email || appointment.patientIntake?.email || "",

        phone:
          appointment.patient?.phone || appointment.patientIntake?.phone || "",
      },

      // Doctor

      doctor: {
        _id: appointment.doctor?._id || null,

        name: appointment.doctor?.name || "Doctor",

        specialization: appointment.doctor?.specialization || "",
      },

      // Appointment

      appointmentDate: appointment.appointmentDate || null,

      appointmentTime: appointment.appointmentTime || "",

      consultationType: appointment.consultationType || "",

      status: appointment.status || "Pending",

      // ===============================

      // PAYMENT

      // ===============================

      paymentId: appointment.paymentId || null,

      paymentReference: appointment.paymentId || null,

      paymentStatus: appointment.paymentStatus || "pending",

      consultationFee: Number(appointment.consultationFee) || 0,

      originalAmount:
        Number(appointment.originalAmount) ||
        Number(appointment.consultationFee) ||
        0,

      discountAmount: Number(appointment.discountAmount) || 0,

      finalAmount:
        Number(appointment.finalAmount ?? appointment.consultationFee) || 0,

      couponCode: appointment.couponCode || null,

      paidAt: appointment.paidAt || null,

      // Consultation

      roomId: appointment.roomId || null,

      cancellationReason: appointment.cancellationReason || "",

      // Dates

      createdAt: appointment.createdAt || null,

      updatedAt: appointment.updatedAt || null,
    }));

    // ===============================

    // RESPONSE

    // ===============================

    return res.status(200).json({
      success: true,

      totalPatients,

      totalDoctors,

      totalAppointments,

      // Only successful paid revenue

      totalRevenue,

      appointments: formattedAppointments,
    });
  } catch (error) {
    console.error(
      "Admin Dashboard Error:",

      error,
    );

    return res.status(500).json({
      success: false,

      message: error.message || "Unable to load admin dashboard",
    });
  }
};

// =====================================================

// EXPORTS

// =====================================================

module.exports = {
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
};

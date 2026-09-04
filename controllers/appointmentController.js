const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const User = require("../models/User");
const { v4: uuidv4 } = require("uuid");
const DoctorLeave = require("../models/DoctorLeave");
const Notification = require("../models/Notification");
const { sendSMS } = require("../utils/notify");
const nodemailer = require("nodemailer");

// or if you already exported the helper:
// const { checkDoctorLeave } = require("./leaveController"); // adjust path if needed

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
    // Notification failure must never break appointment action.
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
  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />
  <title>${safeSubject}</title>
</head>

<body style="
  margin: 0;
  padding: 0;
  background-color: #f3f4f6;
  font-family: Arial, Helvetica, sans-serif;
">
  <table
    width="100%"
    cellpadding="0"
    cellspacing="0"
    border="0"
    style="
      background-color: #f3f4f6;
      padding: 30px 15px;
    "
  >
    <tr>
      <td align="center">

        <table
          width="100%"
          cellpadding="0"
          cellspacing="0"
          border="0"
          style="
            max-width: 600px;
            background-color: #ffffff;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            overflow: hidden;
          "
        >

          <tr>
            <td style="
              background-color: #2563eb;
              padding: 28px 30px;
              text-align: center;
            ">
              <h1 style="
                margin: 0;
                color: #ffffff;
                font-size: 24px;
                line-height: 1.3;
                font-weight: 700;
              ">
                Dr. Sharma Healthcare
              </h1>

              <p style="
                margin: 8px 0 0;
                color: #dbeafe;
                font-size: 14px;
                line-height: 1.5;
              ">
                Healthcare &amp; Appointment Services
              </p>
            </td>
          </tr>

          <tr>
            <td style="padding: 32px 30px;">

              <h2 style="
                margin: 0 0 24px;
                color: #111827;
                font-size: 22px;
                line-height: 1.35;
                font-weight: 700;
              ">
                ${safeSubject}
              </h2>

              ${htmlMessage}

            </td>
          </tr>

          <tr>
            <td style="
              padding: 20px 30px;
              background-color: #f9fafb;
              border-top: 1px solid #e5e7eb;
              text-align: center;
            ">
              <p style="
                margin: 0;
                color: #6b7280;
                font-size: 13px;
                line-height: 1.6;
              ">
                This is an automated email from Dr. Sharma Healthcare.
              </p>

              <p style="
                margin: 6px 0 0;
                color: #9ca3af;
                font-size: 12px;
                line-height: 1.5;
              ">
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

// =====================================================
// BOOK APPOINTMENT
// Patient sends appointment request
// =====================================================

const bookAppointment = async (req, res) => {
  try {
    const patientId = req.user._id;
    const { doctor, appointmentDate, appointmentTime, consultationType } =
      req.body;

    // -----------------------------------------------
    // Validate doctor
    // -----------------------------------------------
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

    // -----------------------------------------------
    // Validate consultation type
    // -----------------------------------------------
    if (
      consultationType &&
      !["video", "audio", "clinic"].includes(consultationType)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid consultation type",
      });
    }

    const selectedDate = new Date(appointmentDate);
    selectedDate.setHours(0, 0, 0, 0);

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

      // Half Day → only block overlapping time
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

    // -----------------------------------------------
    // Check if slot is already booked
    // -----------------------------------------------
    const existingAppointment = await Appointment.findOne({
      doctor: doctorProfile._id,
      appointmentDate: selectedDate,
      appointmentTime,
      status: {
        $in: ["Pending", "Confirmed", "In Progress"],
      },
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: "This appointment slot is already booked or pending approval",
      });
    }

    // -----------------------------------------------
    // Create appointment
    // -----------------------------------------------
    const appointment = await Appointment.create({
      patient: patientId,
      doctor: doctorProfile._id,
      appointmentDate: selectedDate,
      appointmentTime,
      consultationType: consultationType || "video",
      status: "Pending",
    });

    // =================================================
    // ADDED: NOTIFICATION / EMAIL / SMS
    // Patient booked an appointment
    // =================================================

    const patientUser =
      await User.findById(patientId).select("name email phone");

    const doctorUser = doctorProfile.user
      ? await User.findById(doctorProfile.user).select("name email phone")
      : null;

    const bookingDate = formatAppointmentDate(selectedDate);

    const bookingType = consultationType || "video";

    await createAppointmentNotification({
      user: patientId,
      appointment,
      title: "Appointment Request Sent",
      message:
        "Your appointment request has been sent to the doctor and is waiting for approval.",
      type: "appointment-booked",
    });

    if (doctorProfile.user) {
      await createAppointmentNotification({
        user: doctorProfile.user,
        appointment,
        title: "New Appointment Request",
        message:
          `${patientUser?.name || "A patient"} requested an appointment for ` +
          `${bookingDate} at ${appointmentTime}.`,
        type: "appointment-booked",
      });
    }

    await sendAppointmentEmail({
      to: patientUser?.email,
      subject: "Appointment Request Sent",
      message:
        `Hello ${patientUser?.name || "Patient"},\n\n` +
        `Your appointment request has been sent successfully.\n\n` +
        `Doctor: ${doctorProfile.name}\n` +
        `Date: ${bookingDate}\n` +
        `Time: ${appointmentTime}\n` +
        `Consultation: ${bookingType}\n\n` +
        `Please wait for the doctor's approval.`,
    });

    await sendAppointmentEmail({
      to: doctorUser?.email,
      subject: "New Appointment Request",
      message:
        `Hello ${doctorProfile.name || "Doctor"},\n\n` +
        `${patientUser?.name || "A patient"} has requested an appointment.\n\n` +
        `Date: ${bookingDate}\n` +
        `Time: ${appointmentTime}\n` +
        `Consultation: ${bookingType}\n\n` +
        `Please open your doctor dashboard to review the request.`,
    });

    await sendAppointmentSMS({
      to: patientUser?.phone,
      message:
        `Dr. Sharma: Your appointment request was sent for ` +
        `${bookingDate} at ${appointmentTime}. Waiting for doctor approval.`,
    });

    await sendAppointmentSMS({
      to: doctorUser?.phone,
      message:
        `Dr. Sharma: New appointment request from ` +
        `${patientUser?.name || "patient"} for ${bookingDate} at ${appointmentTime}.`,
    });

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate(
        "doctor",
        "name specialization qualification experience hospital image consultationFee",
      )
      .populate("patient", "name email phone");

    return res.status(201).json({
      success: true,
      message: "Appointment request sent. Waiting for doctor approval.",
      appointment: populatedAppointment,
    });
  } catch (error) {
    console.error("Book Appointment Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// =====================================================
// PATIENT ALL APPOINTMENTS
// Admin / internal use if required
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
// Completed + Cancelled appointments
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
// Logged-in doctor only
// =====================================================

const doctorAppointments = async (req, res) => {
  try {
    // Find doctor profile using logged-in user
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
// SEND APPOINTMENT SMS
// =====================================================

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

    // IMPORTANT:
    // SMS failure must NOT make appointment API fail.
    return {
      success: false,
      error: error.message,
    };
  }
};
// =====================================================
// DOCTOR ACCEPT APPOINTMENT
// Pending → Confirmed
// =====================================================

const acceptAppointment = async (req, res) => {
  try {
    // Find logged-in doctor's profile
    const doctor = await Doctor.findOne({
      user: req.user._id,
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    // IMPORTANT:
    // Appointment must belong to this doctor
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

    // =================================================
    // ADDED: NOTIFICATION / EMAIL / SMS
    // Doctor accepted appointment
    // =================================================

    const acceptedPatient = appointment.patient;
    const acceptedDoctor = appointment.doctor;

    await createAppointmentNotification({
      user: acceptedPatient._id,
      appointment,
      title: "Appointment Accepted",
      message:
        `${acceptedDoctor?.name || "Your doctor"} has accepted your appointment. ` +
        "Your appointment is now confirmed.",
      type: "appointment-accepted",
    });

    await sendAppointmentEmail({
      to: acceptedPatient.email,
      subject: "Appointment Confirmed",
      message:
        `Hello ${acceptedPatient.name || "Patient"},\n\n` +
        `${acceptedDoctor?.name || "Your doctor"} has accepted your appointment.\n\n` +
        `Date: ${formatAppointmentDate(appointment.appointmentDate)}\n` +
        `Time: ${appointment.appointmentTime}\n` +
        `Consultation: ${appointment.consultationType}\n\n` +
        "Your appointment is now confirmed.",
    });

    await sendAppointmentSMS({
      to: acceptedPatient.phone,
      message:
        `Dr. Sharma: ${acceptedDoctor?.name || "Your doctor"} accepted your appointment ` +
        `for ${formatAppointmentDate(appointment.appointmentDate)} at ${appointment.appointmentTime}.`,
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
// Pending/Confirmed → Cancelled
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

    // =================================================
    // ADDED: NOTIFICATION / EMAIL / SMS
    // Doctor rejected/cancelled appointment
    // =================================================

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
// Confirmed → In Progress
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
// In Progress → Completed
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

    // Calculate duration
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
// Restricted fields only
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

    // Only allow appointment date/time/type
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

    // =================================================
    // ADDED: NOTIFICATION / EMAIL / SMS
    // Patient cancelled appointment
    // =================================================

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
// Get all patients, doctors, appointments and revenue
// =====================================================

const adminDashboard = async (req, res) => {
  try {
    // -------------------------------------------------
    // 1. Total registered patients
    // -------------------------------------------------

    const totalPatients = await User.countDocuments({
      role: "patient",
    });

    // -------------------------------------------------
    // 2. Total registered doctors
    // -------------------------------------------------

    const totalDoctors = await Doctor.countDocuments();

    // -------------------------------------------------
    // 3. Total appointments
    // -------------------------------------------------

    const totalAppointments = await Appointment.countDocuments();

    // -------------------------------------------------
    // 4. Get all appointments
    // -------------------------------------------------

    const appointments = await Appointment.find()
      .populate("patient", "name email phone")
      .populate(
        "doctor",
        "name specialization qualification experience hospital image consultationFee",
      )
      .sort({
        appointmentDate: -1,
        createdAt: -1,
      });

    // -------------------------------------------------
    // 5. Calculate revenue
    //
    // Appointment does not store consultationFee.
    // Fee comes from Doctor profile.
    // -------------------------------------------------

    const totalRevenue = appointments.reduce((total, appointment) => {
      // Do not count cancelled appointments
      if (appointment.status === "Cancelled") {
        return total;
      }

      const fee = Number(appointment.doctor?.consultationFee) || 0;

      return total + fee;
    }, 0);

    // -------------------------------------------------
    // 6. Send dashboard data
    // -------------------------------------------------

    return res.status(200).json({
      success: true,

      totalPatients,
      totalDoctors,
      totalAppointments,
      totalRevenue,

      appointments,
    });
  } catch (error) {
    console.error("Admin Dashboard Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to load admin dashboard",
    });
  }
};

module.exports = {
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
};

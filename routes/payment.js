// const express = require("express");
// const router = express.Router();
// const { sendConsultationEmails } = require("../utils/sendConsultationEmail");

// // This API will be called after payment is successful
// router.post("/payment-success", async (req, res) => {
//   try {
//     const {
//       patientName,
//       patientEmail,
//       doctorName,
//       doctorEmail,
//       appointmentDate,
//       appointmentTime,
//     } = req.body;

//     // 1. Send emails + get roomId
//     const roomId = await sendConsultationEmails({
//       patientName,
//       patientEmail,
//       doctorName,
//       doctorEmail,
//       appointmentDate,
//       appointmentTime,
//     });

//     // 2. Save roomId in database (important)
//     // await Appointment.findByIdAndUpdate(appointmentId, { roomId });

//     res.json({
//       success: true,
//       roomId,
//       message: "Emails sent successfully",
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ success: false, message: "Failed to send emails" });
//   }
// });

// module.exports = router;

const express = require("express");
const router = express.Router();
const Appointment = require("../models/Appointment");
const { sendConsultationEmails } = require("../utils/sendConsultationEmail");

// Confirm payment + send room id email
router.post("/confirm-payment/:id", async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate("patient", "name email")
      .populate("doctor", "name email");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // 1. Mark as Paid / Confirmed
    appointment.status = "Confirmed";
    await appointment.save();

    // 2. Send emails + get roomId
    const roomId = await sendConsultationEmails({
      patientName: appointment.patient.name,
      patientEmail: appointment.patient.email,
      doctorName: appointment.doctor.name,
      doctorEmail: appointment.doctor.email,
      appointmentDate: appointment.date,     // adjust field name
      appointmentTime: appointment.time,     // adjust field name
    });

    // 3. Save roomId in appointment
    appointment.roomId = roomId;
    await appointment.save();

    return res.status(200).json({
      success: true,
      message: "Payment confirmed & emails sent",
      roomId,
    });
  } catch (error) {
    console.error("Confirm Payment Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
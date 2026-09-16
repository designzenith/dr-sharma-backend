const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");

// =====================================================
// GET /api/earnings/doctor
// Doctor Earnings
// =====================================================

exports.getDoctorEarnings = async (req, res) => {
  try {
    // -------------------------------------------------
    // Logged-in doctor user ID
    // -------------------------------------------------

    const doctorUserId =
      req.user.id || req.user._id;

    // -------------------------------------------------
    // Find doctor profile linked with User
    // -------------------------------------------------

    const doctor = await Doctor.findOne({
      user: doctorUserId,
    }).lean();

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    // -------------------------------------------------
    // Get doctor's payment/appointment records
    //
    // Includes:
    // Paid
    // Pending
    // Failed
    //
    // We do NOT restrict to Completed/Confirmed
    // because pending/failed payments must also appear.
    // -------------------------------------------------

    const appointments =
      await Appointment.find({
        doctor: doctor._id,

        $or: [
          {
            paymentStatus: "paid",
          },
          {
            paymentStatus: "pending",
          },
          {
            paymentStatus: "failed",
          },
          {
            paymentId: {
              $ne: null,
            },
          },
          {
            consultationFee: {
              $gt: 0,
            },
          },
        ],
      })
        .populate(
          "patient",
          "name email phone"
        )
        .sort({
          createdAt: -1,
        })
        .lean();

    // -------------------------------------------------
    // Format earnings
    // -------------------------------------------------

    const earnings = appointments.map(
      (appointment) => {
        let status = "Pending";

        if (
          appointment.paymentStatus ===
          "paid"
        ) {
          status = "Paid";
        } else if (
          appointment.paymentStatus ===
          "failed"
        ) {
          status = "Failed";
        } else {
          status = "Pending";
        }

        return {
          // -------------------------------------------------
          // IDs
          // -------------------------------------------------

          _id: appointment._id,

          appointmentId:
            appointment._id.toString(),

          paymentId:
            appointment.paymentId ||
            null,

          // -------------------------------------------------
          // Patient
          // -------------------------------------------------

          patientName:
            appointment.patient?.name ||
            appointment.patientIntake
              ?.fullName ||
            "Patient",

          patientEmail:
            appointment.patient?.email ||
            appointment.patientIntake
              ?.email ||
            "",

          patientPhone:
            appointment.patient?.phone ||
            appointment.patientIntake
              ?.phone ||
            "",

          // -------------------------------------------------
          // Doctor
          // -------------------------------------------------

          doctorName:
            doctor.name ||
            "Doctor",

          doctorEmail:
            doctor.email ||
            "",

          // -------------------------------------------------
          // Amount
          // -------------------------------------------------

          amount:
            Number(
              appointment.consultationFee
            ) || 0,

          // -------------------------------------------------
          // Payment
          // -------------------------------------------------

          method:
            appointment.paymentId
              ? "Razorpay"
              : "—",

          status,

          paymentStatus:
            appointment.paymentStatus ||
            "pending",

          paidAt:
            appointment.paidAt ||
            null,

          // -------------------------------------------------
          // Dates
          // -------------------------------------------------

          date:
            appointment.paidAt ||
            appointment.createdAt,

          createdAt:
            appointment.createdAt,

          // -------------------------------------------------
          // Appointment
          // -------------------------------------------------

          appointmentDate:
            appointment.appointmentDate ||
            null,

          appointmentTime:
            appointment.appointmentTime ||
            "",

          appointmentStatus:
            appointment.status ||
            "",

          consultationType:
            appointment.consultationType ||
            "",
        };
      }
    );

    // -------------------------------------------------
    // Response
    // -------------------------------------------------

    return res.status(200).json({
      success: true,
      count: earnings.length,
      earnings,
    });
  } catch (error) {
    console.error(
      "GET DOCTOR EARNINGS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Unable to fetch earnings",
      error: error.message,
    });
  }
};
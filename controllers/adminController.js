const User = require("../models/User");
const Patient = require("../models/Patient");
const Appointment = require("../models/Appointment");

// =====================================================
// Get All Patients - Admin
// =====================================================

const getAllPatients = async (req, res) => {
  try {
    // -------------------------------------------------
    // Get all users whose role is patient
    // -------------------------------------------------

    const users = await User.find({ role: "patient" })
      .select(
        "-password -resetPasswordOTP -resetPasswordOTPExpires -loginOtp -loginOtpExpires"
      )
      .sort({ createdAt: -1 })
      .lean();

    // -------------------------------------------------
    // Get Patient profile records
    // -------------------------------------------------

    const userIds = users.map((user) => user._id);

    const patientProfiles = await Patient.find({
      user: { $in: userIds },
    })
      .select("-medicalHistory -allergies")
      .lean();

    // -------------------------------------------------
    // Create quick lookup for Patient profiles
    // -------------------------------------------------

    const patientProfileMap = new Map();

    patientProfiles.forEach((patient) => {
      patientProfileMap.set(patient.user.toString(), patient);
    });

    // -------------------------------------------------
    // Combine User + Patient profile
    // -------------------------------------------------

    const patients = users.map((user) => {
      const profile = patientProfileMap.get(
        user._id.toString()
      );

      return {
        _id: profile?._id || user._id,

        user: user._id,

        name: profile?.name || user.name || "",

        email: profile?.email || user.email || "",

        phone: profile?.phone || user.phone || "",

        profileImage:
          profile?.profileImage ||
          user.profileImage ||
          "",

        gender: profile?.gender || "",

        dateOfBirth: profile?.dateOfBirth || null,

        bloodGroup: profile?.bloodGroup || "",

        address: profile?.address || "",

        city: profile?.city || "",

        state: profile?.state || "",

        emergencyContact:
          profile?.emergencyContact || {
            name: "",
            phone: "",
            relation: "",
          },

        isActive:
          profile?.isActive !== undefined
            ? profile.isActive
            : true,

        createdAt:
          profile?.createdAt ||
          user.createdAt,

        updatedAt:
          profile?.updatedAt ||
          user.updatedAt,
      };
    });

    // -------------------------------------------------
    // Response
    // -------------------------------------------------

    return res.status(200).json({
      success: true,
      count: patients.length,
      patients,
    });
  } catch (error) {
    console.error(
      "GET ALL PATIENTS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch patients",
      error: error.message,
    });
  }
};

// =====================================================
// Get All Payments - Admin
// =====================================================

const getAllPayments = async (req, res) => {
  try {
    // -------------------------------------------------
    // Get appointments containing payment information
    // -------------------------------------------------

    const appointments = await Appointment.find({
      $or: [
        { paymentId: { $ne: null } },
        {
          paymentStatus: {
            $in: ["paid", "failed", "pending"],
          },
        },
        { consultationFee: { $gt: 0 } },
      ],
    })
      .populate("patient", "name email phone")
      .populate("doctor", "name email")
      .sort({ createdAt: -1 })
      .lean();

    // -------------------------------------------------
    // Convert appointments into payment records
    // -------------------------------------------------

    const payments = appointments.map((appointment) => ({
      id:
        appointment.paymentId ||
        appointment._id.toString(),

      appointmentId: appointment._id,

      patient:
        appointment.patient?.name ||
        appointment.patientIntake?.fullName ||
        "Unknown Patient",

      patientEmail:
        appointment.patient?.email ||
        appointment.patientIntake?.email ||
        "",

      doctor:
        appointment.doctor?.name ||
        "Unknown Doctor",

      doctorEmail:
        appointment.doctor?.email ||
        "",

      amount: Number(
        appointment.consultationFee || 0
      ),

      method: "Razorpay",

      status:
        appointment.paymentStatus === "paid"
          ? "Paid"
          : appointment.paymentStatus === "failed"
          ? "Failed"
          : "Pending",

      paymentStatus:
        appointment.paymentStatus || "pending",

      paymentId:
        appointment.paymentId || null,

      date:
        appointment.paidAt ||
        appointment.createdAt,

      appointmentDate:
        appointment.appointmentDate,

      appointmentTime:
        appointment.appointmentTime,

      consultationType:
        appointment.consultationType,

      appointmentStatus:
        appointment.status,
    }));

    // -------------------------------------------------
    // Response
    // -------------------------------------------------

    return res.status(200).json({
      success: true,
      count: payments.length,
      payments,
    });
  } catch (error) {
    console.error(
      "GET ALL PAYMENTS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch payments",
      error: error.message,
    });
  }
};

// =====================================================
// Export
// =====================================================

module.exports = {
  getAllPatients,
  getAllPayments,
};
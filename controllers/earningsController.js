const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");

// =====================================================
// GET /api/earnings/doctor
// =====================================================
exports.getDoctorEarnings = async (req, res) => {
  try {
    const doctorId = req.user.id || req.user._id;

    // Find the doctor profile linked to this user
    const doctor = await Doctor.findOne({ user: doctorId });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    // Get completed / paid appointments of this doctor
    const appointments = await Appointment.find({
      doctor: doctor._id,
      status: { $in: ["Completed", "Confirmed"] },
    })
      .populate("patient", "name")
      .sort({ createdAt: -1 });

    const earnings = appointments.map((appt) => ({
      _id: appt._id,
      appointmentId: appt._id,
      patientName: appt.patient?.name || "Patient",
      amount: appt.consultationFee || appt.fee || 0,
      consultationType: appt.consultationType,
      status: appt.paymentStatus || "Pending", // Paid | Pending | Processing
      paidAt: appt.paidAt || null,
      createdAt: appt.createdAt,
    }));

    res.json({
      success: true,
      earnings,
    });
  } catch (error) {
    console.error("getDoctorEarnings error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to fetch earnings",
    });
  }
};
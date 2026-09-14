const Prescription = require("../models/Prescription");
const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");

// =====================================================
// GET /api/prescriptions/doctor
// =====================================================
exports.getDoctorPrescriptions = async (req, res) => {
  try {
    const doctorUserId = req.user.id || req.user._id;

    // Find doctor profile
    const doctor = await Doctor.findOne({ user: doctorUserId });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    // Get all prescriptions written by this doctor
    // Adjust the field name if your model uses "doctor" differently
    const prescriptions = await Prescription.find({ doctor: doctor._id })
      .populate("patient", "name email phone")
      .populate("appointment", "appointmentDate appointmentTime")
      .sort({ createdAt: -1 })
      .lean();

    // Format for frontend
    const formatted = prescriptions.map((p) => ({
      _id: p._id,
      patientName: p.patient?.name || p.patientName || "Patient",
      patientId: p.patient?._id || p.patient,
      appointmentId: p.appointment?._id || p.appointment,
      medicines: p.medicines || p.medication || [],
      notes: p.notes || p.advice || "",
      status: p.status || "Active",
      createdAt: p.createdAt,
    }));

    res.json({
      success: true,
      prescriptions: formatted,
    });
  } catch (error) {
    console.error("getDoctorPrescriptions error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to fetch prescriptions",
    });
  }
};

// =====================================================
// GET /api/prescriptions/:id
// =====================================================
exports.getPrescriptionById = async (req, res) => {
  try {
    const prescription = await Prescription.findById(req.params.id)
      .populate("patient", "name email phone")
      .populate("appointment")
      .lean();

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    res.json({
      success: true,
      prescription: {
        _id: prescription._id,
        patientName: prescription.patient?.name || "Patient",
        patientId: prescription.patient?._id || prescription.patient,
        appointmentId: prescription.appointment?._id || prescription.appointment,
        medicines: prescription.medicines || prescription.medication || [],
        notes: prescription.notes || prescription.advice || "",
        status: prescription.status || "Active",
        createdAt: prescription.createdAt,
      },
    });
  } catch (error) {
    console.error("getPrescriptionById error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to fetch prescription",
    });
  }
};

// =====================================================
// POST /api/prescriptions  (create new)
// =====================================================
exports.createPrescription = async (req, res) => {
  try {
    const doctorUserId = req.user.id || req.user._id;
    const doctor = await Doctor.findOne({ user: doctorUserId });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    const { patientId, appointmentId, medicines, notes, status } = req.body;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "Patient is required",
      });
    }

    const prescription = await Prescription.create({
      doctor: doctor._id,
      patient: patientId,
      appointment: appointmentId || undefined,
      medicines: medicines || [],
      notes: notes || "",
      status: status || "Active",
    });

    res.status(201).json({
      success: true,
      prescription,
    });
  } catch (error) {
    console.error("createPrescription error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to create prescription",
    });
  }
};
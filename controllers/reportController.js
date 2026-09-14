const Report = require("../models/Report");
const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const User = require("../models/User");

// =====================================================
// GET /api/reports/doctor
// Optional query: ?patientId=xxx
// =====================================================
exports.getDoctorReports = async (req, res) => {
  try {
    const doctorUserId = req.user.id || req.user._id;
    const { patientId } = req.query;

    // Find doctor profile
    const doctor = await Doctor.findOne({ user: doctorUserId });
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    // Find all patients who have appointments with this doctor
    const appointments = await Appointment.find({ doctor: doctor._id })
      .select("patient")
      .lean();

    const patientIds = [
      ...new Set(
        appointments
          .map((a) => a.patient?.toString())
          .filter(Boolean)
      ),
    ];

    if (patientIds.length === 0) {
      return res.json({ success: true, reports: [] });
    }

    // Build query
    const query = {
      patient: { $in: patientIds },
    };

    // Filter by specific patient if requested
    if (patientId) {
      query.patient = patientId;
    }

    const reports = await Report.find(query)
      .populate("patient", "name email")
      .sort({ createdAt: -1 })
      .lean();

    // Map to frontend-friendly format
    const formatted = reports.map((r) => ({
      _id: r._id,
      title: r.originalName || r.fileName || "Medical Report",
      type: r.fileType,
      patientName: r.patient?.name || "Patient",
      patientId: r.patient?._id || r.patient,
      fileUrl: r.filePath, // or construct full URL if needed
      fileName: r.fileName,
      originalName: r.originalName,
      fileSize: r.fileSize,
      status: "Ready",
      createdAt: r.createdAt || r.uploadedAt,
      notes: null,
    }));

    res.json({
      success: true,
      reports: formatted,
    });
  } catch (error) {
    console.error("getDoctorReports error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to fetch reports",
    });
  }
};

// =====================================================
// GET /api/reports/:id
// =====================================================
exports.getReportById = async (req, res) => {
  try {
    const report = await Report.findById(req.params.id)
      .populate("patient", "name email phone")
      .lean();

    if (!report) {
      return res.status(404).json({
        success: false,
        message: "Report not found",
      });
    }

    const formatted = {
      _id: report._id,
      title: report.originalName || report.fileName || "Medical Report",
      type: report.fileType,
      patientName: report.patient?.name || "Patient",
      patientId: report.patient?._id || report.patient,
      fileUrl: report.filePath,
      fileName: report.fileName,
      originalName: report.originalName,
      fileSize: report.fileSize,
      status: "Ready",
      createdAt: report.createdAt || report.uploadedAt,
      notes: null,
    };

    res.json({
      success: true,
      report: formatted,
    });
  } catch (error) {
    console.error("getReportById error:", error);
    res.status(500).json({
      success: false,
      message: "Unable to fetch report",
    });
  }
};
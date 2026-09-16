const User = require("../models/User");
const Doctor = require("../models/Doctor");
const VerificationDocument = require("../models/VerificationDocument");
const Report = require("../models/Report");


// ======================================
// Upload Profile Image
// ======================================
const uploadProfileImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No image uploaded",
      });
    }

    // Public URL instead of Windows filesystem path
    const imagePath = `/uploads/profile/${req.file.filename}`;

    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        profileImage: imagePath,
      },
      {
        new: true,
      },
    );

    return res.status(200).json({
      success: true,
      message: "Profile image uploaded successfully",
      user,
    });
  } catch (error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================
// Upload Doctor Documents
// ======================================
const uploadDoctorDocuments = async (req, res) => {
  try {
    const { aadhaarNumber, medicalLicenseNumber } = req.body;

    const doctor = await Doctor.findOne({
      user: req.user._id,
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    const documents = {
      doctor: doctor._id,

      aadhaarNumber,

      medicalLicenseNumber,

      aadhaarFile: req.files?.aadhaar ? req.files.aadhaar[0].path : "",

      medicalLicenseFile: req.files?.medicalLicense
        ? req.files.medicalLicense[0].path
        : "",

      certificate: req.files?.certificate
        ? req.files.certificate.map((file) => file.path)
        : [],
    };

    const verification = await VerificationDocument.create(documents);

    res.status(201).json({
      success: true,

      message: "Doctor documents uploaded successfully",

      verification,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

// ======================================
// Upload Doctor Image
// ======================================
const uploadDoctorImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,

        message: "Doctor image required",
      });
    }

    const doctor = await Doctor.findOneAndUpdate(
      {
        user: req.user._id,
      },

      {
        image: req.file.path,
      },

      {
        new: true,
      },
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,

        message: "Doctor not found",
      });
    }

    res.json({
      success: true,

      message: "Doctor image updated",

      doctor,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

const uploadReport = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No report file uploaded",
      });
    }

    const report = await Report.create({
      patient: req.user._id,

      fileName: req.file.filename,

      originalName: req.file.originalname,

      // IMPORTANT: public browser path
      filePath: `/uploads/reports/${req.file.filename}`,

      fileType: req.file.mimetype,

      fileSize: req.file.size,
    });

    return res.status(201).json({
      success: true,
      message: "Report uploaded successfully",
      report,
    });
  } catch (error) {
    console.error("Upload Report Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to upload report",
    });
  }
};
// ======================================
// Get Logged-in Patient Reports
// ======================================
const getPatientReports = async (req, res) => {
  try {
    const reports = await Report.find({
      patient: req.user._id,
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: reports.length,
      reports,
    });
  } catch (error) {
    console.error("Get Patient Reports Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to load reports",
    });
  }
};
// ======================================
// Get Patient Reports for Doctor
// ======================================
const getPatientReportsForDoctor = async (req, res) => {
  try {
    const { patientId } = req.params;

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "Patient ID is required",
      });
    }

    // Make sure logged-in user is a doctor
    const doctor = await Doctor.findOne({
      user: req.user._id,
    });

    if (!doctor) {
      return res.status(403).json({
        success: false,
        message: "Only doctors can access patient reports",
      });
    }

    const patient = await User.findById(patientId).select(
      "name email phone profileImage role"
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    if (patient.role !== "patient") {
      return res.status(400).json({
        success: false,
        message: "Selected user is not a patient",
      });
    }

    const reports = await Report.find({
      patient: patientId,
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: reports.length,
      patient,
      reports,
    });
  } catch (error) {
    console.error(
      "Get Patient Reports For Doctor Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message || "Failed to load patient reports",
    });
  }
};
module.exports = {
  uploadProfileImage,
  uploadDoctorDocuments,
  uploadDoctorImage,
  uploadReport,
  getPatientReports,
  getPatientReportsForDoctor,
};

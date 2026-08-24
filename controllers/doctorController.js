const Doctor = require("../models/Doctor");

// =====================================================
// Helper: Get User ID
// =====================================================

const getUserId = (req) => {
  return req.user?._id || req.user?.id;
};

// =====================================================
// Helper: Normalize Consultation Types
// =====================================================
const normalizeConsultationTypes = (value) => {
  if (!value) {
    return ["video"];
  }

  if (!Array.isArray(value)) {
    value = [value];
  }

  const allowedTypes = [
    "video",
    "audio",
    "clinic",
  ];

  const types = value.filter((type) =>
    allowedTypes.includes(type)
  );

  return types.length > 0
    ? types
    : ["video"];
};

// =====================================================
// Add Doctor
// =====================================================

const addDoctor = async (req, res) => {
  try {
    const userId = getUserId(req);

    // -------------------------------------------------
    // Authentication
    // -------------------------------------------------

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "User ID not found. Please login again.",
      });
    }

    // -------------------------------------------------
    // Doctor role
    // -------------------------------------------------

    if (req.user.role !== "doctor") {
      return res.status(403).json({
        success: false,
        message:
          "Only doctors can create doctor profiles",
      });
    }

    // -------------------------------------------------
    // Existing doctor
    // -------------------------------------------------

    const existingDoctor =
      await Doctor.findOne({
        user: userId,
      });

    if (existingDoctor) {
      return res.status(400).json({
        success: false,
        message:
          "Doctor profile already exists",
        doctor: existingDoctor,
      });
    }

    // -------------------------------------------------
    // Existing email
    // -------------------------------------------------

    const email =
      req.body.email?.toLowerCase();

    if (email) {
      const existingEmail =
        await Doctor.findOne({
          email,
        });

      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message:
            "A doctor profile with this email already exists",
        });
      }
    }

    // -------------------------------------------------
    // Consultation Types
    // -------------------------------------------------

    const consultationTypes =
      normalizeConsultationTypes(
        req.body.consultationType
      );

    // -------------------------------------------------
    // Create Doctor
    // -------------------------------------------------

    const doctor = await Doctor.create({
      user: userId,

      name: req.body.name,

      email: email,

      phone: req.body.phone,

      specialization:
        req.body.specialization,

      icon:
        req.body.icon || "🩺",

      qualification:
        req.body.qualification,

      experience:
        req.body.experience,

      consultationFee:
        req.body.consultationFee,

      hospital:
        req.body.hospital,

      address:
        req.body.address,

      about:
        req.body.about,

      image:
        req.body.image,

      consultationType:
        consultationTypes,

      available:
        req.body.available !== undefined
          ? req.body.available
          : true,
    });

    await doctor.populate(
      "user",
      "name email phone"
    );

    return res.status(201).json({
      success: true,
      message:
        "Doctor profile created successfully",
      doctor,
    });
  } catch (error) {
    console.error(
      "Add Doctor Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// Get All Doctors
// =====================================================

const getDoctors = async (req, res) => {
  try {
    const doctors =
      await Doctor.find()
        .populate(
          "user",
          "name email phone"
        )
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      count: doctors.length,
      doctors,
    });
  } catch (error) {
    console.error(
      "Get Doctors Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// Get Doctor By ID
// =====================================================

const getDoctor = async (req, res) => {
  try {
    const doctor =
      await Doctor.findById(
        req.params.id
      ).populate(
        "user",
        "name email phone"
      );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message:
          "Doctor not found",
      });
    }

    return res.status(200).json({
      success: true,
      doctor,
    });
  } catch (error) {
    console.error(
      "Get Doctor Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// Get Logged-in Doctor Profile
// =====================================================

const getMyDoctorProfile = async (
  req,
  res
) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "User ID not found in authentication",
      });
    }

    const doctor =
      await Doctor.findOne({
        user: userId,
      }).populate(
        "user",
        "name email phone"
      );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message:
          "Doctor profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      doctor,
    });
  } catch (error) {
    console.error(
      "Get My Doctor Profile Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// Update Doctor
// =====================================================

const updateDoctor = async (
  req,
  res
) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "User ID not found. Please login again.",
      });
    }

    const {
      name,
      email,
      phone,
      specialization,
      icon,
      qualification,
      experience,
      consultationFee,
      hospital,
      address,
      about,
      image,
      consultationType,
      available,
    } = req.body;

    // -------------------------------------------------
    // Find doctor
    // -------------------------------------------------

    let doctor =
      await Doctor.findOne({
        user: userId,
      });

    // -------------------------------------------------
    // Create if missing
    // -------------------------------------------------

    if (!doctor) {
      doctor = new Doctor({
        user: userId,
      });
    }

    // -------------------------------------------------
    // Basic Details
    // -------------------------------------------------

    if (name !== undefined) {
      doctor.name = name;
    }

    if (email !== undefined) {
      doctor.email =
        email.toLowerCase();
    }

    if (phone !== undefined) {
      doctor.phone = phone;
    }

    // -------------------------------------------------
    // Professional Details
    // -------------------------------------------------

    if (
      specialization !==
      undefined
    ) {
      doctor.specialization =
        specialization;
    }

    if (icon !== undefined) {
      doctor.icon = icon;
    }

    if (
      qualification !==
      undefined
    ) {
      doctor.qualification =
        qualification;
    }

    if (
      experience !==
      undefined
    ) {
      doctor.experience =
        experience;
    }

    // -------------------------------------------------
    // Consultation Fee
    // -------------------------------------------------

    if (
      consultationFee !==
      undefined
    ) {
      doctor.consultationFee =
        Number(consultationFee);
    }

    // -------------------------------------------------
    // Hospital
    // -------------------------------------------------

    if (hospital !== undefined) {
      doctor.hospital = hospital;
    }

    if (address !== undefined) {
      doctor.address = address;
    }

    // -------------------------------------------------
    // About
    // -------------------------------------------------

    if (about !== undefined) {
      doctor.about = about;
    }

    // -------------------------------------------------
    // Image
    // -------------------------------------------------

    if (image !== undefined) {
      doctor.image = image;
    }

    // -------------------------------------------------
    // Consultation Types
    // -------------------------------------------------

    if (
      consultationType !==
      undefined
    ) {
      doctor.consultationType =
        normalizeConsultationTypes(
          consultationType
        );
    }

    // -------------------------------------------------
    // Availability
    // -------------------------------------------------

    if (
      available !==
      undefined
    ) {
      doctor.available =
        available;
    }

    // -------------------------------------------------
    // Make sure user is connected
    // -------------------------------------------------

    doctor.user = userId;

    // -------------------------------------------------
    // Save
    // -------------------------------------------------

    await doctor.save();

    await doctor.populate(
      "user",
      "name email phone"
    );

    return res.status(200).json({
      success: true,
      message:
        "Doctor profile updated successfully",
      doctor,
    });
  } catch (error) {
    console.error(
      "Update Doctor Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// Update Consultation Type Only
// =====================================================

const updateConsultationType = async (
  req,
  res
) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "User ID not found. Please login again.",
      });
    }

    const consultationTypes =
      normalizeConsultationTypes(
        req.body.consultationType
      );

    const doctor =
      await Doctor.findOne({
        user: userId,
      });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message:
          "Doctor profile not found",
      });
    }

    doctor.consultationType =
      consultationTypes;

    await doctor.save();

    await doctor.populate(
      "user",
      "name email phone"
    );

    return res.status(200).json({
      success: true,
      message:
        "Consultation types updated successfully",
      doctor,
    });
  } catch (error) {
    console.error(
      "Update Consultation Type Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// Delete Doctor
// =====================================================

const deleteDoctor = async (
  req,
  res
) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "User ID not found. Please login again.",
      });
    }

    const doctor =
      await Doctor.findOneAndDelete({
        user: userId,
      });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message:
          "Doctor profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      message:
        "Doctor profile deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete Doctor Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// Get All Specializations
// =====================================================

const getSpecializations = async (
  req,
  res
) => {
  try {
    const specializations =
      await Doctor.aggregate([
        {
          $match: {
            specialization: {
              $exists: true,
              $ne: "",
            },
          },
        },

        {
          $group: {
            _id: "$specialization",

            count: {
              $sum: 1,
            },

            icon: {
              $first: "$icon",
            },
          },
        },

        {
          $project: {
            _id: 0,

            specialization:
              "$_id",

            count: 1,

            icon: 1,
          },
        },

        {
          $sort: {
            specialization: 1,
          },
        },
      ]);

    return res.status(200).json({
      success: true,
      specializations,
    });
  } catch (error) {
    console.error(
      "Get Specializations Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// EXPORT
// =====================================================

module.exports = {
  addDoctor,
  getDoctors,
  getDoctor,
  getMyDoctorProfile,
  updateDoctor,
  updateConsultationType,
  deleteDoctor,
  getSpecializations,
};
const Doctor = require("../models/Doctor");
const redis = require("../config/redis"); // adjust path if needed

// =====================================================
// Clear Doctors Cache Helper
// =====================================================
const clearDoctorsCache = async () => {
  try {
    await redis.del("doctors:all");
    await redis.del("doctors:specializations");
  } catch (err) {
    console.error("Failed to clear doctors cache:", err.message);
  }
};

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

  const allowedTypes = ["video", "audio", "clinic"];

  const types = value.filter((type) => allowedTypes.includes(type));

  return types.length > 0 ? types : ["video"];
};

// =====================================================
// Add Doctor
// =====================================================
const addDoctor = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID not found. Please login again.",
      });
    }

    if (req.user.role !== "doctor") {
      return res.status(403).json({
        success: false,
        message: "Only doctors can create doctor profiles",
      });
    }

    const existingDoctor = await Doctor.findOne({ user: userId });

    if (existingDoctor) {
      return res.status(400).json({
        success: false,
        message: "Doctor profile already exists",
        doctor: existingDoctor,
      });
    }

    const email = req.body.email?.toLowerCase();

    if (email) {
      const existingEmail = await Doctor.findOne({ email });

      if (existingEmail) {
        return res.status(400).json({
          success: false,
          message: "A doctor profile with this email already exists",
        });
      }
    }

    const consultationTypes = normalizeConsultationTypes(
      req.body.consultationType
    );

    const doctor = await Doctor.create({
      user: userId,
      name: req.body.name,
      email: email,
      phone: req.body.phone,
      specialization: req.body.specialization,
      icon: req.body.icon || "🩺",
      qualification: req.body.qualification,
      experience: req.body.experience,
      consultationFee: req.body.consultationFee,
      hospital: req.body.hospital,
      address: req.body.address,
      about: req.body.about,
      image: req.body.image,
      consultationType: consultationTypes,
      available:
        req.body.available !== undefined ? req.body.available : true,
    });

    await doctor.populate("user", "name email phone");

    await clearDoctorsCache(); // Clear cache after creating

    return res.status(201).json({
      success: true,
      message: "Doctor profile created successfully",
      doctor,
    });
  } catch (error) {
    console.error("Add Doctor Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// Get All Doctors (with Redis Caching)
// =====================================================
const getDoctors = async (req, res) => {
  try {
    const cacheKey = "doctors:all";

    // 1. Try to get data from Redis
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
      // Cache HIT
      const doctors = JSON.parse(cachedData);
      return res.status(200).json({
        success: true,
        count: doctors.length,
        doctors,
        source: "cache",
      });
    }

    // 2. Cache MISS → fetch from MongoDB
    const doctors = await Doctor.find()
      .populate("user", "name email phone")
      .sort({ createdAt: -1 })
      .lean();

    // 3. Store in Redis for 5 minutes (300 seconds)
    await redis.set(cacheKey, JSON.stringify(doctors), "EX", 300);

    return res.status(200).json({
      success: true,
      count: doctors.length,
      doctors,
      source: "database",
    });
  } catch (error) {
    console.error("Get Doctors Error:", error);
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
    const doctor = await Doctor.findById(req.params.id).populate(
      "user",
      "name email phone"
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    return res.status(200).json({
      success: true,
      doctor,
    });
  } catch (error) {
    console.error("Get Doctor Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// Get Logged-in Doctor Profile
// =====================================================
const getMyDoctorProfile = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID not found in authentication",
      });
    }

    const doctor = await Doctor.findOne({ user: userId }).populate(
      "user",
      "name email phone"
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    return res.status(200).json({
      success: true,
      doctor,
    });
  } catch (error) {
    console.error("Get My Doctor Profile Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// Update Doctor
// =====================================================
const updateDoctor = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID not found. Please login again.",
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
      certificates,
    } = req.body;

    let doctor = await Doctor.findOne({ user: userId });

    if (!doctor) {
      doctor = new Doctor({ user: userId });
    }

    if (name !== undefined) doctor.name = name;
    if (email !== undefined) doctor.email = email.toLowerCase();
    if (phone !== undefined) doctor.phone = phone;
    if (specialization !== undefined) doctor.specialization = specialization;
    if (icon !== undefined) doctor.icon = icon;
    if (qualification !== undefined) doctor.qualification = qualification;
    if (experience !== undefined) doctor.experience = experience;
    if (consultationFee !== undefined) {
      doctor.consultationFee = Number(consultationFee);
    }
    if (hospital !== undefined) doctor.hospital = hospital;
    if (address !== undefined) doctor.address = address;
    if (about !== undefined) doctor.about = about;
    if (image !== undefined) doctor.image = image;
    if (consultationType !== undefined) {
      doctor.consultationType = normalizeConsultationTypes(consultationType);
    }
    if (available !== undefined) doctor.available = available;

    if (certificates !== undefined) {
      let parsedCertificates = certificates;

      if (typeof certificates === "string") {
        try {
          parsedCertificates = JSON.parse(certificates);
        } catch (err) {
          parsedCertificates = [];
        }
      }

      if (Array.isArray(parsedCertificates)) {
        doctor.certificates = parsedCertificates;
      }
    }

    doctor.user = userId;

    await doctor.save();
    await doctor.populate("user", "name email phone");

    await clearDoctorsCache(); // Clear cache after updating

    return res.status(200).json({
      success: true,
      message: "Doctor profile updated successfully",
      doctor,
    });
  } catch (error) {
    console.error("Update Doctor Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// Update Consultation Type Only
// =====================================================
const updateConsultationType = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID not found. Please login again.",
      });
    }

    const consultationTypes = normalizeConsultationTypes(
      req.body.consultationType
    );

    const doctor = await Doctor.findOne({ user: userId });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    doctor.consultationType = consultationTypes;

    await doctor.save();
    await doctor.populate("user", "name email phone");

    await clearDoctorsCache(); // Clear cache after updating consultation type

    return res.status(200).json({
      success: true,
      message: "Consultation types updated successfully",
      doctor,
    });
  } catch (error) {
    console.error("Update Consultation Type Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// Delete Doctor
// =====================================================
const deleteDoctor = async (req, res) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID not found. Please login again.",
      });
    }

    const doctor = await Doctor.findOneAndDelete({ user: userId });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    await clearDoctorsCache(); // Clear cache after deleting

    return res.status(200).json({
      success: true,
      message: "Doctor profile deleted successfully",
    });
  } catch (error) {
    console.error("Delete Doctor Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// Get All Specializations
// =====================================================
// =====================================================
// Get All Specializations (with Redis Caching)
// =====================================================
const getSpecializations = async (req, res) => {
  try {
    const cacheKey = "doctors:specializations";

    // 1. Try to get from Redis
    const cachedData = await redis.get(cacheKey);

    if (cachedData) {
      const specializations = JSON.parse(cachedData);
      return res.status(200).json({
        success: true,
        specializations,
        source: "cache",
      });
    }

    // 2. Cache MISS → fetch from MongoDB
    const specializations = await Doctor.aggregate([
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
          count: { $sum: 1 },
          icon: { $first: "$icon" },
        },
      },
      {
        $project: {
          _id: 0,
          specialization: "$_id",
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

    // 3. Store in Redis for 10 minutes (600 seconds)
    await redis.set(cacheKey, JSON.stringify(specializations), "EX", 600);

    return res.status(200).json({
      success: true,
      specializations,
      source: "database",
    });
  } catch (error) {
    console.error("Get Specializations Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// Admin: Verify Doctor
// =====================================================
const verifyDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    doctor.verificationStatus = "Verified";
    doctor.verificationReason = "";
    doctor.verifiedAt = new Date();

    await doctor.save();
    await doctor.populate("user", "name email phone");

    await clearDoctorsCache(); // Clear cache after verification

    return res.status(200).json({
      success: true,
      message: "Doctor verified successfully",
      doctor,
    });
  } catch (error) {
    console.error("Verify Doctor Error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// Admin: Reject Doctor
// =====================================================
const rejectDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    doctor.verificationStatus = "Rejected";
    doctor.verificationReason =
      req.body.reason || "Doctor verification rejected";
    doctor.verifiedAt = null;

    await doctor.save();
    await doctor.populate("user", "name email phone");

    await clearDoctorsCache(); // Clear cache after rejection

    return res.status(200).json({
      success: true,
      message: "Doctor rejected successfully",
      doctor,
    });
  } catch (error) {
    console.error("Reject Doctor Error:", error);
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
  verifyDoctor,
  rejectDoctor,
};
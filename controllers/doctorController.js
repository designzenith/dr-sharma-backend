const Doctor = require("../models/Doctor");

// =====================================================
// Add Doctor
// =====================================================

const addDoctor = async (req, res) => {
  try {
    const userId = req.user._id;

    // Make sure only doctors can create doctor profile
    if (req.user.role !== "doctor") {
      return res.status(403).json({
        success: false,
        message: "Only doctors can create doctor profiles",
      });
    }

    // Check by user ID
    const existingDoctor = await Doctor.findOne({
      user: userId,
    });

    if (existingDoctor) {
      return res.status(400).json({
        success: false,
        message: "Doctor profile already exists",
        doctor: existingDoctor,
      });
    }

    // Check email separately
    const existingEmail = await Doctor.findOne({
      email: req.body.email?.toLowerCase(),
    });

    if (existingEmail) {
      return res.status(400).json({
        success: false,
        message: "A doctor profile with this email already exists",
      });
    }

    const doctor = await Doctor.create({
      user: userId,

      name: req.body.name,
      email: req.body.email?.toLowerCase(),
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

      consultationType:
        req.body.consultationType || "video",

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
      message: "Doctor profile created successfully",
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
    const doctors = await Doctor.find()
      .populate("user", "name email phone")
      .sort({
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: doctors.length,
      doctors,
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
    const doctor = await Doctor.findById(
      req.params.id
    ).populate(
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
// IMPORTANT:
// If profile does not exist, create an empty profile
// automatically for the logged-in doctor.
// =====================================================

const getMyDoctorProfile = async (req, res) => {
  try {
    // Support both possible auth middleware formats
    const userId = req.user?._id || req.user?.id;

    console.log("=================================");
    console.log("GET MY DOCTOR PROFILE");
    console.log("req.user:", req.user);
    console.log("userId:", userId);
    console.log("=================================");

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID not found in authentication",
      });
    }

    const doctor = await Doctor.findOne({
      user: userId,
    }).populate(
      "user",
      "name email phone"
    );

    console.log("Doctor found:", doctor);

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

const updateDoctor = async (req, res) => {
  try {
    const userId = req.user._id;

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

    // -----------------------------------------------
    // Find existing profile
    // -----------------------------------------------

    let doctor = await Doctor.findOne({
      user: userId,
    });

    // -----------------------------------------------
    // If profile doesn't exist, CREATE it
    // -----------------------------------------------

    if (!doctor) {
      doctor = new Doctor({
        user: userId,
      });
    }

    // -----------------------------------------------
    // Update fields
    // -----------------------------------------------

    doctor.name =
      name !== undefined
        ? name
        : doctor.name;

    doctor.email =
      email !== undefined
        ? email
        : doctor.email;

    doctor.phone =
      phone !== undefined
        ? phone
        : doctor.phone;

    doctor.specialization =
      specialization !== undefined
        ? specialization
        : doctor.specialization;

    doctor.icon =
      icon !== undefined
        ? icon
        : doctor.icon;

    doctor.qualification =
      qualification !== undefined
        ? qualification
        : doctor.qualification;

    doctor.experience =
      experience !== undefined
        ? experience
        : doctor.experience;

    doctor.consultationFee =
      consultationFee !== undefined
        ? Number(consultationFee)
        : doctor.consultationFee;

    doctor.hospital =
      hospital !== undefined
        ? hospital
        : doctor.hospital;

    doctor.address =
      address !== undefined
        ? address
        : doctor.address;

    doctor.about =
      about !== undefined
        ? about
        : doctor.about;

    doctor.image =
      image !== undefined
        ? image
        : doctor.image;

    doctor.consultationType =
      consultationType !== undefined
        ? consultationType
        : doctor.consultationType;

    doctor.available =
      available !== undefined
        ? available
        : doctor.available;

    // -----------------------------------------------
    // Save
    // -----------------------------------------------

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
      "Update doctor error:",
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

const deleteDoctor = async (req, res) => {
  try {
    const doctor =
      await Doctor.findOneAndDelete({
        user: req.user._id,
      });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
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

const getSpecializations = async (req, res) => {
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
  deleteDoctor,
  getSpecializations,
};
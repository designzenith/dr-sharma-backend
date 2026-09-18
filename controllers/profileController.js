const User = require("../models/User");
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");
const VerificationDocument = require("../models/VerificationDocument");

// ======================================
// Get My Profile
// ======================================
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    let profile = null;

    // Doctor profile
    if (user.role === "doctor") {
      profile = await Doctor.findOne({
        user: user._id,
      });
    }

    // Patient profile
    if (user.role === "patient") {
      profile = await Patient.findOne({
        user: user._id,
      });
    }

    return res.json({
      success: true,
      user,
      profile,
    });
  } catch (error) {
    console.error("GET PROFILE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================
// Update My Profile
// ======================================
const updateProfile = async (req, res) => {
  try {
    const { name, phone, email, age, gender, bloodGroup, address, city, state } =
      req.body;

    // ---------------------------------------------
    // Get logged-in user
    // ---------------------------------------------
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    // ---------------------------------------------
    // Update User basic information
    // ---------------------------------------------
    user.name = name ?? user.name;
    user.phone = phone ?? user.phone;
    user.email = email ?? user.email;

    await user.save();

    // ---------------------------------------------
    // PATIENT PROFILE
    // ---------------------------------------------
    if (user.role === "patient") {
      const patientData = {
        user: user._id,
        name: name ?? user.name,
        email: email ?? user.email,
        phone: phone ?? user.phone,
        age: age !== undefined ? age : undefined,
        gender: gender ?? "",
        bloodGroup: bloodGroup ?? "",
        address: address ?? "",
        city: city ?? "",
        state: state ?? "",
      };

      const patient = await Patient.findOneAndUpdate(
        { user: user._id },
        { $set: patientData },
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );

      return res.status(200).json({
        success: true,
        message: "Patient profile updated successfully.",
        user,
        profile: patient,
      });
    }

    // ---------------------------------------------
    // DOCTOR
    // ---------------------------------------------
    if (user.role === "doctor") {
      const doctor = await Doctor.findOneAndUpdate(
        { user: user._id },
        {
          $set: {
            name: name ?? user.name,
            email: email ?? user.email,
            phone: phone ?? user.phone,
          },
        },
        {
          new: true,
          runValidators: true,
        }
      );

      return res.status(200).json({
        success: true,
        message: "Doctor profile updated successfully.",
        user,
        profile: doctor,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user,
    });
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);

    // Duplicate email
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Email already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update profile.",
    });
  }
};

// ======================================
// Update Doctor Details
// ======================================
const updateDoctorProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findOneAndUpdate(
      {
        user: req.user._id,
      },
      req.body,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    return res.json({
      success: true,
      message: "Doctor profile updated",
      doctor,
    });
  } catch (error) {
    console.error("UPDATE DOCTOR PROFILE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================
// Update Patient Details
// ======================================
const updatePatientProfile = async (req, res) => {
  try {
    const { name, email, phone, gender, bloodGroup, address, city, state } =
      req.body;

    const patient = await Patient.findOneAndUpdate(
      {
        user: req.user._id,
      },
      {
        ...(name !== undefined && { name: name.trim() }),
        ...(email !== undefined && {
          email: email.trim().toLowerCase(),
        }),
        ...(phone !== undefined && { phone: phone.trim() }),
        ...(gender !== undefined && { gender }),
        ...(bloodGroup !== undefined && { bloodGroup }),
        ...(address !== undefined && { address: address.trim() }),
        ...(city !== undefined && { city: city.trim() }),
        ...(state !== undefined && { state: state.trim() }),
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!patient) {
      return res.status(404).json({
        success: false,
        message: "Patient profile not found",
      });
    }

    return res.json({
      success: true,
      message: "Patient profile updated",
      patient,
    });
  } catch (error) {
    console.error("UPDATE PATIENT PROFILE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================
// Doctor Verification Status
// ======================================
const getVerificationStatus = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({
      user: req.user._id,
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    const verification = await VerificationDocument.findOne({
      doctor: doctor._id,
    });

    return res.json({
      success: true,
      verification,
    });
  } catch (error) {
    console.error("VERIFICATION STATUS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================
// Delete Account
// ======================================
const deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user._id);

    await Doctor.findOneAndDelete({
      user: req.user._id,
    });

    await Patient.findOneAndDelete({
      user: req.user._id,
    });

    return res.json({
      success: true,
      message: "Account deleted successfully",
    });
  } catch (error) {
    console.error("DELETE ACCOUNT ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ======================================
// EXPORT
// ======================================
module.exports = {
  getProfile,
  updateProfile,
  updateDoctorProfile,
  updatePatientProfile,
  getVerificationStatus,
  deleteAccount,
};

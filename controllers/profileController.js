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
    const {
      name,
      phone,
      email,
      age,
      gender,
      bloodGroup,
      address,
      city,
      state,
    } = req.body;

    // --------------------------------------
    // Update basic User information
    // --------------------------------------
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        ...(name !== undefined && { name: name.trim() }),
        ...(phone !== undefined && { phone: phone.trim() }),
        ...(email !== undefined && { email: email.trim().toLowerCase() }),
      },
      {
        new: true,
        runValidators: true,
      },
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // --------------------------------------
    // Patient profile
    // --------------------------------------
    // if (user.role === "patient") {
    //   const patient = await Patient.findOneAndUpdate(
    //     {
    //       user: user._id,
    //     },
    //     {
    //       ...(name !== undefined && { name: name.trim() }),
    //       ...(email !== undefined && {
    //         email: email.trim().toLowerCase(),
    //       }),
    //       ...(phone !== undefined && { phone: phone.trim() }),
    //       ...(gender !== undefined && { gender }),
    //       ...(bloodGroup !== undefined && { bloodGroup }),
    //       ...(address !== undefined && { address: address.trim() }),
    //       ...(city !== undefined && { city: city.trim() }),
    //       ...(state !== undefined && { state: state.trim() }),
    //     },
    //     {
    //       new: true,
    //       runValidators: true,
    //     }
    //   );

    //   if (!patient) {
    //     return res.status(404).json({
    //       success: false,
    //       message:
    //         "Patient profile not found. Please create a patient profile first.",
    //     });
    //   }

    //   return res.json({
    //     success: true,
    //     message: "Patient profile updated successfully",
    //     user,
    //     profile: patient,
    //   });
    // }
    if (user.role === "patient") {
      const patient = await Patient.findOneAndUpdate(
        {
          user: user._id,
        },
        {
          ...(name !== undefined && { name: name.trim() }),
          ...(email !== undefined && {
            email: email.trim().toLowerCase(),
          }),
          ...(phone !== undefined && {
            phone: phone.trim(),
          }),
          ...(gender !== undefined && { gender }),
          ...(bloodGroup !== undefined && { bloodGroup }),
          ...(address !== undefined && {
            address: address.trim(),
          }),
          ...(city !== undefined && {
            city: city.trim(),
          }),
          ...(state !== undefined && {
            state: state.trim(),
          }),
        },
        {
          new: true,
          runValidators: true,
        },
      );

      if (!patient) {
        return res.status(404).json({
          success: false,
          message: "Patient profile not found.",
        });
      }

      return res.json({
        success: true,
        message: "Patient profile updated successfully",
        user,
        profile: patient,
      });
    }

    // --------------------------------------
    // Doctor profile
    // --------------------------------------
    if (user.role === "doctor") {
      const doctor = await Doctor.findOneAndUpdate(
        {
          user: user._id,
        },
        {
          ...(name !== undefined && { name: name.trim() }),
          ...(email !== undefined && {
            email: email.trim().toLowerCase(),
          }),
          ...(phone !== undefined && { phone: phone.trim() }),
        },
        {
          new: true,
          runValidators: true,
        },
      );

      return res.json({
        success: true,
        message: "Doctor profile updated successfully",
        user,
        profile: doctor,
      });
    }

    // --------------------------------------
    // Admin / other
    // --------------------------------------
    return res.json({
      success: true,
      message: "Profile updated successfully",
      user,
    });
  } catch (error) {
    console.error("UPDATE PROFILE ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
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

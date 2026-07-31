const Doctor = require("../models/Doctor");

// ==============================
// Add Doctor
// ==============================

const addDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.create({
      user: req.body.user,

      name: req.body.name,

      email: req.body.email,

      phone: req.body.phone,

      specialization: req.body.specialization,

      qualification: req.body.qualification,

      experience: req.body.experience,

      consultationFee: req.body.consultationFee,

      hospital: req.body.hospital,

      address: req.body.address,

      about: req.body.about,

      image: req.body.image,

      consultationType: req.body.consultationType,

      available: req.body.available,
    });

    res.status(201).json({
      success: true,

      message: "Doctor created successfully",

      doctor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

// ==============================
// Get All Doctors
// ==============================

const getDoctors = async (req, res) => {
  try {
    const doctors = await Doctor.find()
      .populate("user", "name email phone")
      .sort({
        createdAt: -1,
      });

    res.json({
      success: true,

      doctors,
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

// ==============================
// Get Doctor By ID
// ==============================

const getDoctor = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate(
      "user",
      "name email phone",
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,

        message: "Doctor not found",
      });
    }

    res.json({
      success: true,

      doctor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

// ==============================
// Get Logged Doctor Profile
// ==============================

const getMyDoctorProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({
      user: req.user._id,
    }).populate("user", "name email phone");

    if (!doctor) {
      return res.status(404).json({
        success: false,

        message: "Doctor profile not found",
      });
    }

    res.json({
      success: true,

      doctor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

// ==============================
// Update Doctor
// ==============================

const updateDoctor = async (req, res) => {
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

    res.json({
      success: true,

      message: "Doctor updated",

      doctor,
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

// ==============================
// Delete Doctor
// ==============================

const deleteDoctor = async (req, res) => {
  try {
    await Doctor.findOneAndDelete({
      user: req.user._id,
    });

    res.json({
      success: true,

      message: "Doctor deleted",
    });
  } catch (error) {
    res.status(500).json({
      success: false,

      message: error.message,
    });
  }
};

// const getSpecializations = async (req, res) => {
//   try {
//     const specializations = await Doctor.aggregate([
//       {
//         $group: {
//           _id: "$specialization",
//           count: {
//             $sum: 1,
//           },
//         },
//       },

//       {
//         $project: {
//           _id: 0,
//           specialization: "$_id",
//           count: 1,
//         },
//       },

//       {
//         $sort: {
//           specialization: 1,
//         },
//       },
//     ]);

//     res.json({
//       success: true,

//       specializations,
//     });
//   } catch (error) {
//     console.log(error);

//     res.status(500).json({
//       success: false,

//       message: error.message,
//     });
//   }
// };
const getSpecializations = async (req, res) => {
  try {
    const specializations = await Doctor.aggregate([
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

    res.json({
      success: true,
      specializations,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  addDoctor,

  getDoctors,

  getDoctor,

  getMyDoctorProfile,

  updateDoctor,

  deleteDoctor,
  getSpecializations,
};

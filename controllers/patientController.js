const Patient = require("../models/Patient");

// ==============================
// Add Patient
// ==============================
const addPatient = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      specialization,
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

    // Check if Patient already exists
    const existingPatient = await Patient.findOne({ email });

    if (existingPatient) {
      return res.status(400).json({
        success: false,
        message: "Patient already exists",
      });
    }

    const Patient = await Patient.create({
      name,
      email,
      phone,
      specialization,
      qualification,
      experience,
      consultationFee,
      hospital,
      address,
      about,
      image,
      consultationType,
      available,
    });

    res.status(201).json({
      success: true,
      message: "Patient added successfully",
      Patient,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==============================
// Get All Patients
// ==============================
const getPatients = async (req, res) => {
  try {
    const Patients = await Patient.find().sort({
      createdAt: -1,
    });

    res.json({
      success: true,
      Patients,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==============================
// Get Patient By ID
// ==============================
const getPatient = async (req, res) => {
  try {
    const Patient = await Patient.findById(req.params.id);

    if (!Patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    res.json({
      success: true,
      Patient,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==============================
// Get Specializations
// ==============================
const getSpecializations = async (req, res) => {
  try {
    const specializations = await Patient.aggregate([
      {
        $group: {
          _id: "$specialization",
          count: {
            $sum: 1,
          },
        },
      },
      {
        $project: {
          _id: 0,
          specialization: "$_id",
          count: 1,
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
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==============================
// Update Patient
// ==============================
const updatePatient = async (req, res) => {
  try {
    const Patient = await Patient.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!Patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    res.json({
      success: true,
      message: "Patient updated successfully",
      Patient,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ==============================
// Delete Patient
// ==============================
const deletePatient = async (req, res) => {
  try {
    const Patient = await Patient.findByIdAndDelete(req.params.id);

    if (!Patient) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    res.json({
      success: true,
      message: "Patient deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  addPatient,
  getPatients,
  getSpecializations,
  getPatient,
  updatePatient,
  deletePatient,
};
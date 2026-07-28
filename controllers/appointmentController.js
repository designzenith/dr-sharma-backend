const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");

// =========================
// Book Appointment
// =========================
const bookAppointment = async (req, res) => {
  try {
    console.log("Appointment Request:", req.body);

    const appointment = await Appointment.create(req.body);

    res.status(201).json({
      success: true,
      appointment,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================
// Patient Appointments
// =========================
const patientAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({
      patient: req.params.id,
    })
      .populate("doctor")
      .sort({ appointmentDate: -1 });

    res.status(200).json({
      success: true,
      appointments,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================
// Doctor Appointments
// =========================
const doctorAppointments = async (req, res) => {
  try {
    console.log("Logged User ID:", req.params.id);

    // Find doctor profile using logged-in User ID
    const doctor = await Doctor.findOne({
      user: req.params.id,
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found.",
      });
    }

    console.log("Doctor Profile:", doctor._id);

    const appointments = await Appointment.find({
      doctor: doctor._id,
    })
      .populate("patient")
      .sort({ appointmentDate: -1 });

    console.log("Appointments:", appointments);

    res.status(200).json({
      success: true,
      appointments,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================
// Update Appointment
// =========================
const updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
      }
    );

    res.status(200).json({
      success: true,
      appointment,
    });
  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =========================
// Cancel Appointment
// =========================
const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      {
        status: "Cancelled",
      },
      {
        new: true,
      }
    );

    res.status(200).json({
      success: true,
      appointment,
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
  bookAppointment,
  patientAppointments,
  doctorAppointments,
  updateAppointment,
  cancelAppointment,
};
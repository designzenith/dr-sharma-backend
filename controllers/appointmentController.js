const Appointment = require("../models/Appointment");

// Book Appointment
const bookAppointment = async (req, res) => {
  try {
    console.log("Appointment Request:");
    console.log(req.body);

    const appointment = await Appointment.create(req.body);

    res.status(201).json({
      success: true,
      appointment,
    });
  } catch (error) {
    console.log(error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// Patient Appointments
const patientAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({
      patient: req.params.id,
    }).populate("doctor");

    res.json({
      success: true,
      appointments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Doctor Appointments
const doctorAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({
      doctor: req.params.id,
    }).populate("patient");

    res.json({
      success: true,
      appointments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Update Appointment
const updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );

    res.json({
      success: true,
      appointment,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// Cancel Appointment

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

    res.json({
      success: true,
      appointment,
    });
  } catch (error) {
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
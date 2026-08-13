const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const User = require("../models/User");
const { v4: uuidv4 } = require("uuid");

// =====================================================
// BOOK APPOINTMENT
// Patient sends appointment request
// =====================================================

const bookAppointment = async (req, res) => {
  try {
    console.log("Appointment Request:", req.body);

    // Patient must come from logged-in user
    const patientId = req.user._id;

    const { doctor, appointmentDate, appointmentTime, consultationType } =
      req.body;

    // Validate doctor
    const doctorProfile = await Doctor.findById(doctor);

    if (!doctorProfile) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    // Check doctor availability
    if (!doctorProfile.available) {
      return res.status(400).json({
        success: false,
        message: "Doctor is currently unavailable",
      });
    }

    // Validate consultation type
    if (
      consultationType &&
      !["video", "audio", "clinic"].includes(consultationType)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid consultation type",
      });
    }

    // Check if doctor already has appointment
    // at same date and time
    const existingAppointment = await Appointment.findOne({
      doctor: doctorProfile._id,
      appointmentDate: new Date(appointmentDate),
      appointmentTime,
      status: {
        $in: ["Pending", "Confirmed", "In Progress"],
      },
    });

    if (existingAppointment) {
      return res.status(400).json({
        success: false,
        message: "This appointment slot is already booked or pending approval",
      });
    }

    // Create appointment
    const appointment = await Appointment.create({
      patient: patientId,

      doctor: doctorProfile._id,

      appointmentDate,

      appointmentTime,

      consultationType: consultationType || "video",

      // Room is created after doctor accepts
      roomId: undefined,

      status: "Pending",
    });

    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate(
        "doctor",
        "name specialization qualification experience hospital image consultationFee",
      )
      .populate("patient", "name email phone");

    res.status(201).json({
      success: true,
      message: "Appointment request sent. Waiting for doctor approval.",
      appointment: populatedAppointment,
    });
  } catch (error) {
    console.error("Book Appointment Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// PATIENT ALL APPOINTMENTS
// Admin / internal use if required
// =====================================================

const patientAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({
      patient: req.params.id,
    })
      .populate(
        "doctor",
        "name specialization qualification experience hospital image consultationFee",
      )
      .sort({
        appointmentDate: -1,
        createdAt: -1,
      });

    res.status(200).json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    console.error("Patient Appointments Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// LOGGED-IN PATIENT APPOINTMENTS
// =====================================================

const getMyPatientAppointments = async (req, res) => {
  try {
    const appointments = await Appointment.find({
      patient: req.user._id,
    })
      .populate(
        "doctor",
        "name specialization qualification experience hospital image consultationFee",
      )
      .sort({
        appointmentDate: -1,
        createdAt: -1,
      });

    res.status(200).json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    console.error("My Patient Appointments Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// =====================================================
// PATIENT CONSULTATION HISTORY
// Completed + Cancelled appointments
// =====================================================

const patientHistory = async (req, res) => {
  try {
    const appointments = await Appointment.find({
      patient: req.user._id,
      status: {
        $in: ["Completed", "Cancelled"],
      },
    })
      .populate(
        "doctor",
        "name specialization qualification experience hospital image consultationFee",
      )
      .sort({
        appointmentDate: -1,
        createdAt: -1,
      });

    return res.status(200).json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    console.error("Patient History Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to load consultation history",
    });
  }
};
// =====================================================
// DOCTOR APPOINTMENTS
// Logged-in doctor only
// =====================================================

const doctorAppointments = async (req, res) => {
  try {
    // Find doctor profile using logged-in user
    const doctor = await Doctor.findOne({
      user: req.user._id,
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    const appointments = await Appointment.find({
      doctor: doctor._id,
    })
      .populate("patient", "name email phone")
      .populate(
        "doctor",
        "name specialization qualification experience hospital image consultationFee",
      )
      .sort({
        appointmentDate: 1,
        appointmentTime: 1,
        createdAt: -1,
      });

    res.status(200).json({
      success: true,
      count: appointments.length,
      appointments,
    });
  } catch (error) {
    console.error("Doctor Appointments Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// DOCTOR ACCEPT APPOINTMENT
// Pending → Confirmed
// =====================================================

const acceptAppointment = async (req, res) => {
  try {
    // Find logged-in doctor's profile
    const doctor = await Doctor.findOne({
      user: req.user._id,
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    // IMPORTANT:
    // Appointment must belong to this doctor
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      doctor: doctor._id,
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found or does not belong to you",
      });
    }

    // Only Pending can be accepted
    if (appointment.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message: `Appointment is already ${appointment.status}`,
      });
    }

    // Generate room ID only for video/audio
    if (
      appointment.consultationType === "video" ||
      appointment.consultationType === "audio"
    ) {
      appointment.roomId = uuidv4();
    }

    appointment.status = "Confirmed";

    await appointment.save();

    await appointment.populate("patient", "name email phone");

    await appointment.populate(
      "doctor",
      "name specialization hospital image consultationFee",
    );

    res.status(200).json({
      success: true,
      message: "Appointment confirmed successfully",
      appointment,
    });
  } catch (error) {
    console.error("Accept Appointment Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// DOCTOR REJECT / CANCEL APPOINTMENT
// Pending/Confirmed → Cancelled
// =====================================================

const rejectAppointment = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({
      user: req.user._id,
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    const appointment = await Appointment.findOne({
      _id: req.params.id,
      doctor: doctor._id,
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found or does not belong to you",
      });
    }

    if (appointment.status === "Completed") {
      return res.status(400).json({
        success: false,
        message: "Completed appointment cannot be cancelled",
      });
    }

    if (appointment.status === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "Appointment is already cancelled",
      });
    }

    appointment.status = "Cancelled";

    appointment.cancellationReason =
      req.body.reason || "Appointment cancelled by doctor";

    await appointment.save();

    res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully",
      appointment,
    });
  } catch (error) {
    console.error("Reject Appointment Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// START CONSULTATION
// Confirmed → In Progress
// =====================================================

const startCall = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({
      user: req.user._id,
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    const appointment = await Appointment.findOne({
      _id: req.params.id,
      doctor: doctor._id,
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    if (appointment.status !== "Confirmed") {
      return res.status(400).json({
        success: false,
        message: "Only confirmed appointments can be started",
      });
    }

    appointment.status = "In Progress";

    appointment.callStartedAt = new Date();

    await appointment.save();

    res.status(200).json({
      success: true,
      message: "Consultation started",
      appointment,
    });
  } catch (error) {
    console.error("Start Call Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// END CONSULTATION
// In Progress → Completed
// =====================================================

const endCall = async (req, res) => {
  try {
    const doctor = await Doctor.findOne({
      user: req.user._id,
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    const appointment = await Appointment.findOne({
      _id: req.params.id,
      doctor: doctor._id,
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    if (appointment.status !== "In Progress") {
      return res.status(400).json({
        success: false,
        message: "Only active consultations can be completed",
      });
    }

    appointment.status = "Completed";

    appointment.callEndedAt = new Date();

    // Calculate duration
    if (appointment.callStartedAt) {
      const durationMs = appointment.callEndedAt - appointment.callStartedAt;

      appointment.duration = Math.max(0, Math.floor(durationMs / 1000 / 60));
    }

    await appointment.save();

    res.status(200).json({
      success: true,
      message: "Consultation completed successfully",
      appointment,
    });
  } catch (error) {
    console.error("End Call Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// UPDATE APPOINTMENT
// Restricted fields only
// =====================================================

const updateAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Only allow appointment date/time/type
    const allowedFields = [
      "appointmentDate",
      "appointmentTime",
      "consultationType",
    ];

    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        appointment[field] = req.body[field];
      }
    });

    await appointment.save();

    res.status(200).json({
      success: true,
      message: "Appointment updated successfully",
      appointment,
    });
  } catch (error) {
    console.error("Update Appointment Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// PATIENT CANCEL APPOINTMENT
// =====================================================

const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      _id: req.params.id,
      patient: req.user._id,
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    if (appointment.status === "Completed") {
      return res.status(400).json({
        success: false,
        message: "Completed appointment cannot be cancelled",
      });
    }

    if (appointment.status === "Cancelled") {
      return res.status(400).json({
        success: false,
        message: "Appointment is already cancelled",
      });
    }

    appointment.status = "Cancelled";

    appointment.cancellationReason = req.body.reason || "Cancelled by patient";

    await appointment.save();

    res.status(200).json({
      success: true,
      message: "Appointment cancelled successfully",
      appointment,
    });
  } catch (error) {
    console.error("Cancel Appointment Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// GET APPOINTMENT BY ROOM ID
// =====================================================

const getAppointmentByRoom = async (req, res) => {
  try {
    const appointment = await Appointment.findOne({
      roomId: req.params.roomId,
    })
      .populate(
        "doctor",
        "name specialization qualification experience hospital image",
      )
      .populate("patient", "name email phone");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    res.status(200).json({
      success: true,
      appointment,
    });
  } catch (error) {
    console.error("Get Appointment By Room Error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// =====================================================
// ADMIN DASHBOARD
// Get all patients, doctors, appointments and revenue
// =====================================================

const adminDashboard = async (req, res) => {
  try {
    // -------------------------------------------------
    // 1. Total registered patients
    // -------------------------------------------------

    const totalPatients = await User.countDocuments({
      role: "patient",
    });

    // -------------------------------------------------
    // 2. Total registered doctors
    // -------------------------------------------------

    const totalDoctors = await Doctor.countDocuments();

    // -------------------------------------------------
    // 3. Total appointments
    // -------------------------------------------------

    const totalAppointments = await Appointment.countDocuments();

    // -------------------------------------------------
    // 4. Get all appointments
    // -------------------------------------------------

    const appointments = await Appointment.find()
      .populate("patient", "name email phone")
      .populate(
        "doctor",
        "name specialization qualification experience hospital image consultationFee",
      )
      .sort({
        appointmentDate: -1,
        createdAt: -1,
      });

    // -------------------------------------------------
    // 5. Calculate revenue
    //
    // Appointment does not store consultationFee.
    // Fee comes from Doctor profile.
    // -------------------------------------------------

    const totalRevenue = appointments.reduce((total, appointment) => {
      // Do not count cancelled appointments
      if (appointment.status === "Cancelled") {
        return total;
      }

      const fee = Number(appointment.doctor?.consultationFee) || 0;

      return total + fee;
    }, 0);

    // -------------------------------------------------
    // 6. Send dashboard data
    // -------------------------------------------------

    return res.status(200).json({
      success: true,

      totalPatients,
      totalDoctors,
      totalAppointments,
      totalRevenue,

      appointments,
    });
  } catch (error) {
    console.error("Admin Dashboard Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Unable to load admin dashboard",
    });
  }
};


module.exports = {
  bookAppointment,

  patientAppointments,

  getMyPatientAppointments,

  patientHistory,

  doctorAppointments,

  acceptAppointment,

  rejectAppointment,

  updateAppointment,

  cancelAppointment,

  startCall,

  endCall,

  getAppointmentByRoom,

  adminDashboard,
};

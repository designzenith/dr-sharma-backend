const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    // ==========================================
    // Patient
    // ==========================================

    patient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ==========================================
    // Doctor
    // ==========================================

    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      index: true,
    },

    // ==========================================
    // Appointment Date
    // ==========================================

    appointmentDate: {
      type: Date,
      required: true,
      index: true,
    },

    // ==========================================
    // Appointment Time
    // ==========================================

    appointmentTime: {
      type: String,
      required: true,
      trim: true,
    },

    // ==========================================
    // Consultation Type
    // ==========================================

    consultationType: {
      type: String,
      enum: ["video", "audio", "clinic"],
      default: "video",
    },

    // ==========================================
    // Video / Audio Room
    // ==========================================

    roomId: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },

    // ==========================================
    // Appointment Status
    // ==========================================

    status: {
      type: String,
      enum: [
        "Pending",
        "Confirmed",
        "In Progress",
        "Completed",
        "Cancelled",
      ],
      default: "Pending",
      index: true,
    },

    // ==========================================
    // Cancellation
    // ==========================================

    cancellationReason: {
      type: String,
      default: "",
      trim: true,
    },

    // ==========================================
    // Doctor Notes
    // ==========================================

    doctorNotes: {
      type: String,
      default: "",
      trim: true,
    },

    // ==========================================
    // Call Information
    // ==========================================

    callStartedAt: {
      type: Date,
    },

    callEndedAt: {
      type: Date,
    },

    // Duration in minutes
    duration: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);


// ==========================================
// Indexes
// ==========================================

// Helps quickly find a doctor's appointments
appointmentSchema.index({
  doctor: 1,
  appointmentDate: 1,
  status: 1,
});

// Helps quickly find patient's appointments
appointmentSchema.index({
  patient: 1,
  appointmentDate: -1,
});


module.exports = mongoose.model(
  "Appointment",
  appointmentSchema
);
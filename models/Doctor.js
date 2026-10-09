const mongoose = require("mongoose");

// =====================================================
// Doctor Schema
// =====================================================

const doctorSchema = new mongoose.Schema(
  {
    // =====================================================
    // Linked User Account
    // =====================================================
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },

    // =====================================================
    // Basic Details
    // =====================================================
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      trim: true,
      lowercase: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    // =====================================================
    // Professional Details
    // =====================================================
    specialization: {
      type: String,
      trim: true,
      default: "",
    },

    icon: {
      type: String,
      default: "🩺",
    },

    qualification: {
      type: String,
      trim: true,
      default: "",
    },

    experience: {
      type: String,
      trim: true,
      default: "",
    },

    // =====================================================
    // Consultation Details
    // =====================================================
    consultationFee: {
      type: Number,
      min: 0,
      default: 0,
    },

    consultationType: {
      type: [String],
      enum: ["video", "audio", "clinic"],
      default: ["video"],
    },

    // =====================================================
    // Hospital / Clinic
    // =====================================================
    hospital: {
      type: String,
      trim: true,
      default: "",
    },

    address: {
      type: String,
      trim: true,
      default: "",
    },

    // New recommended clinic fields
    clinicAddress: {
      type: String,
      trim: true,
      default: "",
    },

    clinicCity: {
      type: String,
      trim: true,
      default: "",
    },

    clinicPincode: {
      type: String,
      trim: true,
      default: "",
    },

    // =====================================================
    // Doctor Description
    // =====================================================
    about: {
      type: String,
      trim: true,
      default: "",
    },

    // =====================================================
    // Doctor Certificates
    // =====================================================
    certificates: [
      {
        title: {
          type: String,
          trim: true,
          default: "",
        },
        image: {
          type: String,
          trim: true,
          default: "",
        },
      },
    ],

    // =====================================================
    // Profile Image
    // =====================================================
    image: {
      type: String,
      default: "",
    },

    // =====================================================
    // Verification
    // =====================================================
    verificationStatus: {
      type: String,
      enum: ["Pending", "Verified", "Rejected"],
      default: "Pending",
    },

    verificationReason: {
      type: String,
      default: "",
      trim: true,
    },

    verifiedAt: {
      type: Date,
      default: null,
    },

    // =====================================================
    // Availability
    // =====================================================
    available: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// =====================================================
// Export Doctor Model
// =====================================================

module.exports = mongoose.model("Doctor", doctorSchema);
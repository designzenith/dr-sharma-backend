const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
    },

    phone: {
      type: String,
    },

   specialization: {
      type: String,
      required: true,
    },

    // Add this field
    icon: {
      type: String,
      default: "🩺",
    },

    qualification: {
      type: String,
    },

    experience: {
      type: String,
    },

    consultationFee: {
      type: Number,
    },

    hospital: {
      type: String,
    },

    address: {
      type: String,
    },

    about: {
      type: String,
    },

    image: {
      type: String,
    },

    consultationType: {
      type: String,
      enum: ["video", "audio", "clinic"],
      default: "video",
    },

    available: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Doctor", doctorSchema);

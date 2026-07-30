const mongoose = require("mongoose");

// =====================================
// Time Slot Schema
// =====================================
const timeSlotSchema = new mongoose.Schema(
  {
    startTime: {
      type: String,
      required: true,
    },

    endTime: {
      type: String,
      required: true,
    },

    consultationType: {
      type: String,
      enum: ["video", "audio", "clinic"],
      default: "video",
    },

    isBooked: {
      type: Boolean,
      default: false,
    },

    maxPatients: {
      type: Number,
      default: 1,
    },

    slotDuration: {
      type: Number,
      default: 30, // Minutes
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: false,
  }
);

// =====================================
// Weekly Day Schema
// =====================================
const daySchema = new mongoose.Schema(
  {
    day: {
      type: String,
      enum: [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      required: true,
    },

    isAvailable: {
      type: Boolean,
      default: true,
    },

    breakStart: {
      type: String,
      default: "",
    },

    breakEnd: {
      type: String,
      default: "",
    },

    slots: {
      type: [timeSlotSchema],
      default: [],
    },
  },
  {
    _id: false,
  }
);

// =====================================
// Schedule Schema
// =====================================
const scheduleSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      unique: true,
      index: true,
    },

    weeklySchedule: {
      type: [daySchema],
      default: [
        {
          day: "Monday",
          isAvailable: true,
          breakStart: "",
          breakEnd: "",
          slots: [],
        },
        {
          day: "Tuesday",
          isAvailable: true,
          breakStart: "",
          breakEnd: "",
          slots: [],
        },
        {
          day: "Wednesday",
          isAvailable: true,
          breakStart: "",
          breakEnd: "",
          slots: [],
        },
        {
          day: "Thursday",
          isAvailable: true,
          breakStart: "",
          breakEnd: "",
          slots: [],
        },
        {
          day: "Friday",
          isAvailable: true,
          breakStart: "",
          breakEnd: "",
          slots: [],
        },
        {
          day: "Saturday",
          isAvailable: true,
          breakStart: "",
          breakEnd: "",
          slots: [],
        },
        {
          day: "Sunday",
          isAvailable: false,
          breakStart: "",
          breakEnd: "",
          slots: [],
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Schedule", scheduleSchema);
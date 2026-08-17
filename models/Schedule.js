const mongoose = require("mongoose");

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
      default: 30, // minutes
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const dayScheduleSchema = new mongoose.Schema(
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
  { _id: false }
);

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
      type: [dayScheduleSchema],
      default: () => [
        { day: "Monday", isAvailable: true, slots: [] },
        { day: "Tuesday", isAvailable: true, slots: [] },
        { day: "Wednesday", isAvailable: true, slots: [] },
        { day: "Thursday", isAvailable: true, slots: [] },
        { day: "Friday", isAvailable: true, slots: [] },
        { day: "Saturday", isAvailable: true, slots: [] },
        { day: "Sunday", isAvailable: true, slots: [] },
      ],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Schedule", scheduleSchema);
const mongoose = require("mongoose");

const doctorLeaveSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      index: true,
    },

    leaveType: {
      type: String,
      enum: [
        "Full Day",
        "Half Day",
        "Vacation",
        "Emergency",
        "Weekly Off",
      ],
      default: "Full Day",
    },

    fromDate: {
      type: Date,
      required: true,
    },

    toDate: {
      type: Date,
      required: true,
    },

    fromTime: {
      type: String,
      default: "",
    },

    toTime: {
      type: String,
      default: "",
    },

    // Used only when leaveType = Weekly Off
    weekDay: {
      type: String,
      enum: [
        "",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ],
      default: "",
    },

    reason: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected"],
      default: "Approved",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
doctorLeaveSchema.index({
  doctor: 1,
  fromDate: 1,
  toDate: 1,
});

doctorLeaveSchema.index({
  doctor: 1,
  status: 1,
});

module.exports = mongoose.model("DoctorLeave", doctorLeaveSchema);
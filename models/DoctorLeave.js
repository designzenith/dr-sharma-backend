const mongoose = require("mongoose");

const doctorLeaveSchema = new mongoose.Schema(
  {
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
    // Leave Type
    // ==========================================
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
      required: true,
    },

    // ==========================================
    // Leave Dates
    // ==========================================
    fromDate: {
      type: Date,
      required: true,
    },

    toDate: {
      type: Date,
      required: true,
    },

    // ==========================================
    // Time (used for Half Day)
    // ==========================================
    fromTime: {
      type: String,
      default: "",
      trim: true,
    },

    toTime: {
      type: String,
      default: "",
      trim: true,
    },

    // ==========================================
    // Weekly Off
    // ==========================================
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

    // ==========================================
    // Reason
    // ==========================================
    reason: {
      type: String,
      trim: true,
      default: "",
    },

    // ==========================================
    // Leave Status
    // ==========================================
    status: {
      type: String,
      enum: ["Active", "Cancelled"],
      default: "Active",
      index: true,
    },

    // ==========================================
    // Active Flag
    // ==========================================
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// =====================================================
// VALIDATION
// =====================================================
doctorLeaveSchema.pre("validate", async function () {
  if (this.fromDate && this.toDate && this.toDate < this.fromDate) {
    throw new Error("To date must be greater than or equal to from date");
  }

  if (this.leaveType === "Weekly Off" && !this.weekDay) {
    throw new Error("Week day is required for Weekly Off");
  }

  if (this.leaveType === "Half Day") {
    if (!this.fromTime || !this.toTime) {
      throw new Error("From time and to time are required for Half Day leave");
    }
    if (this.fromTime >= this.toTime) {
      throw new Error("To time must be greater than from time");
    }
  }
});

// =====================================================
// KEEP isActive SYNCHRONIZED WITH status
// =====================================================
doctorLeaveSchema.pre("save", async function () {
  if (this.status === "Cancelled") {
    this.isActive = false;
  } else if (this.status === "Active") {
    this.isActive = true;
  }
});

// =====================================================
// INDEXES
// =====================================================
doctorLeaveSchema.index({
  doctor: 1,
  fromDate: 1,
  toDate: 1,
});

doctorLeaveSchema.index({
  doctor: 1,
  status: 1,
  isActive: 1,
});

// =====================================================
// EXPORT
// =====================================================
module.exports = mongoose.model("DoctorLeave", doctorLeaveSchema);
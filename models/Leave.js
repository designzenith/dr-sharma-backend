const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema(
  {
    doctor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      index: true,
    },

    leaveDate: {
      type: Date,
      required: true,
      index: true,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
    },

    status: {
      type: String,
      enum: [
        "Pending",
        "Approved",
        "Rejected",
        "Cancelled",
      ],
      default: "Pending",
      index: true,
    },

    adminNote: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);


// Prevent duplicate active leave
// requests for the same doctor/date.
leaveSchema.index(
  {
    doctor: 1,
    leaveDate: 1,
  },
  {
    unique: true,
  }
);


module.exports = mongoose.model(
  "Leave",
  leaveSchema
);
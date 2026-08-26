const mongoose = require("mongoose");

// =====================================================
// Notification Schema
// =====================================================

const notificationSchema = new mongoose.Schema(
  {
    // ---------------------------------------------------
    // User who receives the notification
    // ---------------------------------------------------

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    // ---------------------------------------------------
    // Related appointment
    // Optional because general notifications
    // may not belong to an appointment
    // ---------------------------------------------------

    appointment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      default: null,
    },

    // ---------------------------------------------------
    // Notification title
    // ---------------------------------------------------

    title: {
      type: String,
      required: true,
      trim: true,
    },

    // ---------------------------------------------------
    // Notification message
    // ---------------------------------------------------

    message: {
      type: String,
      required: true,
      trim: true,
    },

    // ---------------------------------------------------
    // Notification type
    // ---------------------------------------------------

    type: {
      type: String,
      enum: [
        "appointment-booked",
        "appointment-accepted",
        "appointment-rejected",
        "appointment-cancelled",
        "appointment-completed",
        "appointment-reminder",
        "appointment-30-minutes",
        "appointment-updated",
        "general",
      ],
      default: "general",
      index: true,
    },

    // ---------------------------------------------------
    // Read status
    // ---------------------------------------------------

    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
  },

  {
    timestamps: true,
  }
);

// =====================================================
// Model
// =====================================================

module.exports = mongoose.model(
  "Notification",
  notificationSchema
);
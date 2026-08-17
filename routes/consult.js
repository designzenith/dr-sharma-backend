const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const Appointment = require("../models/Appointment");
const auth = require("../middleware/auth"); // if you want protection

// POST /api/consult/:appointmentId/token
router.post("/:appointmentId/token", async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { userId, role } = req.body;

    if (!userId || !role) {
      return res.status(400).json({
        success: false,
        message: "userId and role are required",
      });
    }

    // Find the appointment
    const appointment = await Appointment.findById(appointmentId)
      .populate("patient", "_id")
      .populate("doctor", "user");

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Check if the user is allowed to join this room
    const isPatient =
      appointment.patient?._id?.toString() === userId.toString();

    const isDoctor =
      appointment.doctor?.user?.toString() === userId.toString();

    if (!isPatient && !isDoctor) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized for this consultation",
      });
    }

    // Only allow Confirmed or In Progress appointments
    if (!["Confirmed", "In Progress"].includes(appointment.status)) {
      return res.status(400).json({
        success: false,
        message: `Appointment is currently ${appointment.status}`,
      });
    }

    // Create a short-lived token for signaling
    const token = jwt.sign(
      {
        appointmentId,
        userId,
        role,
        roomId: appointment.roomId || appointmentId,
      },
      process.env.JWT_SECRET || "your_jwt_secret",
      { expiresIn: "2h" }
    );

    return res.json({
      success: true,
      token,
      roomId: appointment.roomId || appointmentId,
    });
  } catch (error) {
    console.error("Consult token error:", error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;
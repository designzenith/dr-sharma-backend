const Leave = require("../models/Leave");
const Doctor = require("../models/Doctor");


// =====================================================
// Apply for Leave
// POST /api/leaves
// =====================================================

const applyLeave = async (req, res) => {
  try {
    const { leaveDate, reason } = req.body;

    // -----------------------------------------------
    // Validation
    // -----------------------------------------------

    if (!leaveDate) {
      return res.status(400).json({
        success: false,
        message: "Leave date is required",
      });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Leave reason is required",
      });
    }

    // -----------------------------------------------
    // Find Doctor
    // -----------------------------------------------

    const doctor = await Doctor.findOne({
      user: req.user._id,
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    // -----------------------------------------------
    // Validate Date
    // -----------------------------------------------

    const date = new Date(leaveDate);

    if (Number.isNaN(date.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave date",
      });
    }

    /*
     * Normalize date to midnight.
     *
     * This prevents duplicate requests caused by
     * different time values.
     */

    date.setHours(0, 0, 0, 0);

    // -----------------------------------------------
    // Prevent Past Date
    // -----------------------------------------------

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    if (date < today) {
      return res.status(400).json({
        success: false,
        message:
          "You cannot apply for leave on a past date",
      });
    }

    // -----------------------------------------------
    // Check Existing Leave
    // -----------------------------------------------

    const existingLeave = await Leave.findOne({
      doctor: doctor._id,
      leaveDate: date,
    });

    if (existingLeave) {
      return res.status(400).json({
        success: false,
        message:
          "A leave request already exists for this date",
      });
    }

    // -----------------------------------------------
    // Create Leave
    // -----------------------------------------------

    const leave = await Leave.create({
      doctor: doctor._id,
      leaveDate: date,
      reason: reason.trim(),
      status: "Pending",
    });

    return res.status(201).json({
      success: true,
      message:
        "Leave request submitted successfully",
      leave,
    });
  } catch (error) {
    console.error(
      "Apply Leave Error:",
      error
    );

    // Duplicate key error
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message:
          "A leave request already exists for this date",
      });
    }

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// =====================================================
// Get Logged-in Doctor Leaves
// GET /api/leaves
// =====================================================

const getMyLeaves = async (req, res) => {
  try {
    // -----------------------------------------------
    // Find Doctor
    // -----------------------------------------------

    const doctor = await Doctor.findOne({
      user: req.user._id,
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    // -----------------------------------------------
    // Get Leaves
    // -----------------------------------------------

    const leaves = await Leave.find({
      doctor: doctor._id,
    })
      .sort({
        leaveDate: -1,
        createdAt: -1,
      })
      .lean();

    return res.json({
      success: true,
      count: leaves.length,
      leaves,
    });
  } catch (error) {
    console.error(
      "Get My Leaves Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// =====================================================
// Cancel Leave
// PUT /api/leaves/:id/cancel
// =====================================================

const cancelLeave = async (req, res) => {
  try {
    // -----------------------------------------------
    // Find Doctor
    // -----------------------------------------------

    const doctor = await Doctor.findOne({
      user: req.user._id,
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    // -----------------------------------------------
    // Find Leave
    // -----------------------------------------------

    const leave = await Leave.findOne({
      _id: req.params.id,
      doctor: doctor._id,
    });

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave request not found",
      });
    }

    // -----------------------------------------------
    // Only Pending Leave Can Be Cancelled
    // -----------------------------------------------

    if (leave.status !== "Pending") {
      return res.status(400).json({
        success: false,
        message:
          "Only pending leave requests can be cancelled",
      });
    }

    // -----------------------------------------------
    // Cancel Leave
    // -----------------------------------------------

    leave.status = "Cancelled";

    await leave.save();

    return res.json({
      success: true,
      message: "Leave request cancelled successfully",
      leave,
    });
  } catch (error) {
    console.error(
      "Cancel Leave Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// =====================================================
// Export
// =====================================================

module.exports = {
  applyLeave,
  getMyLeaves,
  cancelLeave,
};
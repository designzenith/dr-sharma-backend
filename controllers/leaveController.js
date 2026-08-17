const DoctorLeave = require("../models/DoctorLeave");
const Doctor = require("../models/Doctor");

// =====================================================
// Helper: Get Doctor Profile
// =====================================================

const getDoctor = async (userId) => {
  return await Doctor.findOne({
    user: userId,
  });
};

// =====================================================
// Apply for Leave
// POST /api/leaves
// =====================================================

const applyLeave = async (req, res) => {
  try {
    const {
      leaveType,
      fromDate,
      toDate,
      fromTime,
      toTime,
      weekDay,
      reason,
    } = req.body;

    // -----------------------------------------------
    // Find Doctor
    // -----------------------------------------------
    const doctor = await getDoctor(req.user._id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    // -----------------------------------------------
    // Basic Validation
    // -----------------------------------------------
    if (!leaveType) {
      return res.status(400).json({
        success: false,
        message: "Leave type is required",
      });
    }

    const allowedLeaveTypes = [
      "Full Day",
      "Half Day",
      "Vacation",
      "Emergency",
      "Weekly Off",
    ];

    if (!allowedLeaveTypes.includes(leaveType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave type",
      });
    }

    if (!fromDate) {
      return res.status(400).json({
        success: false,
        message: "From date is required",
      });
    }

    if (!toDate) {
      return res.status(400).json({
        success: false,
        message: "To date is required",
      });
    }

    if (!reason || !reason.trim()) {
      return res.status(400).json({
        success: false,
        message: "Leave reason is required",
      });
    }

    // -----------------------------------------------
    // Validate Dates
    // -----------------------------------------------
    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave date",
      });
    }

    // Normalize dates
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    // -----------------------------------------------
    // Check Date Range
    // -----------------------------------------------
    if (endDate < startDate) {
      return res.status(400).json({
        success: false,
        message: "To date must be greater than or equal to from date",
      });
    }

    // -----------------------------------------------
    // Prevent Past Leave
    // -----------------------------------------------
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (startDate < today) {
      return res.status(400).json({
        success: false,
        message: "You cannot apply for leave on a past date",
      });
    }

    // -----------------------------------------------
    // Weekly Off Validation
    // -----------------------------------------------
    if (leaveType === "Weekly Off") {
      const allowedDays = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ];

      if (!weekDay || !allowedDays.includes(weekDay)) {
        return res.status(400).json({
          success: false,
          message: "Week day is required for Weekly Off",
        });
      }
    }

    // -----------------------------------------------
    // Half Day Validation
    // -----------------------------------------------
    if (leaveType === "Half Day") {
      if (!fromTime || !toTime) {
        return res.status(400).json({
          success: false,
          message: "From time and to time are required for Half Day leave",
        });
      }

      if (fromTime >= toTime) {
        return res.status(400).json({
          success: false,
          message: "To time must be later than from time",
        });
      }
    }

    // -----------------------------------------------
    // Check Existing Active Leave (date range overlap)
    // -----------------------------------------------
    const existingLeave = await DoctorLeave.findOne({
      doctor: doctor._id,
      status: "Active",
      isActive: true,
      fromDate: { $lte: endDate },
      toDate: { $gte: startDate },
    });

    if (existingLeave) {
      return res.status(400).json({
        success: false,
        message: "An active leave already exists for one or more selected dates",
      });
    }

    // -----------------------------------------------
    // Create Leave  ← THIS WAS COMMENTED OUT / BROKEN
    // -----------------------------------------------
    const leave = await DoctorLeave.create({
      doctor: doctor._id,
      leaveType,
      fromDate: startDate,
      toDate: endDate,
      fromTime: leaveType === "Half Day" ? fromTime || "" : "",
      toTime: leaveType === "Half Day" ? toTime || "" : "",
      weekDay: leaveType === "Weekly Off" ? weekDay || "" : "",
      reason: reason.trim(),
      status: "Active",
      isActive: true,
    });

    // -----------------------------------------------
    // Response
    // -----------------------------------------------
    return res.status(201).json({
      success: true,
      message: "Leave applied successfully",
      leave,
    });
  } catch (error) {
    console.error("Apply Leave Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message || "Something went wrong while applying leave",
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

    const doctor = await getDoctor(req.user._id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    // -----------------------------------------------
    // Get Doctor Leaves
    // -----------------------------------------------

    const leaves = await DoctorLeave.find({
      doctor: doctor._id,
    })
      .sort({
        fromDate: -1,
        createdAt: -1,
      })
      .lean();

    return res.json({
      success: true,
      count: leaves.length,
      leaves,
    });
  } catch (error) {
    console.error("Get My Leaves Error:", error);

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

    const doctor = await getDoctor(req.user._id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    // -----------------------------------------------
    // Find Active Leave
    // -----------------------------------------------

    const leave = await DoctorLeave.findOne({
      _id: req.params.id,

      doctor: doctor._id,

      status: "Active",

      isActive: true,
    });

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Active leave not found",
      });
    }

    // -----------------------------------------------
    // Cancel Leave
    // -----------------------------------------------

    leave.status = "Cancelled";

    leave.isActive = false;

    await leave.save();

    // -----------------------------------------------
    // Response
    // -----------------------------------------------

    return res.json({
      success: true,
      message: "Leave cancelled successfully",
      leave,
    });
  } catch (error) {
    console.error("Cancel Leave Error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// Check Doctor Leave For Specific Date
//
// This helper can be used from appointment/schedule
// controller.
//
// Returns active leave if doctor is unavailable.
// Returns null if doctor is available.
// =====================================================

const checkDoctorLeave = async (doctorId, selectedDate) => {
  try {
    const date = new Date(selectedDate);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    date.setHours(0, 0, 0, 0);

    const leave = await DoctorLeave.findOne({
      doctor: doctorId,          // ← correct (comes from parameter)
      status: "Active",
      isActive: true,
      fromDate: { $lte: date },  // ← correct (local variable)
      toDate: { $gte: date },
    });

    return leave || null;
  } catch (error) {
    console.error("Check Doctor Leave Error:", error);
    return null;
  }
};

// =====================================================
// Export
// =====================================================

module.exports = {
  applyLeave,
  getMyLeaves,
  cancelLeave,
  checkDoctorLeave,
};
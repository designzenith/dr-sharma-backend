const Schedule = require("../models/Schedule");
const Doctor = require("../models/Doctor");
const DoctorLeave = require("../models/DoctorLeave");


// =====================================================
// Helper: Get Logged-in Doctor
// =====================================================

const getDoctor = async (userId) => {
  return await Doctor.findOne({
    user: userId,
  });
};


// =====================================================
// Helper: Get Doctor Schedule
// =====================================================

const getSchedule = async (doctorId) => {
  return await Schedule.findOne({
    doctor: doctorId,
  });
};


// =====================================================
// Helper: Validate Time
// =====================================================

const isValidTime = (time) => {
  if (!time) return false;

  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(
    time
  );
};


// =====================================================
// Get Doctor Schedule
// GET /api/schedule
// =====================================================

const getDoctorSchedule = async (req, res) => {
  try {
    const doctor = await getDoctor(
      req.user._id
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    let schedule = await getSchedule(
      doctor._id
    );

    // Create schedule if it doesn't exist
    if (!schedule) {
      schedule = await Schedule.create({
        doctor: doctor._id,
      });
    }

    return res.json({
      success: true,
      schedule,
    });
  } catch (error) {
    console.error(
      "Get doctor schedule error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// =====================================================
// Update Weekly Schedule
// PUT /api/schedule
// =====================================================

const updateDoctorSchedule = async (
  req,
  res
) => {
  try {
    const doctor = await getDoctor(
      req.user._id
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    const {
      weeklySchedule,
    } = req.body;

    if (!Array.isArray(weeklySchedule)) {
      return res.status(400).json({
        success: false,
        message:
          "weeklySchedule must be an array",
      });
    }

    const schedule =
      await Schedule.findOneAndUpdate(
        {
          doctor: doctor._id,
        },
        {
          weeklySchedule,
        },
        {
          new: true,
          upsert: true,
          runValidators: true,
          setDefaultsOnInsert: true,
        }
      );

    return res.json({
      success: true,
      message:
        "Schedule updated successfully",
      schedule,
    });
  } catch (error) {
    console.error(
      "Update doctor schedule error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// =====================================================
// Add Time Slot
// POST /api/schedule/slot
// =====================================================

const addTimeSlot = async (req, res) => {
  try {
    const doctor = await getDoctor(req.user._id);

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    const {
      day,
      startTime,
      endTime,
      consultationType = "video",
      maxPatients = 1,
      slotDuration = 30,
    } = req.body;

    if (!day || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        message: "Day, start time and end time are required",
      });
    }

    if (!isValidTime(startTime) || !isValidTime(endTime)) {
      return res.status(400).json({
        success: false,
        message: "Invalid time format. Use HH:MM",
      });
    }

    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        message: "End time must be later than start time",
      });
    }

    if (!["video", "audio", "clinic"].includes(consultationType)) {
      return res.status(400).json({
        success: false,
        message: "Invalid consultation type",
      });
    }

    if (Number(maxPatients) < 1) {
      return res.status(400).json({
        success: false,
        message: "Maximum patients must be at least 1",
      });
    }

    if (Number(slotDuration) < 5) {
      return res.status(400).json({
        success: false,
        message: "Slot duration must be at least 5 minutes",
      });
    }

    const schedule = await getSchedule(doctor._id);

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found",
      });
    }

    const dayData = schedule.weeklySchedule.find(
      (item) => item.day === day
    );

    if (!dayData) {
      return res.status(404).json({
        success: false,
        message: "Day not found",
      });
    }

    if (!dayData.isAvailable) {
      return res.status(400).json({
        success: false,
        message: `${day} is currently unavailable`,
      });
    }

    if (dayData.breakStart && dayData.breakEnd) {
      const overlapsBreak =
        startTime < dayData.breakEnd && endTime > dayData.breakStart;

      if (overlapsBreak) {
        return res.status(400).json({
          success: false,
          message: "Time slot overlaps with break time",
        });
      }
    }

    // ✅ FIXED: only block same consultationType
    const overlappingSlot = dayData.slots.find((slot) => {
      return (
        slot.startTime < endTime &&
        slot.endTime > startTime &&
        slot.consultationType === consultationType
      );
    });

    if (overlappingSlot) {
      return res.status(400).json({
        success: false,
        message: `A ${consultationType} slot already exists between ${overlappingSlot.startTime} - ${overlappingSlot.endTime}`,
      });
    }

    dayData.slots.push({
      startTime,
      endTime,
      consultationType,
      isBooked: false,
      maxPatients: Number(maxPatients),
      slotDuration: Number(slotDuration),
      isActive: true,
    });

    dayData.slots.sort((a, b) =>
      a.startTime.localeCompare(b.startTime)
    );

    await schedule.save();

    return res.status(201).json({
      success: true,
      message: "Time slot added successfully",
      schedule,
    });
  } catch (error) {
    console.error("Add time slot error:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// =====================================================
// Delete Time Slot
// DELETE /api/schedule/slot/:day/:slotIndex
// =====================================================

const deleteTimeSlot = async (
  req,
  res
) => {
  try {
    const doctor = await getDoctor(
      req.user._id
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    const {
      day,
      slotIndex,
    } = req.params;

    const schedule = await getSchedule(
      doctor._id
    );

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found",
      });
    }

    const dayData =
      schedule.weeklySchedule.find(
        (item) => item.day === day
      );

    if (!dayData) {
      return res.status(404).json({
        success: false,
        message: "Day not found",
      });
    }

    const index = Number(
      slotIndex
    );

    if (
      !Number.isInteger(index) ||
      index < 0 ||
      index >= dayData.slots.length
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid slot index",
      });
    }

    const slot =
      dayData.slots[index];

    // Don't delete already booked slots
    if (slot.isBooked) {
      return res.status(400).json({
        success: false,
        message:
          "Booked slots cannot be deleted",
      });
    }

    dayData.slots.splice(index, 1);

    await schedule.save();

    return res.json({
      success: true,
      message:
        "Time slot deleted successfully",
      schedule,
    });
  } catch (error) {
    console.error(
      "Delete time slot error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// =====================================================
// Toggle Day Availability
// PUT /api/schedule/availability/:day
// =====================================================

const toggleDayAvailability = async (
  req,
  res
) => {
  try {
    const doctor = await getDoctor(
      req.user._id
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    const schedule = await getSchedule(
      doctor._id
    );

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found",
      });
    }

    const dayData =
      schedule.weeklySchedule.find(
        (item) =>
          item.day === req.params.day
      );

    if (!dayData) {
      return res.status(404).json({
        success: false,
        message: "Day not found",
      });
    }

    dayData.isAvailable =
      !dayData.isAvailable;

    await schedule.save();

    return res.json({
      success: true,
      message:
        "Availability updated successfully",
      schedule,
    });
  } catch (error) {
    console.error(
      "Toggle availability error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// =====================================================
// Add Doctor Leave
// POST /api/schedule/leaves
// =====================================================

const addLeave = async (
  req,
  res
) => {
  try {
    const doctor = await getDoctor(
      req.user._id
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    const {
      fromDate,
      toDate,
      reason,
    } = req.body;

    if (!fromDate || !toDate) {
      return res.status(400).json({
        success: false,
        message:
          "From date and to date are required",
      });
    }

    const startDate =
      new Date(fromDate);

    const endDate =
      new Date(toDate);

    if (
      Number.isNaN(
        startDate.getTime()
      ) ||
      Number.isNaN(
        endDate.getTime()
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid leave dates",
      });
    }

    if (startDate > endDate) {
      return res.status(400).json({
        success: false,
        message:
          "To date must be after from date",
      });
    }

    const leave =
      await DoctorLeave.create({
        doctor: doctor._id,
        fromDate: startDate,
        toDate: endDate,
        reason:
          reason?.trim() || "",
      });

    return res.status(201).json({
      success: true,
      message:
        "Leave added successfully",
      leave,
    });
  } catch (error) {
    console.error(
      "Add leave error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// =====================================================
// Get Doctor Leaves
// GET /api/schedule/leaves
// =====================================================

const getLeaves = async (
  req,
  res
) => {
  try {
    const doctor = await getDoctor(
      req.user._id
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    const leaves =
      await DoctorLeave.find({
        doctor: doctor._id,
      }).sort({
        fromDate: -1,
      });

    return res.json({
      success: true,
      leaves,
    });
  } catch (error) {
    console.error(
      "Get leaves error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};


// =====================================================
// Delete Doctor Leave
// DELETE /api/schedule/leaves/:id
// =====================================================

const deleteLeave = async (
  req,
  res
) => {
  try {
    const doctor = await getDoctor(
      req.user._id
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    const leave =
      await DoctorLeave.findOne({
        _id: req.params.id,
        doctor: doctor._id,
      });

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "Leave not found",
      });
    }

    await leave.deleteOne();

    return res.json({
      success: true,
      message:
        "Leave deleted successfully",
    });
  } catch (error) {
    console.error(
      "Delete leave error:",
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
  getDoctorSchedule,
  updateDoctorSchedule,
  addTimeSlot,
  deleteTimeSlot,
  toggleDayAvailability,
  addLeave,
  getLeaves,
  deleteLeave,
};
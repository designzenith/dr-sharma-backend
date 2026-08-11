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
      consultationType,
      maxPatients,
      slotDuration,
    } = req.body;

    // -----------------------------------
    // Validation
    // -----------------------------------

    if (
      !day ||
      !startTime ||
      !endTime
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Day, start time and end time are required",
      });
    }

    if (
      ![
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
      ].includes(day)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid day",
      });
    }

    if (
      !["video", "audio", "clinic"].includes(
        consultationType
      )
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid consultation type",
      });
    }

    // -----------------------------------
    // Time Validation
    // -----------------------------------

    if (startTime >= endTime) {
      return res.status(400).json({
        success: false,
        message:
          "End time must be later than start time",
      });
    }

    // -----------------------------------
    // Find Schedule
    // -----------------------------------

    const schedule =
      await Schedule.findOne({
        doctor: doctor._id,
      });

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message:
          "Schedule not found. Please load your schedule first.",
      });
    }

    // -----------------------------------
    // Find Day
    // -----------------------------------

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

    // -----------------------------------
    // Check Day Availability
    // -----------------------------------

    if (!dayData.isAvailable) {
      return res.status(400).json({
        success: false,
        message:
          `${day} is currently unavailable`,
      });
    }

    // -----------------------------------
    // Check Break
    // -----------------------------------

    if (
      dayData.breakStart &&
      dayData.breakEnd
    ) {
      const overlapsBreak =
        startTime < dayData.breakEnd &&
        endTime > dayData.breakStart;

      if (overlapsBreak) {
        return res.status(400).json({
          success: false,
          message:
            "This slot overlaps with your break time",
        });
      }
    }

    // -----------------------------------
    // Check Overlapping Slots
    // -----------------------------------

    const overlappingSlot =
      dayData.slots.find((slot) => {
        return (
          startTime < slot.endTime &&
          endTime > slot.startTime
        );
      });

    if (overlappingSlot) {
      return res.status(400).json({
        success: false,
        message:
          `Slot overlaps with ${overlappingSlot.startTime} - ${overlappingSlot.endTime}`,
      });
    }

    // -----------------------------------
    // Add Slot
    // -----------------------------------

    dayData.slots.push({
      startTime,
      endTime,

      consultationType:
        consultationType || "video",

      isBooked: false,

      maxPatients:
        Number(maxPatients) > 0
          ? Number(maxPatients)
          : 1,

      slotDuration:
        Number(slotDuration) > 0
          ? Number(slotDuration)
          : 30,

      isActive: true,
    });

    // -----------------------------------
    // Sort Slots
    // -----------------------------------

    dayData.slots.sort(
      (a, b) =>
        a.startTime.localeCompare(
          b.startTime
        )
    );

    await schedule.save();

    return res.json({
      success: true,
      message:
        "Time slot added successfully",
      schedule,
    });
  } catch (error) {
    console.error(
      "Add time slot error:",
      error
    );

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
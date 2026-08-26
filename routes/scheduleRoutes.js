const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");

const {
  getDoctorSchedule,
  updateDoctorSchedule,
  addTimeSlot,
  deleteTimeSlot,
  toggleDayAvailability,
  addLeave,
  getLeaves,
  deleteLeave,
  getPublicSlots,
} = require("../controllers/scheduleController");


// ======================================
// Schedule
// ======================================

router.get(
  "/",
  auth,
  getDoctorSchedule
);

router.put(
  "/",
  auth,
  updateDoctorSchedule
);


// ======================================
// Time Slots
// ======================================

router.post(
  "/slot",
  auth,
  addTimeSlot
);

router.delete(
  "/slot/:day/:slotIndex",
  auth,
  deleteTimeSlot
);


// ======================================
// Day Availability
// ======================================

router.put(
  "/availability/:day",
  auth,
  toggleDayAvailability
);


// ======================================
// Doctor Leaves
// ======================================

router.post(
  "/leaves",
  auth,
  addLeave
);

router.get(
  "/leaves",
  auth,
  getLeaves
);

router.delete(
  "/leaves/:id",
  auth,
  deleteLeave
);

router.get("/public/:doctorId", getPublicSlots);
module.exports = router;
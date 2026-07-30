const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const doctorAuth = require("../middleware/doctorAuth");

const {
  getDoctorSchedule,
  updateDoctorSchedule,
  addTimeSlot,
  deleteTimeSlot,
  toggleDayAvailability,
  addLeave,
  getLeaves,
  deleteLeave,
} = require("../controllers/scheduleController");


// ===================================
// Doctor Weekly Schedule
// ===================================


// Get logged-in doctor schedule
// GET /api/schedule
router.get(
  "/",
  auth,
  doctorAuth,
  getDoctorSchedule
);


// Create / Update weekly schedule
// POST /api/schedule
router.post(
  "/",
  auth,
  doctorAuth,
  updateDoctorSchedule
);


// ===================================
// Time Slot Management
// ===================================


// Add available time slot
// POST /api/schedule/slot
router.post(
  "/slot",
  auth,
  doctorAuth,
  addTimeSlot
);


// Delete time slot
// DELETE /api/schedule/slot/:day/:slotId
router.delete(
  "/slot/:day/:slotId",
  auth,
  doctorAuth,
  deleteTimeSlot
);


// Enable / Disable working day
// PUT /api/schedule/day/:day
router.put(
  "/day/:day",
  auth,
  doctorAuth,
  toggleDayAvailability
);


// ===================================
// Doctor Leave Management
// ===================================


// Get all leaves
// GET /api/schedule/leaves
router.get(
  "/leaves",
  auth,
  doctorAuth,
  getLeaves
);


// Add leave / break days
// POST /api/schedule/leaves
router.post(
  "/leaves",
  auth,
  doctorAuth,
  addLeave
);


// Delete leave
// DELETE /api/schedule/leaves/:id
router.delete(
  "/leaves/:id",
  auth,
  doctorAuth,
  deleteLeave
);


module.exports = router;
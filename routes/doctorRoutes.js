const express = require("express");
const router = express.Router();

const doctorAuth = require("../middleware/doctorAuth");

const {
  addDoctor,
  getDoctors,
  getDoctor,
  getMyDoctorProfile,
  updateDoctor,
  deleteDoctor,
  getSpecializations,
} = require("../controllers/doctorController");

// ==============================
// PUBLIC
// ==============================

// Get all doctors
// GET /api/doctors
router.get("/", getDoctors);

// Get all specializations
// GET /api/doctors/specializations
router.get("/specializations", getSpecializations);


// ==============================
// DOCTOR ONLY
// ==============================

// Get my doctor profile
// GET /api/doctors/me
// MUST BE BEFORE /:id
router.get(
  "/me",
  doctorAuth,
  getMyDoctorProfile
);

// Create doctor profile
// POST /api/doctors
router.post(
  "/",
  doctorAuth,
  addDoctor
);

// Update doctor profile
// PUT /api/doctors/update
router.put(
  "/update",
  doctorAuth,
  updateDoctor
);

// Delete doctor profile
// DELETE /api/doctors/delete
router.delete(
  "/delete",
  doctorAuth,
  deleteDoctor
);


// ==============================
// GET DOCTOR BY ID
// ==============================

// MUST BE LAST
// GET /api/doctors/:id
router.get(
  "/:id",
  getDoctor
);

module.exports = router;
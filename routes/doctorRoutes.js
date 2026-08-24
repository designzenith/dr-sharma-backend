const express = require("express");

const router = express.Router();

const doctorAuth = require("../middleware/doctorAuth");

const {
  addDoctor,
  getDoctors,
  getDoctor,
  getMyDoctorProfile,
  updateDoctor,
  updateConsultationType,
  deleteDoctor,
  getSpecializations,
} = require("../controllers/doctorController");

// =====================================================
// PUBLIC
// =====================================================

// Get all doctors
// GET /api/doctors

router.get(
  "/",
  getDoctors
);

// Get all specializations
// GET /api/doctors/specializations

router.get(
  "/specializations",
  getSpecializations
);

// =====================================================
// DOCTOR ONLY
// =====================================================

// Get logged-in doctor profile
// GET /api/doctors/me

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

// Update complete doctor profile
// PUT /api/doctors/update

router.put(
  "/update",
  doctorAuth,
  updateDoctor
);

// Update consultation types only
// PUT /api/doctors/consultation-type

router.put(
  "/consultation-type",
  doctorAuth,
  updateConsultationType
);

// Delete doctor profile
// DELETE /api/doctors/delete

router.delete(
  "/delete",
  doctorAuth,
  deleteDoctor
);

// =====================================================
// GET DOCTOR BY ID
// =====================================================

// MUST BE LAST

// GET /api/doctors/:id

router.get(
  "/:id",
  getDoctor
);

module.exports = router;
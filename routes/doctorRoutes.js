const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");

const {
  addDoctor,
  getDoctors,
  getDoctor,
  getMyDoctorProfile,
  updateDoctor,
  deleteDoctor,
  getSpecializations,
} = require("../controllers/doctorController");

/* ============================
   Doctor Routes
============================ */

// Add Doctor
router.post("/", auth, addDoctor);

// Get All Doctors
router.get("/", getDoctors);

// Get Logged-in Doctor Profile
router.get("/me", auth, getMyDoctorProfile);

// Get All Specializations
// IMPORTANT: Keep this BEFORE "/:id"
router.get("/specializations", getSpecializations);

// Update Doctor
router.put("/update", auth, updateDoctor);

// Delete Doctor
router.delete("/delete", auth, deleteDoctor);

// Get Doctor By ID
// Keep this route LAST
router.get("/:id", getDoctor);

module.exports = router;
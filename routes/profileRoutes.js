const express = require("express");

const router = express.Router();

const {
  getProfile,
  updateProfile,
  updateDoctorProfile,
  updatePatientProfile,
  getVerificationStatus,
  deleteAccount,
} = require("../controllers/profileController");

const auth = require("../middleware/auth");

router.get("/", auth, getProfile);

router.put("/", auth, updateProfile);

router.put("/doctor", auth, updateDoctorProfile);

router.put("/patient", auth, updatePatientProfile);

router.get("/verification", auth, getVerificationStatus);

router.delete("/", auth, deleteAccount);

module.exports = router;
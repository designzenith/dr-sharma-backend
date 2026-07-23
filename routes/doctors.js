const express = require("express");
const router = express.Router();

const {
  addDoctor,
  getDoctors,
  getSpecializations,
  getDoctor,
  updateDoctor,
  deleteDoctor,
} = require("../controllers/doctorController");

// Public Routes (No Auth Required)
router.get("/", getDoctors);
router.get("/specializations", getSpecializations);
router.get("/:id", getDoctor);

// Protected Routes (Keep these if needed)
router.post("/", addDoctor);
router.put("/:id", updateDoctor);
router.delete("/:id", deleteDoctor);

module.exports = router;
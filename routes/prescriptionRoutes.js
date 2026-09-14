const express = require("express");
const router = express.Router();
const {
  getDoctorPrescriptions,
  getPrescriptionById,
  createPrescription,
} = require("../controllers/prescriptionController");
const doctorAuth = require("../middleware/doctorAuth"); // adjust if needed

// GET /api/prescriptions/doctor
router.get("/doctor", doctorAuth, getDoctorPrescriptions);

// GET /api/prescriptions/:id
router.get("/:id", doctorAuth, getPrescriptionById);

// POST /api/prescriptions
router.post("/", doctorAuth, createPrescription);

module.exports = router;
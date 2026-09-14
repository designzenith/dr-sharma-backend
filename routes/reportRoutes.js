const express = require("express");
const router = express.Router();
const {
  getDoctorReports,
  getReportById,
} = require("../controllers/reportController");
const doctorAuth = require("../middleware/doctorAuth"); // adjust if needed

// GET /api/reports/doctor
router.get("/doctor", doctorAuth, getDoctorReports);

// GET /api/reports/:id
router.get("/:id", doctorAuth, getReportById);

module.exports = router;
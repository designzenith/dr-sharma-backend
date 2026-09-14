const express = require("express");
const router = express.Router();
const { getDoctorEarnings } = require("../controllers/earningsController");
const doctorAuth = require("../middleware/doctorAuth"); // or your auth middleware

// GET /api/earnings/doctor
router.get("/doctor", doctorAuth, getDoctorEarnings);

module.exports = router;
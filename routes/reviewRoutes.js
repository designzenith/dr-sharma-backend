const express = require("express");
const router = express.Router();
const {
  getDoctorReviews,
  createReview,
} = require("../controllers/reviewController");
const doctorAuth = require("../middleware/doctorAuth");
const auth = require("../middleware/auth"); // for patient submitting review

// GET /api/reviews/doctor  (doctor views their reviews)
router.get("/doctor", doctorAuth, getDoctorReviews);

// POST /api/reviews  (patient creates a review)
router.post("/", auth, createReview);

module.exports = router;
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

const { generateDoctorQA, generateDoctorServices } = require("../utils/generateDoctorQA");
const Doctor = require("../models/Doctor");
const Review = require("../models/Review");
// const Appointment = require("../models/Appointment"); // uncomment when ready

// ====================== PUBLIC ======================
router.get("/", getDoctors);
router.get("/specializations", getSpecializations);

// ====================== DOCTOR ONLY ======================
router.get("/me", doctorAuth, getMyDoctorProfile);
router.post("/", doctorAuth, addDoctor);
router.put("/update", doctorAuth, updateDoctor);
router.put("/consultation-type", doctorAuth, updateConsultationType);
router.delete("/delete", doctorAuth, deleteDoctor);

// ====================== Q&A + SERVICES ======================
router.get("/:id/qa", async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).lean();

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const qa = generateDoctorQA(doctor);
    const services = generateDoctorServices(doctor);

    return res.status(200).json({
      success: true,
      qa,
      services,
    });
  } catch (error) {
    console.error("QA Error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ====================== REVIEWS ======================

// GET reviews  ← THIS WAS MISSING
router.get("/:id/reviews", async (req, res) => {
  try {
    const reviews = await Review.find({ doctor: req.params.id })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      reviews,
    });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch reviews",
    });
  }
});

// POST review
router.post("/:id/reviews", async (req, res) => {
  try {
    const { patientName, rating, review, media } = req.body;

    if (!patientName || !rating || !review) {
      return res.status(400).json({
        message: "patientName, rating and review are required",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        message: "Rating must be between 1 and 5",
      });
    }

    const newReview = await Review.create({
      doctor: req.params.id,
      patientName,
      rating,
      review,
      media: media || [],
    });

    return res.status(201).json({
      success: true,
      message: "Review added successfully",
      review: newReview,
    });
  } catch (error) {
    console.error("Error adding review:", error);
    return res.status(500).json({
      message: "Failed to add review",
      error: error.message,
    });
  }
});

// ====================== HAS BOOKED (optional) ======================
router.get("/:id/has-booked", async (req, res) => {
  try {
    // Temporary: always return false until you add auth + Appointment model
    return res.json({ hasBooked: false });
  } catch (error) {
    return res.status(500).json({ hasBooked: false });
  }
});

// ====================== GET DOCTOR BY ID (MUST BE LAST) ======================
router.get("/:id", getDoctor);

module.exports = router;
const express = require("express");

const router = express.Router();

const {
  getAllQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getQuestionsBySpecialization,
} = require("../controllers/questionController");

const adminAuth = require("../middleware/adminAuth");

// =====================================================
// PUBLIC / BOOKING
// Must come BEFORE /:id
// =====================================================
router.get(
  "/by-specialization/:specialization",
  getQuestionsBySpecialization
);

// =====================================================
// ADMIN
// =====================================================

router.get("/", adminAuth, getAllQuestions);

router.post("/", adminAuth, createQuestion);

router.patch("/:id", adminAuth, updateQuestion);

router.delete("/:id", adminAuth, deleteQuestion);

module.exports = router;
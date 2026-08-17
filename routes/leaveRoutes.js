const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");

const {
  applyLeave,
  getMyLeaves,
  cancelLeave,
} = require("../controllers/leaveController");

// ==========================================
// Apply Leave
// POST /api/leaves
// ==========================================
router.post(
  "/",
  auth,
  applyLeave
);

// ==========================================
// Get Doctor's Leaves
// GET /api/leaves
// ==========================================
router.get(
  "/",
  auth,
  getMyLeaves
);

// ==========================================
// Cancel Doctor Leave
// PUT /api/leaves/:id/cancel
// ==========================================
router.put(
  "/:id/cancel",
  auth,
  cancelLeave
);

module.exports = router;
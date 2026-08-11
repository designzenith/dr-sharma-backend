const express = require("express");

const router = express.Router();

const auth = require("../middleware/auth");

const {
  applyLeave,
  getMyLeaves,
  cancelLeave,
} = require("../controllers/leaveController");


// Apply Leave
router.post(
  "/",
  auth,
  applyLeave
);


// Get My Leaves
router.get(
  "/",
  auth,
  getMyLeaves
);


// Cancel Pending Leave
router.put(
  "/:id/cancel",
  auth,
  cancelLeave
);


module.exports = router;
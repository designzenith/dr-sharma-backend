const express = require("express");

const router = express.Router();

const { validateCoupon } = require("../controllers/couponController");

const auth = require("../middleware/auth");

router.post("/validate", auth, validateCoupon);

module.exports = router;
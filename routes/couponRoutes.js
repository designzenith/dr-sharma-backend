const express = require("express");
const router = express.Router();

const {
  validateCoupon,
  getAvailableCoupons,
} = require("../controllers/couponController");

const auth = require("../middleware/auth");

router.get(
  "/available",
  auth,
  getAvailableCoupons
);

router.post(
  "/validate",
  auth,
  validateCoupon
);

module.exports = router;
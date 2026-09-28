const express = require("express");
const router = express.Router();

const {
  createCashfreePayment,
  verifyCashfreePayment,
  cashfreeWebhook,
} = require("../controllers/cashfreePaymentController");

const auth = require("../middleware/auth");

router.post("/create/:id", auth, createCashfreePayment);
router.get("/verify/:orderId", auth, verifyCashfreePayment);
router.post("/webhook", cashfreeWebhook);

module.exports = router;
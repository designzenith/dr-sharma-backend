const express = require("express");
const router = express.Router();

const {
  register,
  login,
  sendLoginOTP,
  verifyLoginOTP,
  forgotPassword,
  verifyForgotPasswordOTP,
  resetPassword,
  changePassword,
} = require("../controllers/authController");

const protect = require("../middleware/auth");

// =====================================================
// REGISTER & LOGIN
// =====================================================
router.post("/register", register);
router.post("/login", login);

// =====================================================
// OTP LOGIN
// =====================================================
router.post("/send-login-otp", sendLoginOTP);
router.post("/verify-login-otp", verifyLoginOTP);

// =====================================================
// FORGOT PASSWORD FLOW
// =====================================================
router.post("/forgot-password", forgotPassword);

// Step 2 – Verify OTP (frontend may call either of these)
router.post("/verify-forgot-password-otp", verifyForgotPasswordOTP);
router.post("/verify-otp", verifyForgotPasswordOTP);   // frontend compatibility

// Step 3 – Reset password
router.post("/reset-password", resetPassword);

// =====================================================
// CHANGE PASSWORD (logged-in user)
// =====================================================
router.put("/change-password", protect, changePassword);

module.exports = router;
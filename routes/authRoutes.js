const express = require("express");
const router = express.Router();

const passport = require("passport");

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
// GOOGLE LOGIN / REGISTER
// =====================================================

// Step 1 - Redirect user to Google
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
  }),
);

// Step 2 - Google redirects back here
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login?error=google`,
  }),
  (req, res) => {
    try {
      const { token, user } = req.user;

      const redirectUrl =
        `${process.env.FRONTEND_URL}/auth/google-success` +
        `?token=${encodeURIComponent(token)}` +
        `&user=${encodeURIComponent(JSON.stringify(user))}`;

      res.redirect(redirectUrl);
    } catch (error) {
      console.error("Google Callback Error:", error);

      res.redirect(`${process.env.FRONTEND_URL}/login?error=google`);
    }
  },
);

// =====================================================
// OTP LOGIN
// =====================================================

router.post("/send-login-otp", sendLoginOTP);

router.post("/verify-login-otp", verifyLoginOTP);

// =====================================================
// FORGOT PASSWORD FLOW
// =====================================================

router.post("/forgot-password", forgotPassword);

// Step 2 - Verify OTP
router.post("/verify-forgot-password-otp", verifyForgotPasswordOTP);

// Frontend compatibility
router.post("/verify-otp", verifyForgotPasswordOTP);

// Step 3 - Reset password
router.post("/reset-password", resetPassword);

// =====================================================
// CHANGE PASSWORD
// =====================================================

router.put("/change-password", protect, changePassword);

module.exports = router;

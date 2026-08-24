const jwt = require("jsonwebtoken");
const User = require("../models/User");

// =====================================================
// Doctor Authentication Middleware
// =====================================================

const doctorAuth = async (req, res, next) => {
  try {
    // =================================================
    // Get Authorization Header
    // =================================================

    const authHeader =
      req.headers.authorization;

    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Authorization token missing",
      });
    }

    // =================================================
    // Extract Token
    // =================================================

    const token =
      authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    // =================================================
    // Verify JWT
    // =================================================

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    console.log(
      "================================="
    );
    console.log(
      "DOCTOR AUTHENTICATION"
    );
    console.log(
      "Decoded JWT:",
      decoded
    );
    console.log(
      "================================="
    );

    // =================================================
    // Get User ID From JWT
    // =================================================

    const userId =
      decoded.id ||
      decoded._id ||
      decoded.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message:
          "User ID missing from token",
      });
    }

    // =================================================
    // Find User
    // =================================================

    const user =
      await User.findById(userId)
        .select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message:
          "User not found",
      });
    }

    // =================================================
    // Doctor Only
    // =================================================

    if (user.role !== "doctor") {
      return res.status(403).json({
        success: false,
        message:
          "Doctor access only",
      });
    }

    // =================================================
    // Log Authenticated Doctor
    // =================================================

    console.log(
      "Authenticated Doctor:",
      {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      }
    );

    // =================================================
    // Attach User To Request
    // =================================================

    req.user = user;

    // =================================================
    // Continue
    // =================================================

    next();
  } catch (error) {
    console.error(
      "Doctor Auth Error:",
      error.message
    );

    // JWT expired
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        success: false,
        message:
          "Token expired. Please login again.",
      });
    }

    // Invalid JWT
    if (
      error.name ===
      "JsonWebTokenError"
    ) {
      return res.status(401).json({
        success: false,
        message:
          "Invalid authentication token",
      });
    }

    return res.status(401).json({
      success: false,
      message:
        "Authentication failed",
    });
  }
};

module.exports = doctorAuth;
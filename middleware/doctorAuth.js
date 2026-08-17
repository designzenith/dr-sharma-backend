const jwt = require("jsonwebtoken");
const User = require("../models/User");

const doctorAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check token
    if (
      !authHeader ||
      !authHeader.startsWith("Bearer ")
    ) {
      return res.status(401).json({
        success: false,
        message: "Authorization token missing",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    // Verify JWT
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    console.log("Doctor JWT:", decoded);

    // Find user
    const user = await User.findById(
      decoded.id
    ).select("-password");

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    // Doctor only
    if (user.role !== "doctor") {
      return res.status(403).json({
        success: false,
        message: "Doctor access only",
      });
    }

    console.log("Authenticated Doctor:", {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    // Attach user
    req.user = user;

    next();

  } catch (error) {
    console.error(
      "Doctor Auth Error:",
      error.message
    );

    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

module.exports = doctorAuth;
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const doctorAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    console.log("========== DOCTOR AUTH ==========");
    console.log("Authorization header exists:", !!authHeader);

    // Check token
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
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

    // Get user ID from token
    const userId =
      decoded.id ||
      decoded._id ||
      decoded.userId;

    console.log("User ID from JWT:", userId);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "User ID missing from token",
      });
    }

    // Find user
    const user = await User.findById(userId)
      .select("-password");

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

    console.log("req.user._id:", req.user._id);
    console.log("================================");

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
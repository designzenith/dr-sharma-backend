const jwt = require("jsonwebtoken");
const User = require("../models/User");

const auth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // Check Authorization header
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No valid token provided",
      });
    }

    // Extract token
    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Invalid token",
      });
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    console.log("Decoded JWT:", decoded);  

    // Support both id and _id (most common issue)
    const userId = decoded.id || decoded._id || decoded.userId;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Invalid token payload",
      });
    }

    // Find user
    const user = await User.findById(userId).select("-password");

    if (!user) {
      console.log("User not found for ID:", userId);
      return res.status(401).json({
        success: false,
        message: "User not found",
      });
    }

    console.log("Authenticated User:", {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    });

    // Attach user to request
    req.user = user;

    next();
  } catch (error) {
    console.error("AUTH ERROR:", error.message);

    return res.status(401).json({
      success: false,
      message: "Unauthorized - " + error.message,
    });
  }
};

module.exports = auth;
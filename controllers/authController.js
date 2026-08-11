const User = require("../models/User");
const jwt = require("jsonwebtoken");

// =====================================================
// ADMIN EMAIL
// =====================================================

const ADMIN_EMAIL = "devyaniverma5@gmail.com";

// =====================================================
// Generate JWT
// =====================================================

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
};

// =====================================================
// Register
// =====================================================

const register = async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phone,
      role = "patient",
    } = req.body;

    // -------------------------------------------------
    // Validate required fields
    // -------------------------------------------------

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required",
      });
    }

    // -------------------------------------------------
    // Normalize email
    // -------------------------------------------------

    const normalizedEmail = email.toLowerCase().trim();

    // -------------------------------------------------
    // Validate role
    // -------------------------------------------------

    const allowedRoles = [
      "patient",
      "doctor",
      "admin",
    ];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user role",
      });
    }

    // -------------------------------------------------
    // ADMIN RESTRICTION
    // Only devyaniverma5@gmail.com can register as admin
    // -------------------------------------------------

    if (
      role === "admin" &&
      normalizedEmail !== ADMIN_EMAIL
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Only the authorized admin email can register as admin.",
      });
    }

    // -------------------------------------------------
    // If admin email is used, force admin role
    // -------------------------------------------------

    let finalRole = role;

    if (normalizedEmail === ADMIN_EMAIL) {
      finalRole = "admin";
    }

    // -------------------------------------------------
    // Check existing user
    // -------------------------------------------------

    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User already exists",
      });
    }

    // -------------------------------------------------
    // Create user
    // -------------------------------------------------

    const user = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      password,
      phone,
      role: finalRole,
    });

    // -------------------------------------------------
    // Generate JWT
    // -------------------------------------------------

    const token = generateToken(user);

    // -------------------------------------------------
    // Response
    // -------------------------------------------------

    return res.status(201).json({
      success: true,
      message: "User registered successfully",

      token,

      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("REGISTER ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// Login
// =====================================================

const login = async (req, res) => {
  try {
    const {
      email,
      password,
    } = req.body;

    // -------------------------------------------------
    // Validate input
    // -------------------------------------------------

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    // -------------------------------------------------
    // Normalize email
    // -------------------------------------------------

    const normalizedEmail = email.toLowerCase().trim();

    // -------------------------------------------------
    // Find user
    // -------------------------------------------------

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // -------------------------------------------------
    // ADMIN SECURITY CHECK
    // -------------------------------------------------

    if (
      user.role === "admin" &&
      normalizedEmail !== ADMIN_EMAIL
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized admin account",
      });
    }

    // -------------------------------------------------
    // Compare password
    // -------------------------------------------------

    const isMatch = await user.comparePassword(
      password
    );

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // -------------------------------------------------
    // Generate JWT
    // -------------------------------------------------

    const token = generateToken(user);

    // -------------------------------------------------
    // Response
    // -------------------------------------------------

    return res.status(200).json({
      success: true,
      message: "Login successful",

      token,

      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
      },
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// =====================================================
// Export
// =====================================================

module.exports = {
  register,
  login,
};
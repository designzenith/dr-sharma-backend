const crypto = require("crypto");
const bcrypt = require("bcryptjs"); // assume you already have this (used by User model)
const User = require("../models/User");
const RegistrationOTP = require("../models/RegistrationOTP");
const jwt = require("jsonwebtoken");
const transporter = require("../utils/mailer");


// =====================================================
// ADMIN EMAIL (prefer environment variable)
// =====================================================
const ADMIN_EMAIL = (
  process.env.ADMIN_EMAIL || "devyaniverma5@gmail.com"
).toLowerCase();

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
    },
  );
};

// =====================================================
// Generate 6-digit OTP (cryptographically secure)
// =====================================================
const generateOTP = () => {
  return crypto.randomInt(100000, 1000000).toString(); // 100000–999999
};

// =====================================================
// Hash OTP before saving
// =====================================================
const hashOTP = async (otp) => {
  return bcrypt.hash(otp, 10);
};

// =====================================================
// REGISTER
// =====================================================
// const register = async (req, res) => {
//   try {
//     const { name, email, password, phone, role = "patient" } = req.body;

//     if (!name || !email || !password) {
//       return res.status(400).json({
//         success: false,
//         message: "Name, email and password are required",
//       });
//     }

//     if (password.length < 6) {
//       return res.status(400).json({
//         success: false,
//         message: "Password must be at least 6 characters",
//       });
//     }

//     const normalizedEmail = email.toLowerCase().trim();
//     const allowedRoles = ["patient", "doctor", "admin"];

//     if (!allowedRoles.includes(role)) {
//       return res.status(400).json({
//         success: false,
//         message: "Invalid user role",
//       });
//     }

//     // Only the authorized admin email can become admin
//     if (role === "admin" && normalizedEmail !== ADMIN_EMAIL) {
//       return res.status(403).json({
//         success: false,
//         message: "Only the authorized admin email can register as admin.",
//       });
//     }

//     // Force admin role for the admin email
//     const finalRole = normalizedEmail === ADMIN_EMAIL ? "admin" : role;

//     const existingUser = await User.findOne({ email: normalizedEmail });
//     if (existingUser) {
//       return res.status(400).json({
//         success: false,
//         message: "User already exists",
//       });
//     }

//     const user = await User.create({
//       name: name.trim(),
//       email: normalizedEmail,
//       password, // hashed by pre-save hook
//       phone,
//       role: finalRole,
//     });

//     const token = generateToken(user);

//     return res.status(201).json({
//       success: true,
//       message: "User registered successfully",
//       token,
//       user: {
//         id: user._id,
//         _id: user._id,
//         name: user.name,
//         email: user.email,
//         phone: user.phone,
//         role: user.role,
//       },
//     });
//   } catch (error) {
//     console.error("REGISTER ERROR:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Registration failed",
//     });
//   }
// };
// =====================================================
// REGISTER - SEND REGISTRATION OTP
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

    // =================================================
    // VALIDATION
    // =================================================

    if (
      !name ||
      !email ||
      !password ||
      !phone
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, mobile number and password are required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message:
          "Password must be at least 6 characters.",
      });
    }

    // =================================================
    // NORMALIZE
    // =================================================

    const normalizedEmail =
      email.toLowerCase().trim();

    const normalizedPhone =
      phone.toString().replace(/\D/g, "");

    // =================================================
    // MOBILE VALIDATION
    // =================================================

    if (!/^[0-9]{10}$/.test(normalizedPhone)) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid 10-digit mobile number.",
      });
    }

    // =================================================
    // ROLE VALIDATION
    // =================================================

    const allowedRoles = [
      "patient",
      "doctor",
      "admin",
    ];

    if (!allowedRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user role.",
      });
    }

    // =================================================
    // ADMIN SECURITY
    // =================================================

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

    const finalRole =
      normalizedEmail === ADMIN_EMAIL
        ? "admin"
        : role;

    // =================================================
    // CHECK EMAIL UNIQUE
    // =================================================

    const existingEmailUser =
      await User.findOne({
        email: normalizedEmail,
      });

    if (existingEmailUser) {
      return res.status(400).json({
        success: false,
        message:
          "Email address is already registered.",
      });
    }

    // =================================================
    // CHECK MOBILE UNIQUE
    // =================================================

    const existingPhoneUser =
      await User.findOne({
        phone: normalizedPhone,
      });

    if (existingPhoneUser) {
      return res.status(400).json({
        success: false,
        message:
          "Mobile number is already registered.",
      });
    }

    // =================================================
    // REMOVE OLD PENDING REGISTRATION
    // =================================================

    await RegistrationOTP.deleteMany({
      $or: [
        { email: normalizedEmail },
        { phone: normalizedPhone },
      ],
    });

    // =================================================
    // GENERATE OTP
    // =================================================

    const otp = generateOTP();

    const otpExpires = new Date(
      Date.now() + 10 * 60 * 1000
    );

    // =================================================
    // HASH PASSWORD
    // =================================================

    const hashedPassword =
      await bcrypt.hash(password, 10);

    // =================================================
    // HASH OTP
    // =================================================

    const hashedOTP =
      await hashOTP(otp);

    // =================================================
    // SAVE TEMPORARY REGISTRATION
    // =================================================

    await RegistrationOTP.create({
      name: name.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      password: hashedPassword,
      role: finalRole,
      otp: hashedOTP,
      otpExpires,
    });

    // =================================================
    // SEND OTP EMAIL
    // =================================================

    await transporter.sendMail({
      from: `"Clinic" <${process.env.EMAIL_USER}>`,
      to: normalizedEmail,
      subject: "Verify Your Clinic Account",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e5e7eb; border-radius: 16px;">

          <h2 style="color:#2563eb;">
            Verify Your Clinic Account
          </h2>

          <p>
            Hello ${name.trim()},
          </p>

          <p>
            Thank you for creating an account with Clinic.
            Please use the OTP below to verify your email address.
          </p>

          <div style="
            margin: 25px 0;
            padding: 20px;
            background: #eff6ff;
            border-radius: 12px;
            text-align: center;
          ">
            <span style="
              font-size: 32px;
              font-weight: bold;
              letter-spacing: 8px;
              color: #2563eb;
            ">
              ${otp}
            </span>
          </div>

          <p>
            This OTP is valid for
            <strong>10 minutes</strong>.
          </p>

          <p style="color:#64748b;">
            If you did not create this account,
            please ignore this email.
          </p>

          <hr style="
            border: none;
            border-top: 1px solid #e5e7eb;
            margin: 25px 0;
          " />

          <p style="
            font-size: 12px;
            color: #94a3b8;
          ">
            🔒 Your information is securely protected.
          </p>

        </div>
      `,
    });

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(200).json({
      success: true,
      message:
        "OTP has been sent to your email address.",
      email: normalizedEmail,
    });

  } catch (error) {
    console.error(
      "REGISTER OTP ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to start registration. Please try again.",
    });
  }
};

// =====================================================
// NORMAL LOGIN
// =====================================================
// const login = async (req, res) => {
//   try {
//     const { email, password } = req.body;

//     if (!email || !password) {
//       return res.status(400).json({
//         success: false,
//         message: "Email and password are required",
//       });
//     }

//     const normalizedEmail = email.toLowerCase().trim();

//     const user = await User.findOne({ email: normalizedEmail });
//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: "Invalid email or password",
//       });
//     }

//     // Extra safety: prevent rogue admin accounts
//     if (user.role === "admin" && normalizedEmail !== ADMIN_EMAIL) {
//       return res.status(403).json({
//         success: false,
//         message: "Unauthorized admin account",
//       });
//     }

//     const isMatch = await user.comparePassword(password);
//     if (!isMatch) {
//       return res.status(401).json({
//         success: false,
//         message: "Invalid email or password",
//       });
//     }

//     const token = generateToken(user);

//     return res.status(200).json({
//       success: true,
//       message: "Login successful",
//       token,
//       user: {
//         id: user._id,
//         _id: user._id,
//         name: user.name,
//         email: user.email,
//         phone: user.phone,
//         role: user.role,
//       },
//     });
//   } catch (error) {
//     console.error("LOGIN ERROR:", error);
//     return res.status(500).json({
//       success: false,
//       message: error.message || "Login failed",
//     });
//   }
// };
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // IMPORTANT: select password because it has select: false
    const user = await User.findOne({ email: normalizedEmail }).select(
      "+password",
    );

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Admin security check
    if (user.role === "admin" && normalizedEmail !== ADMIN_EMAIL) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized admin account",
      });
    }

    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    const token = generateToken(user);

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
      message: error.message || "Login failed",
    });
  }
};
// =====================================================
// SEND LOGIN OTP
// =====================================================
const sendLoginOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email address.",
      });
    }

    if (user.role === "admin" && normalizedEmail !== ADMIN_EMAIL) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized admin account",
      });
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    user.loginOtp = await hashOTP(otp);
    user.loginOtpExpires = otpExpires;
    await user.save();

    await transporter.sendMail({
      from: `"Clinic" <${process.env.EMAIL_USER}>`,
      to: normalizedEmail,
      subject: "Your Clinic Login OTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e5e7eb; border-radius: 16px;">
          <h2 style="color:#2563eb;">Clinic Login Verification</h2>
          <p>Hello ${user.name || "User"},</p>
          <p>Use the following OTP to login to your Clinic account:</p>
          <div style="margin: 25px 0; padding: 20px; background: #eff6ff; border-radius: 12px; text-align: center;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb;">${otp}</span>
          </div>
          <p>This OTP is valid for <strong>10 minutes</strong>.</p>
          <p style="color:#64748b;">If you did not request this login OTP, please ignore this email.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;" />
          <p style="font-size: 12px; color: #94a3b8;">🔒 Your information is securely protected.</p>
        </div>
      `,
    });

    return res.status(200).json({
      success: true,
      message: "Login OTP has been sent to your email address.",
    });
  } catch (error) {
    console.error("SEND LOGIN OTP ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to send login OTP. Please try again.",
    });
  }
};

// =====================================================
// VERIFY LOGIN OTP
// =====================================================
const verifyLoginOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanOtp = otp.toString().trim();

    if (!/^\d{6}$/.test(cleanOtp)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 6-digit OTP.",
      });
    }

    // Select the hidden OTP fields
    const user = await User.findOne({ email: normalizedEmail }).select(
      "+loginOtp +loginOtpExpires",
    );

    // ========== DEBUG LOGS (put them here) ==========
    console.log("===== DEBUG =====");
    console.log("Email:", normalizedEmail);
    console.log("User found:", !!user);
    console.log("loginOtp:", user?.loginOtp);
    console.log("loginOtpExpires:", user?.loginOtpExpires);
    console.log("=================");
    // ================================================

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (!user.loginOtp || !user.loginOtpExpires) {
      return res.status(400).json({
        success: false,
        message: "No login OTP found. Please request a new OTP.",
      });
    }

    if (user.loginOtpExpires < new Date()) {
      user.loginOtp = null;
      user.loginOtpExpires = null;
      await user.save();

      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new OTP.",
      });
    }

    const isValid = await bcrypt.compare(cleanOtp, user.loginOtp);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP. Please try again.",
      });
    }

    // Admin safety check
    if (user.role === "admin" && normalizedEmail !== ADMIN_EMAIL) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized admin account",
      });
    }

    // Clear OTP after successful use
    user.loginOtp = null;
    user.loginOtpExpires = null;
    await user.save();

    const token = generateToken(user);

    return res.status(200).json({
      success: true,
      message: "OTP login successful",
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
    console.error("VERIFY LOGIN OTP ERROR:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Unable to verify login OTP.",
    });
  }
};
// =====================================================
// FORGOT PASSWORD
// =====================================================
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Email is required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No account found with this email address.",
      });
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);

    user.resetPasswordOTP = await hashOTP(otp);
    user.resetPasswordOTPExpires = otpExpires;
    await user.save();

    await transporter.sendMail({
      from: `"Clinic" <${process.env.EMAIL_USER}>`,
      to: normalizedEmail,
      subject: "Password Reset OTP",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 30px; border: 1px solid #e5e7eb; border-radius: 16px;">
          <h2 style="color:#2563eb;">Reset Your Password</h2>
          <p>Hello ${user.name || "User"},</p>
          <p>We received a request to reset your Clinic password.</p>
          <div style="margin: 25px 0; padding: 20px; background: #eff6ff; border-radius: 12px; text-align: center;">
            <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #2563eb;">${otp}</span>
          </div>
          <p>This OTP is valid for <strong>10 minutes</strong>.</p>
          <p style="color:#64748b;">If you did not request a password reset, please ignore this email.</p>
        </div>
      `,
    });

    return res.status(200).json({
      success: true,
      message: "Password reset OTP has been sent to your email.",
    });
  } catch (error) {
    console.error("FORGOT PASSWORD ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to send password reset OTP.",
    });
  }
};

// =====================================================
// VERIFY FORGOT PASSWORD OTP
// =====================================================
const verifyForgotPasswordOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Email and OTP are required",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanOtp = otp.toString().trim();

    if (!/^\d{6}$/.test(cleanOtp)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid 6-digit OTP.",
      });
    }

    // IMPORTANT: select the hidden OTP fields
    const user = await User.findOne({ email: normalizedEmail }).select(
      "+resetPasswordOTP +resetPasswordOTPExpires",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (!user.resetPasswordOTP || !user.resetPasswordOTPExpires) {
      return res.status(400).json({
        success: false,
        message: "No password reset OTP found. Please request a new OTP.",
      });
    }

    if (user.resetPasswordOTPExpires < new Date()) {
      user.resetPasswordOTP = null;
      user.resetPasswordOTPExpires = null;
      await user.save();

      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new OTP.",
      });
    }

    const isValid = await bcrypt.compare(cleanOtp, user.resetPasswordOTP);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP. Please try again.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "OTP verified successfully.",
    });
  } catch (error) {
    console.error("VERIFY FORGOT PASSWORD OTP ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to verify OTP.",
    });
  }
};

// =====================================================
// RESET PASSWORD
// =====================================================
const resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password) {
      return res.status(400).json({
        success: false,
        message: "Email, OTP and password are required",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must contain at least 6 characters.",
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const cleanOtp = otp.toString().trim();

    // IMPORTANT: select the hidden OTP fields
    const user = await User.findOne({ email: normalizedEmail }).select(
      "+resetPasswordOTP +resetPasswordOTPExpires",
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    if (!user.resetPasswordOTP || !user.resetPasswordOTPExpires) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired OTP.",
      });
    }

    if (user.resetPasswordOTPExpires < new Date()) {
      user.resetPasswordOTP = null;
      user.resetPasswordOTPExpires = null;
      await user.save();

      return res.status(400).json({
        success: false,
        message: "OTP has expired. Please request a new OTP.",
      });
    }

    const isValid = await bcrypt.compare(cleanOtp, user.resetPasswordOTP);
    if (!isValid) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP.",
      });
    }

    // Update password
    user.password = password;
    user.resetPasswordOTP = null;
    user.resetPasswordOTPExpires = null;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password reset successfully.",
    });
  } catch (error) {
    console.error("RESET PASSWORD ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to reset password.",
    });
  }
};
// =====================================================
// CHANGE PASSWORD (for logged-in users)
// =====================================================
// const changePassword = async (req, res) => {
//   try {
//     const { currentPassword, newPassword } = req.body;

//     if (!currentPassword || !newPassword) {
//       return res.status(400).json({
//         success: false,
//         message: "Current password and new password are required",
//       });
//     }

//     if (newPassword.length < 6) {
//       return res.status(400).json({
//         success: false,
//         message: "New password must be at least 6 characters",
//       });
//     }

//     // req.user is set by the protect middleware
//     const user = await User.findById(req.user.id);
//     if (!user) {
//       return res.status(404).json({
//         success: false,
//         message: "User not found",
//       });
//     }

//     // Verify current password
//     const isMatch = await user.comparePassword(currentPassword);
//     if (!isMatch) {
//       return res.status(401).json({
//         success: false,
//         message: "Current password is incorrect",
//       });
//     }

//     // Update password (pre-save hook will hash it)
//     user.password = newPassword;
//     await user.save();

//     return res.status(200).json({
//       success: true,
//       message: "Password changed successfully",
//     });
//   } catch (error) {
//     console.error("CHANGE PASSWORD ERROR:", error);
//     return res.status(500).json({
//       success: false,
//       message: "Unable to change password",
//     });
//   }
// };
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters",
      });
    }

    // IMPORTANT: select password because it has select: false
    const user = await User.findById(req.user.id).select("+password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Update password (pre-save hook will hash it)
    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Unable to change password",
    });
  }
};
// =====================================================
// VERIFY REGISTER OTP
// =====================================================


const verifyRegisterOTP = async (req, res) => {
  try {
    const {
      email,
      otp,
    } = req.body;

    // =================================================
    // VALIDATION
    // =================================================

    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message:
          "Email and OTP are required.",
      });
    }

    const normalizedEmail =
      email.toLowerCase().trim();

    const cleanOtp =
      otp.toString().trim();

    if (!/^\d{6}$/.test(cleanOtp)) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid 6-digit OTP.",
      });
    }

    // =================================================
    // FIND TEMPORARY REGISTRATION
    // =================================================

    const registration =
      await RegistrationOTP.findOne({
        email: normalizedEmail,
      });

    if (!registration) {
      return res.status(400).json({
        success: false,
        message:
          "Registration session not found. Please register again.",
      });
    }

    // =================================================
    // CHECK EXPIRY
    // =================================================

    if (
      registration.otpExpires <
      new Date()
    ) {
      await RegistrationOTP.deleteOne({
        _id: registration._id,
      });

      return res.status(400).json({
        success: false,
        message:
          "OTP has expired. Please register again.",
      });
    }

    // =================================================
    // VERIFY OTP
    // =================================================

    const isValidOTP =
      await bcrypt.compare(
        cleanOtp,
        registration.otp
      );

    if (!isValidOTP) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid OTP. Please try again.",
      });
    }

    // =================================================
    // FINAL DUPLICATE CHECK
    // =================================================

    const existingEmailUser =
      await User.findOne({
        email: registration.email,
      });

    if (existingEmailUser) {
      await RegistrationOTP.deleteOne({
        _id: registration._id,
      });

      return res.status(400).json({
        success: false,
        message:
          "Email address is already registered.",
      });
    }

    const existingPhoneUser =
      await User.findOne({
        phone: registration.phone,
      });

    if (existingPhoneUser) {
      await RegistrationOTP.deleteOne({
        _id: registration._id,
      });

      return res.status(400).json({
        success: false,
        message:
          "Mobile number is already registered.",
      });
    }

    // =================================================
    // CREATE ACTUAL USER
    // =================================================
    //
    // Password is already bcrypt hashed in the
    // temporary registration document.
    //
    // We use collection.insertOne() here to prevent
    // the User pre-save hook from hashing the password
    // for the second time.
    // =================================================

    const userData = {
      name: registration.name,
      email: registration.email,
      phone: registration.phone,
      password: registration.password,
      role: registration.role,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const insertResult =
      await User.collection.insertOne(
        userData
      );

    const user =
      await User.findById(
        insertResult.insertedId
      );

    if (!user) {
      return res.status(500).json({
        success: false,
        message:
          "Account creation failed.",
      });
    }

    // =================================================
    // DELETE TEMPORARY REGISTRATION
    // =================================================

    await RegistrationOTP.deleteOne({
      _id: registration._id,
    });

    // =================================================
    // GENERATE LOGIN TOKEN
    // =================================================

    const token =
      generateToken(user);

    // =================================================
    // RESPONSE
    // =================================================

    return res.status(201).json({
      success: true,
      message:
        "Account created successfully.",
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
    console.error(
      "VERIFY REGISTER OTP ERROR:",
      error
    );

    // Handle duplicate index errors
    if (error.code === 11000) {
      const duplicateField =
        Object.keys(
          error.keyPattern || {}
        )[0];

      if (duplicateField === "email") {
        return res.status(400).json({
          success: false,
          message:
            "Email address is already registered.",
        });
      }

      if (duplicateField === "phone") {
        return res.status(400).json({
          success: false,
          message:
            "Mobile number is already registered.",
        });
      }
    }

    return res.status(500).json({
      success: false,
      message:
        "Unable to verify registration OTP.",
    });
  }
};
// =====================================================
// EXPORT
// =====================================================
module.exports = {
  register,
  login,
  sendLoginOTP,
  verifyLoginOTP,
  forgotPassword,
  verifyForgotPasswordOTP,
  resetPassword,
  changePassword,
  verifyRegisterOTP,
};

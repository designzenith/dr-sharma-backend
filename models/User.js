const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    // ==========================================
    // Name
    // ==========================================
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },

    // ==========================================
    // Email
    // ==========================================
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },

    // ==========================================
    // Password
    // ==========================================
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // don't return password by default
    },

    // ==========================================
    // Role
    // ==========================================
    role: {
      type: String,
      enum: ["patient", "doctor", "admin"],
      default: "patient",
    },

    // ==========================================
    // Phone
    // ==========================================
    phone: {
      type: String,
      required: [true, "Mobile number is required"],
      unique: true,
      trim: true,
    },
    // ==========================================
    // FORGOT PASSWORD OTP (hashed)
    // ==========================================
    resetPasswordOTP: {
      type: String,
      default: null,
      select: false,
    },

    resetPasswordOTPExpires: {
      type: Date,
      default: null,
      select: false,
    },

    // ==========================================
    // LOGIN OTP (hashed)
    // ==========================================
    loginOtp: {
      type: String,
      default: null,
      select: false,
    },

    loginOtpExpires: {
      type: Date,
      default: null,
      select: false,
    },
    registrationOTP: {
      type: String,
      default: null,
      select: false,
    },

    registrationOTPExpires: {
      type: Date,
      default: null,
      select: false,
    },
  },
  {
    timestamps: true,
  },
);

// ==========================================
// HASH PASSWORD BEFORE SAVE
// ==========================================
userSchema.pre("save", async function () {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(this.password, 10);
});

// ==========================================
// COMPARE PASSWORD
// ==========================================
userSchema.methods.comparePassword = async function (candidatePassword) {
  // Because password has select: false, we need to make sure it is available
  // (this works when the document was loaded with .select('+password'))
  return await bcrypt.compare(candidatePassword, this.password);
};

// ==========================================
// EXPORT
// ==========================================
module.exports = mongoose.model("User", userSchema);

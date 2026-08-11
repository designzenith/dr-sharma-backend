const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  // ==========================================
  // Name
  // ==========================================

  name: {
    type: String,
    required: true,
    trim: true,
  },

  // ==========================================
  // Email
  // ==========================================

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },

  // ==========================================
  // Password
  // ==========================================

  password: {
    type: String,
    required: true,
    minlength: 6,
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
    trim: true,
  },

  // ==========================================
  // Created At
  // ==========================================

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// ==========================================
// Hash Password Before Saving
// ==========================================

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  this.password = await bcrypt.hash(
    this.password,
    10
  );
});

// ==========================================
// Compare Password
// ==========================================

userSchema.methods.comparePassword = async function (
  candidatePassword
) {
  return await bcrypt.compare(
    candidatePassword,
    this.password
  );
};

module.exports = mongoose.model(
  "User",
  userSchema
);
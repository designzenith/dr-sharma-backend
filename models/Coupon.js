const mongoose = require("mongoose");

// =====================================================
// COUPON SCHEMA
// =====================================================

const couponSchema = new mongoose.Schema(
  {
    // ===================================================
    // COUPON CODE
    // ===================================================

    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    // ===================================================
    // COUPON TYPE
    // ===================================================

    couponType: {
      type: String,
      enum: ["NewUser", "Festival", "General"],
      default: "General",
    },

    // ===================================================
    // COUPON DESCRIPTION
    // ===================================================

    description: {
      type: String,
      default: "",
      trim: true,
    },

    // ===================================================
    // DISCOUNT TYPE
    // ===================================================

    discountType: {
      type: String,
      enum: ["Percentage", "Fixed"],
      required: true,
    },

    // ===================================================
    // DISCOUNT VALUE
    // ===================================================

    discount: {
      type: Number,
      required: true,
      min: 0,
    },

    // ===================================================
    // MINIMUM APPOINTMENT AMOUNT
    // ===================================================

    minAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ===================================================
    // MAXIMUM DISCOUNT
    // ===================================================

    maxDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ===================================================
    // MAXIMUM TOTAL USAGE
    // ===================================================

    usageLimit: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ===================================================
    // TOTAL USED COUNT
    // ===================================================

    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ===================================================
    // EXPIRY DATE
    // ===================================================

    expiryDate: {
      type: Date,
      required: true,
    },

    // ===================================================
    // STATUS
    // ===================================================

    status: {
      type: String,
      enum: ["Active", "Expired", "Inactive"],
      default: "Active",
    },
  },
  {
    timestamps: true,
  }
);

// =====================================================
// NORMALIZE COUPON CODE
// =====================================================

couponSchema.pre("save", function () {
  if (this.code) {
    this.code = this.code.trim().toUpperCase();
  }
});

// =====================================================
// MODEL
// =====================================================

module.exports = mongoose.model("Coupon", couponSchema);
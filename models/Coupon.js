const mongoose = require("mongoose");

// =====================================================
// COUPON SCHEMA
// =====================================================

const couponSchema = new mongoose.Schema(
  {
    // Coupon Code
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },

    // Discount Type
    discountType: {
      type: String,
      enum: ["Percentage", "Fixed"],
      required: true,
    },

    // Discount Value
    discount: {
      type: Number,
      required: true,
      min: 0,
    },

    // Minimum Appointment Amount
    minAmount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Maximum Discount
    maxDiscount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Maximum Usage
    usageLimit: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Used Count
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },

    // Expiry Date
    expiryDate: {
      type: Date,
      required: true,
    },

    // Status
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
const Coupon = require("../models/Coupon");

// =====================================================
// CREATE COUPON
// =====================================================

exports.createCoupon = async (req, res) => {
  try {
    const {
      code,
      discountType,
      discount,
      minAmount,
      maxDiscount,
      usageLimit,
      expiryDate,
      status,
    } = req.body;

    if (!code || !discountType || discount === undefined || !expiryDate) {
      return res.status(400).json({
        success: false,
        message: "Code, discount type, discount and expiry date are required",
      });
    }

    const existingCoupon = await Coupon.findOne({
      code: String(code).trim().toUpperCase(),
    });

    if (existingCoupon) {
      return res.status(400).json({
        success: false,
        message: "Coupon code already exists",
      });
    }

    const coupon = await Coupon.create({
      code: String(code).trim().toUpperCase(),
      discountType,
      discount: Number(discount),
      minAmount: Number(minAmount || 0),
      maxDiscount: Number(maxDiscount || 0),
      usageLimit: Number(usageLimit || 0),
      expiryDate,
      status: status || "Active",
    });

    return res.status(201).json({
      success: true,
      message: "Coupon created successfully",
      coupon,
    });
  } catch (error) {
    console.error("CREATE COUPON ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to create coupon",
      error: error.message,
    });
  }
};


// =====================================================
// GET ALL COUPONS
// =====================================================

exports.getAllCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find()
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: coupons.length,
      coupons,
    });
  } catch (error) {
    console.error("GET COUPONS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch coupons",
      error: error.message,
    });
  }
};


// =====================================================
// GET COUPON BY ID
// =====================================================

exports.getCouponById = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    return res.status(200).json({
      success: true,
      coupon,
    });
  } catch (error) {
    console.error("GET COUPON ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch coupon",
      error: error.message,
    });
  }
};


// =====================================================
// UPDATE COUPON
// =====================================================

exports.updateCoupon = async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (updateData.code) {
      updateData.code = String(updateData.code)
        .trim()
        .toUpperCase();
    }

    if (updateData.discount !== undefined) {
      updateData.discount = Number(updateData.discount);
    }

    if (updateData.minAmount !== undefined) {
      updateData.minAmount = Number(updateData.minAmount);
    }

    if (updateData.maxDiscount !== undefined) {
      updateData.maxDiscount = Number(updateData.maxDiscount);
    }

    if (updateData.usageLimit !== undefined) {
      updateData.usageLimit = Number(updateData.usageLimit);
    }

    const coupon = await Coupon.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Coupon updated successfully",
      coupon,
    });
  } catch (error) {
    console.error("UPDATE COUPON ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update coupon",
      error: error.message,
    });
  }
};


// =====================================================
// DELETE COUPON
// =====================================================

exports.deleteCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findByIdAndDelete(req.params.id);

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    console.error("DELETE COUPON ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete coupon",
      error: error.message,
    });
  }
};


// =====================================================
// VALIDATE COUPON
// =====================================================

exports.validateCoupon = async (req, res) => {
  try {
    const { code, amount } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Coupon code is required",
      });
    }

    const coupon = await Coupon.findOne({
      code: String(code).trim().toUpperCase(),
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Invalid coupon code",
      });
    }

    if (coupon.status !== "Active") {
      return res.status(400).json({
        success: false,
        message: "Coupon is not active",
      });
    }

    if (
      coupon.expiryDate &&
      new Date(coupon.expiryDate) < new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "Coupon has expired",
      });
    }

    if (
      coupon.usageLimit > 0 &&
      coupon.usedCount >= coupon.usageLimit
    ) {
      return res.status(400).json({
        success: false,
        message: "Coupon usage limit reached",
      });
    }

    const originalAmount = Number(amount || 0);

    if (originalAmount < Number(coupon.minAmount || 0)) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount is ₹${coupon.minAmount}`,
      });
    }

    let discountAmount = 0;

    if (coupon.discountType === "Percentage") {
      discountAmount =
        (originalAmount * Number(coupon.discount || 0)) / 100;

      if (
        coupon.maxDiscount > 0 &&
        discountAmount > coupon.maxDiscount
      ) {
        discountAmount = Number(coupon.maxDiscount);
      }
    } else {
      discountAmount = Number(coupon.discount || 0);
    }

    discountAmount = Math.min(
      discountAmount,
      originalAmount
    );

    discountAmount = Number(
      discountAmount.toFixed(2)
    );

    const finalAmount = Number(
      Math.max(
        0,
        originalAmount - discountAmount
      ).toFixed(2)
    );

    return res.status(200).json({
      success: true,
      message: "Coupon applied successfully",
      couponCode: coupon.code,
      originalAmount,
      discountAmount,
      finalAmount,
    });
  } catch (error) {
    console.error("VALIDATE COUPON ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to validate coupon",
      error: error.message,
    });
  }
};


// =====================================================
// INCREMENT COUPON USAGE
// =====================================================

exports.incrementCouponUsage = async (couponCode) => {
  if (!couponCode) return;

  await Coupon.findOneAndUpdate(
    {
      code: String(couponCode).trim().toUpperCase(),
    },
    {
      $inc: {
        usedCount: 1,
      },
    }
  );
};
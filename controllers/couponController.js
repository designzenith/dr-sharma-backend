const Coupon = require("../models/Coupon");
const CouponUsage = require("../models/CouponUsage");
const Appointment = require("../models/Appointment");

// =====================================================
// CREATE COUPON
// =====================================================

exports.createCoupon = async (req, res) => {
  try {
    const {
      code,
      couponType,
      description,
      discountType,
      discount,
      minAmount,
      maxDiscount,
      usageLimit,
      expiryDate,
      status,
    } = req.body;

    if (
      !code ||
      !discountType ||
      discount === undefined ||
      !expiryDate
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Code, discount type, discount and expiry date are required",
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

      couponType: couponType || "General",

      description: description || "",

      discountType,

      discount: Number(discount),

      minAmount: Number(minAmount || 0),

      maxDiscount: Number(maxDiscount || 0),

      usageLimit: Number(usageLimit || 0),

      usedCount: 0,

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
    const coupons = await Coupon.find().sort({
      createdAt: -1,
    });

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
// GET AVAILABLE COUPONS FOR PATIENT
// =====================================================

exports.getAvailableCoupons = async (req, res) => {
  try {
    const patientId = req.user._id;
    const now = new Date();

    // ---------------------------------------------
    // Get active + non-expired coupons
    // ---------------------------------------------

    const coupons = await Coupon.find({
      status: "Active",
      expiryDate: {
        $gte: now,
      },
    }).sort({
      createdAt: -1,
    });

    if (!coupons.length) {
      return res.status(200).json({
        success: true,
        count: 0,
        coupons: [],
      });
    }

    // ---------------------------------------------
    // Find coupons already used by this patient
    // ---------------------------------------------

    const usedCouponIds = await CouponUsage.find({
      patient: patientId,
      coupon: {
        $in: coupons.map((coupon) => coupon._id),
      },
    }).distinct("coupon");

    const usedSet = new Set(
      usedCouponIds.map((id) => String(id))
    );

    // ---------------------------------------------
    // Check if patient already has paid appointment
    // ---------------------------------------------

    const hasPaidAppointment =
      await Appointment.exists({
        patient: patientId,
        paymentStatus: "paid",
      });

    // ---------------------------------------------
    // Filter available coupons
    // ---------------------------------------------

    const availableCoupons = coupons.filter(
      (coupon) => {
        // Patient already used this coupon
        if (
          usedSet.has(String(coupon._id))
        ) {
          return false;
        }

        // Global usage limit reached
        if (
          coupon.usageLimit > 0 &&
          coupon.usedCount >= coupon.usageLimit
        ) {
          return false;
        }

        // New user coupon
        if (
          coupon.couponType === "NewUser" &&
          hasPaidAppointment
        ) {
          return false;
        }

        return true;
      }
    );

    return res.status(200).json({
      success: true,
      count: availableCoupons.length,
      coupons: availableCoupons,
    });
  } catch (error) {
    console.error(
      "GET AVAILABLE COUPONS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message: "Failed to fetch available coupons",
      error: error.message,
    });
  }
};

// =====================================================
// GET COUPON BY ID
// =====================================================

exports.getCouponById = async (req, res) => {
  try {
    const coupon = await Coupon.findById(
      req.params.id
    );

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
    console.error(
      "GET COUPON ERROR:",
      error
    );

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
    const updateData = {
      ...req.body,
    };

    if (updateData.code) {
      updateData.code = String(
        updateData.code
      )
        .trim()
        .toUpperCase();
    }

    if (updateData.discount !== undefined) {
      updateData.discount = Number(
        updateData.discount
      );
    }

    if (updateData.minAmount !== undefined) {
      updateData.minAmount = Number(
        updateData.minAmount
      );
    }

    if (
      updateData.maxDiscount !== undefined
    ) {
      updateData.maxDiscount = Number(
        updateData.maxDiscount
      );
    }

    if (
      updateData.usageLimit !== undefined
    ) {
      updateData.usageLimit = Number(
        updateData.usageLimit
      );
    }

    if (updateData.couponType === "") {
      updateData.couponType = "General";
    }

    if (updateData.description === undefined) {
      delete updateData.description;
    }

    const coupon =
      await Coupon.findByIdAndUpdate(
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
    console.error(
      "UPDATE COUPON ERROR:",
      error
    );

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
    const coupon =
      await Coupon.findByIdAndDelete(
        req.params.id
      );

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Coupon not found",
      });
    }

    // Remove usage records also
    await CouponUsage.deleteMany({
      coupon: coupon._id,
    });

    return res.status(200).json({
      success: true,
      message: "Coupon deleted successfully",
    });
  } catch (error) {
    console.error(
      "DELETE COUPON ERROR:",
      error
    );

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

    const patientId = req.user._id;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Coupon code is required",
      });
    }

    const coupon = await Coupon.findOne({
      code: String(code)
        .trim()
        .toUpperCase(),
    });

    if (!coupon) {
      return res.status(404).json({
        success: false,
        message: "Invalid coupon code",
      });
    }

    // ---------------------------------------------
    // Status
    // ---------------------------------------------

    if (coupon.status !== "Active") {
      return res.status(400).json({
        success: false,
        message: "Coupon is not active",
      });
    }

    // ---------------------------------------------
    // Expiry
    // ---------------------------------------------

    if (
      coupon.expiryDate &&
      new Date(coupon.expiryDate) < new Date()
    ) {
      return res.status(400).json({
        success: false,
        message: "Coupon has expired",
      });
    }

    // ---------------------------------------------
    // Global usage limit
    // ---------------------------------------------

    if (
      coupon.usageLimit > 0 &&
      coupon.usedCount >= coupon.usageLimit
    ) {
      return res.status(400).json({
        success: false,
        message: "Coupon usage limit reached",
      });
    }

    // ---------------------------------------------
    // Check patient already used this coupon
    // ---------------------------------------------

    const alreadyUsed =
      await CouponUsage.exists({
        coupon: coupon._id,
        patient: patientId,
      });

    if (alreadyUsed) {
      return res.status(400).json({
        success: false,
        message:
          "You have already used this coupon.",
      });
    }

    // ---------------------------------------------
    // New User coupon
    // ---------------------------------------------

    if (coupon.couponType === "NewUser") {
      const hasPaidAppointment =
        await Appointment.exists({
          patient: patientId,
          paymentStatus: "paid",
        });

      if (hasPaidAppointment) {
        return res.status(400).json({
          success: false,
          message:
            "This coupon is only available for new users.",
        });
      }
    }

    // ---------------------------------------------
    // Amount
    // ---------------------------------------------

    const originalAmount = Number(
      amount || 0
    );

    if (
      originalAmount <
      Number(coupon.minAmount || 0)
    ) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount is ₹${coupon.minAmount}`,
      });
    }

    // ---------------------------------------------
    // Calculate discount
    // ---------------------------------------------

    let discountAmount = 0;

    if (
      coupon.discountType ===
      "Percentage"
    ) {
      discountAmount =
        (originalAmount *
          Number(coupon.discount || 0)) /
        100;

      if (
        coupon.maxDiscount > 0 &&
        discountAmount >
          coupon.maxDiscount
      ) {
        discountAmount =
          Number(coupon.maxDiscount);
      }
    } else {
      discountAmount = Number(
        coupon.discount || 0
      );
    }

    // Never discount more than original amount
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
        originalAmount -
          discountAmount
      ).toFixed(2)
    );

    return res.status(200).json({
      success: true,
      message:
        "Coupon applied successfully",
      couponCode: coupon.code,
      couponType: coupon.couponType,
      description: coupon.description,
      originalAmount,
      discountAmount,
      finalAmount,
    });
  } catch (error) {
    console.error(
      "VALIDATE COUPON ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to validate coupon",
      error: error.message,
    });
  }
};

// =====================================================
// INCREMENT COUPON USAGE
// Call this AFTER successful payment
// =====================================================

exports.incrementCouponUsage = async (
  couponCode,
  patientId,
  appointmentId = null
) => {
  if (!couponCode || !patientId) {
    return;
  }

  const normalizedCode = String(
    couponCode
  )
    .trim()
    .toUpperCase();

  const coupon = await Coupon.findOne({
    code: normalizedCode,
  });

  if (!coupon) {
    console.error(
      "COUPON NOT FOUND:",
      normalizedCode
    );
    return;
  }

  // ---------------------------------------------
  // Prevent duplicate usage
  // ---------------------------------------------

  const existingUsage =
    await CouponUsage.findOne({
      coupon: coupon._id,
      patient: patientId,
    });

  if (existingUsage) {
    return;
  }

  // ---------------------------------------------
  // Create patient usage record
  // ---------------------------------------------

  try {
    await CouponUsage.create({
      coupon: coupon._id,
      patient: patientId,
      appointment: appointmentId,
      usedAt: new Date(),
    });
  } catch (error) {
    // Unique index protection
    if (error.code === 11000) {
      return;
    }

    throw error;
  }

  // ---------------------------------------------
  // Increase global usage
  // ---------------------------------------------

  await Coupon.findByIdAndUpdate(
    coupon._id,
    {
      $inc: {
        usedCount: 1,
      },
    }
  );
};
const express = require("express");

const router = express.Router();

const adminAuth = require("../middleware/adminAuth");

const {
  getAllPatients,
  getAllPayments,
} = require("../controllers/adminController");

const {
  getAllPrescriptions,
} = require("../controllers/prescriptionController");

const {
  getAllReviews,
} = require("../controllers/reviewController");

const {
  verifyDoctor,
  rejectDoctor,
} = require("../controllers/doctorController");

const {
  createCoupon,
  getAllCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
} = require("../controllers/couponController");


// =====================================================
// ADMIN - PATIENTS
// GET /api/admin/patients
// =====================================================

router.get(
  "/patients",
  adminAuth,
  getAllPatients
);


// =====================================================
// ADMIN - PAYMENTS
// GET /api/admin/payments
// =====================================================

router.get(
  "/payments",
  adminAuth,
  getAllPayments
);


// =====================================================
// ADMIN - PRESCRIPTIONS
// GET /api/admin/prescriptions
// =====================================================

router.get(
  "/prescriptions",
  adminAuth,
  getAllPrescriptions
);


// =====================================================
// ADMIN - REVIEWS
// GET /api/admin/reviews
// =====================================================

router.get(
  "/reviews",
  adminAuth,
  getAllReviews
);


// =====================================================
// ADMIN - DOCTOR VERIFICATION
// =====================================================

router.patch(
  "/doctors/:id/verify",
  adminAuth,
  verifyDoctor
);

router.patch(
  "/doctors/:id/reject",
  adminAuth,
  rejectDoctor
);


// =====================================================
// ADMIN - COUPONS
// =====================================================

// Create coupon
// POST /api/admin/coupons

router.post(
  "/coupons",
  adminAuth,
  createCoupon
);


// Get all coupons
// GET /api/admin/coupons

router.get(
  "/coupons",
  adminAuth,
  getAllCoupons
);


// Get single coupon
// GET /api/admin/coupons/:id

router.get(
  "/coupons/:id",
  adminAuth,
  getCouponById
);


// Update coupon
// PATCH /api/admin/coupons/:id

router.patch(
  "/coupons/:id",
  adminAuth,
  updateCoupon
);


// Delete coupon
// DELETE /api/admin/coupons/:id

router.delete(
  "/coupons/:id",
  adminAuth,
  deleteCoupon
);


module.exports = router;
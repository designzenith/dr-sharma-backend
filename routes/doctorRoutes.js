// const express = require("express");

// const router = express.Router();

// const auth = require("../middleware/auth");

// const {
//   addDoctor,
//   getDoctors,
//   getDoctor,
//   getMyDoctorProfile,
//   updateDoctor,
//   deleteDoctor,
//   getSpecializations,
// } = require("../controllers/doctorController");

// // =====================================================
// // PUBLIC ROUTES
// // =====================================================

// // Get all doctors
// // GET /api/doctors
// router.get("/", getDoctors);


// // Get all specializations
// // GET /api/doctors/specializations
// // MUST be before /:id
// router.get(
//   "/specializations",
//   getSpecializations
// );


// // =====================================================
// // LOGGED-IN DOCTOR PROFILE
// // =====================================================

// // Get my doctor profile
// // GET /api/doctors/me
// // MUST be BEFORE /:id
// router.get(
//   "/me",
//   auth,
//   (req, res, next) => {
//     if (req.user.role !== "doctor") {
//       return res.status(403).json({
//         success: false,
//         message: "Only doctors can access this profile",
//       });
//     }

//     next();
//   },
//   getMyDoctorProfile
// );


// // Create doctor profile
// // POST /api/doctors
// router.post(
//   "/",
//   auth,
//   (req, res, next) => {
//     if (req.user.role !== "doctor") {
//       return res.status(403).json({
//         success: false,
//         message: "Only doctors can create doctor profiles",
//       });
//     }

//     next();
//   },
//   addDoctor
// );


// // Update doctor profile
// // PUT /api/doctors/update
// router.put(
//   "/update",
//   auth,
//   (req, res, next) => {
//     if (req.user.role !== "doctor") {
//       return res.status(403).json({
//         success: false,
//         message: "Only doctors can update doctor profiles",
//       });
//     }

//     next();
//   },
//   updateDoctor
// );


// // Delete doctor profile
// // DELETE /api/doctors/delete
// router.delete(
//   "/delete",
//   auth,
//   (req, res, next) => {
//     if (req.user.role !== "doctor") {
//       return res.status(403).json({
//         success: false,
//         message: "Only doctors can delete doctor profiles",
//       });
//     }

//     next();
//   },
//   deleteDoctor
// );


// // =====================================================
// // GET DOCTOR BY ID
// // =====================================================
// // THIS MUST BE LAST

// // GET /api/doctors/:id
// router.get(
//   "/:id",
//   getDoctor
// );


// module.exports = router;

const express = require("express");
const router = express.Router();

const auth = require("../middleware/auth");
const doctorAuth = require("../middleware/doctorAuth");

const {
  addDoctor,
  getDoctors,
  getDoctor,
  getMyDoctorProfile,
  updateDoctor,
  deleteDoctor,
  getSpecializations,
} = require("../controllers/doctorController");

// ==============================
// PUBLIC
// ==============================

router.get("/", getDoctors);

router.get(
  "/specializations",
  getSpecializations
);

router.get(
  "/:id",
  getDoctor
);

// ==============================
// DOCTOR ONLY
// ==============================

// Create profile
router.post(
  "/",
  doctorAuth,
  addDoctor
);

// Get my profile
router.get(
  "/me",
  doctorAuth,
  getMyDoctorProfile
);

// Update profile
router.put(
  "/update",
  doctorAuth,
  updateDoctor
);

// Delete profile
router.delete(
  "/delete",
  doctorAuth,
  deleteDoctor
);

module.exports = router;
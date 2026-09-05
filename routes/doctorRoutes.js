// const express = require("express");

// const router = express.Router();

// const doctorAuth = require("../middleware/doctorAuth");

// const {
//   addDoctor,
//   getDoctors,
//   getDoctor,
//   getMyDoctorProfile,
//   updateDoctor,
//   updateConsultationType,
//   deleteDoctor,
//   getSpecializations,
// } = require("../controllers/doctorController");

// // =====================================================
// // PUBLIC
// // =====================================================

// // Get all doctors
// // GET /api/doctors

// router.get(
//   "/",
//   getDoctors
// );

// // Get all specializations
// // GET /api/doctors/specializations

// router.get(
//   "/specializations",
//   getSpecializations
// );

// // =====================================================
// // DOCTOR ONLY
// // =====================================================

// // Get logged-in doctor profile
// // GET /api/doctors/me

// router.get(
//   "/me",
//   doctorAuth,
//   getMyDoctorProfile
// );

// // Create doctor profile
// // POST /api/doctors

// router.post(
//   "/",
//   doctorAuth,
//   addDoctor
// );

// // Update complete doctor profile
// // PUT /api/doctors/update

// router.put(
//   "/update",
//   doctorAuth,
//   updateDoctor
// );

// // Update consultation types only
// // PUT /api/doctors/consultation-type

// router.put(
//   "/consultation-type",
//   doctorAuth,
//   updateConsultationType
// );

// // Delete doctor profile
// // DELETE /api/doctors/delete

// router.delete(
//   "/delete",
//   doctorAuth,
//   deleteDoctor
// );
// // =====================================================
// // GET DOCTOR BY ID + Q&A
// // =====================================================

// // Get Common Questions & Answers for a doctor
// // GET /api/doctors/:id/qa
// router.get("/:id/qa", async (req, res) => {
//   try {
//     const doctor = await Doctor.findById(req.params.id);

//     if (!doctor) {
//       return res.status(404).json({ message: "Doctor not found" });
//     }

//     const qa = generateDoctorQA(doctor);
//     res.json({ success: true, qa });
//   } catch (error) {
//     console.error("Error generating Q&A:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// });
// // =====================================================
// // GET DOCTOR BY ID
// // =====================================================

// // MUST BE LAST

// // GET /api/doctors/:id

// router.get(
//   "/:id",
//   getDoctor
// );

// module.exports = router;


const express = require("express");
const router = express.Router();
const doctorAuth = require("../middleware/doctorAuth");

const {
  addDoctor,
  getDoctors,
  getDoctor,
  getMyDoctorProfile,
  updateDoctor,
  updateConsultationType,
  deleteDoctor,
  getSpecializations,
} = require("../controllers/doctorController");

const { generateDoctorQA } = require("../utils/generateDoctorQA");
const Doctor = require("../models/Doctor"); // ← make sure this path is correct

// ====================== PUBLIC ======================
router.get("/", getDoctors);
router.get("/specializations", getSpecializations);

// ====================== DOCTOR ONLY ======================
router.get("/me", doctorAuth, getMyDoctorProfile);
router.post("/", doctorAuth, addDoctor);
router.put("/update", doctorAuth, updateDoctor);
router.put("/consultation-type", doctorAuth, updateConsultationType);
router.delete("/delete", doctorAuth, deleteDoctor);

// ====================== Q&A ROUTE (MUST BE BEFORE /:id) ======================
router.get("/:id/qa", async (req, res) => {
  try {
    console.log("Fetching QA for doctor ID:", req.params.id); // ← debug log

    const doctor = await Doctor.findById(req.params.id).lean();

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const qa = generateDoctorQA(doctor);
    return res.status(200).json({ success: true, qa });
  } catch (error) {
    console.error("QA Error:", error);
    return res.status(500).json({ message: "Server error", error: error.message });
  }
});

// ====================== GET DOCTOR BY ID (MUST BE LAST) ======================
router.get("/:id", getDoctor);

module.exports = router;

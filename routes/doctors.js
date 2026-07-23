const express = require("express");
const router = express.Router();

const {
  addDoctor,
  getDoctors,
  getSpecializations,
  getDoctor,
  updateDoctor,
  deleteDoctor,
} = require("../controllers/doctorController");

// All routes without auth for now
router.get("/", getDoctors);
router.get("/specializations", getSpecializations);
router.get("/:id", getDoctor);

router.post("/", addDoctor);
router.put("/:id", updateDoctor);
router.delete("/:id", deleteDoctor);

module.exports = router;
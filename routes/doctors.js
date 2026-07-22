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

router.post("/", addDoctor);

router.get("/", getDoctors);
router.get("/specializations", getSpecializations);

router.get("/:id", getDoctor);

router.put("/:id", updateDoctor);

router.delete("/:id", deleteDoctor);

module.exports = router;
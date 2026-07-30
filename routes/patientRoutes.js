const express = require("express");
const router = express.Router();

const patientController = require("../controllers/patientController");


// Get all patients
router.get(
    "/",
    patientController.getPatients
);


// Get patient by id
router.get(
    "/:id",
    patientController.getPatient
);


// Add patient
router.post(
    "/",
    patientController.addPatient
);


// Update patient
router.put(
    "/:id",
    patientController.updatePatient
);


// Delete patient
router.delete(
    "/:id",
    patientController.deletePatient
);


module.exports = router;
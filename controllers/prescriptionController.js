const Prescription = require("../models/Prescription");
const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");

// =====================================================
// GET /api/prescriptions/doctor
// =====================================================

exports.getDoctorPrescriptions = async (req, res) => {
  try {
    const doctorUserId = req.user.id || req.user._id;

    const doctor = await Doctor.findOne({
      user: doctorUserId,
    });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    const prescriptions =
      await Prescription.find({
        doctor: doctor._id,
      })
        .populate(
          "patient",
          "name email phone"
        )
        .populate(
          "appointment",
          "appointmentDate appointmentTime consultationType status"
        )
        .sort({
          createdAt: -1,
        })
        .lean();

    const formatted = prescriptions.map(
      (p) => ({
        _id: p._id,

        patientName:
          p.patient?.name ||
          "Patient",

        patientId:
          p.patient?._id ||
          p.patient,

        appointmentId:
          p.appointment?._id ||
          p.appointment,

        diagnosis:
          p.diagnosis || "",

        symptoms:
          p.symptoms || [],

        medicines:
          p.medicines || [],

        advice:
          p.advice || "",

        followUpDate:
          p.followUpDate || null,

        testRecommended:
          p.testRecommended || [],

        prescriptionFile:
          p.prescriptionFile || "",

        status:
          p.status || "Active",

        createdAt:
          p.createdAt,

        updatedAt:
          p.updatedAt,
      })
    );

    return res.status(200).json({
      success: true,
      prescriptions: formatted,
    });
  } catch (error) {
    console.error(
      "getDoctorPrescriptions error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch prescriptions",
    });
  }
};

// =====================================================
// GET /api/prescriptions/:id
// =====================================================

exports.getPrescriptionById = async (
  req,
  res
) => {
  try {
    const prescription =
      await Prescription.findById(
        req.params.id
      )
        .populate(
          "patient",
          "name email phone"
        )
        .populate(
          "doctor",
          "name email"
        )
        .populate(
          "appointment",
          "appointmentDate appointmentTime consultationType status"
        )
        .lean();

    if (!prescription) {
      return res.status(404).json({
        success: false,
        message: "Prescription not found",
      });
    }

    return res.status(200).json({
      success: true,

      prescription: {
        _id: prescription._id,

        patient:
          prescription.patient || null,

        doctor:
          prescription.doctor || null,

        appointment:
          prescription.appointment || null,

        diagnosis:
          prescription.diagnosis || "",

        symptoms:
          prescription.symptoms || [],

        medicines:
          prescription.medicines || [],

        advice:
          prescription.advice || "",

        followUpDate:
          prescription.followUpDate || null,

        testRecommended:
          prescription.testRecommended || [],

        prescriptionFile:
          prescription.prescriptionFile || "",

        status:
          prescription.status || "Active",

        createdAt:
          prescription.createdAt,

        updatedAt:
          prescription.updatedAt,
      },
    });
  } catch (error) {
    console.error(
      "getPrescriptionById error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch prescription",
    });
  }
};

// =====================================================
// POST /api/prescriptions
// CREATE NEW PRESCRIPTION
// =====================================================

exports.createPrescription = async (
  req,
  res
) => {
  try {
    const doctorUserId =
      req.user.id || req.user._id;

    const doctor =
      await Doctor.findOne({
        user: doctorUserId,
      });

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message:
          "Doctor profile not found",
      });
    }

    const {
      patientId,
      appointmentId,
      diagnosis,
      symptoms,
      medicines,
      advice,
      followUpDate,
      testRecommended,
      prescriptionFile,
      status,
    } = req.body;

    // ===============================
    // VALIDATION
    // ===============================

    if (!patientId) {
      return res.status(400).json({
        success: false,
        message: "Patient is required",
      });
    }

    if (!appointmentId) {
      return res.status(400).json({
        success: false,
        message:
          "Appointment is required",
      });
    }

    // ===============================
    // CREATE PRESCRIPTION
    // ===============================

    const prescription =
      await Prescription.create({
        doctor: doctor._id,

        patient: patientId,

        appointment: appointmentId,

        diagnosis:
          diagnosis || "",

        symptoms:
          symptoms || [],

        medicines:
          medicines || [],

        advice:
          advice || "",

        followUpDate:
          followUpDate || null,

        testRecommended:
          testRecommended || [],

        prescriptionFile:
          prescriptionFile || "",

        status:
          status || "Active",
      });

    return res.status(201).json({
      success: true,
      message:
        "Prescription created successfully",
      prescription,
    });
  } catch (error) {
    console.error(
      "createPrescription error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        error.message ||
        "Unable to create prescription",
    });
  }
};

// =====================================================
// GET ALL PRESCRIPTIONS - ADMIN
// GET /api/admin/prescriptions
// =====================================================

exports.getAllPrescriptions = async (
  req,
  res
) => {
  try {
    const prescriptions =
      await Prescription.find()
        .populate(
          "patient",
          "name email phone"
        )
        .populate(
          "doctor",
          "name email"
        )
        .populate(
          "appointment",
          "appointmentDate appointmentTime consultationType status"
        )
        .sort({
          createdAt: -1,
        })
        .lean();

    const formatted =
      prescriptions.map(
        (prescription) => ({
          _id:
            prescription._id,

          // =========================
          // PATIENT
          // =========================

          patient:
            prescription.patient
              ? {
                  _id:
                    prescription
                      .patient._id,

                  name:
                    prescription
                      .patient.name ||
                    "Patient",

                  email:
                    prescription
                      .patient.email ||
                    "",

                  phone:
                    prescription
                      .patient.phone ||
                    "",
                }
              : null,

          // =========================
          // DOCTOR
          // =========================

          doctor:
            prescription.doctor
              ? {
                  _id:
                    prescription
                      .doctor._id,

                  name:
                    prescription
                      .doctor.name ||
                    "Doctor",

                  email:
                    prescription
                      .doctor.email ||
                    "",
                }
              : null,

          // =========================
          // APPOINTMENT
          // =========================

          appointment:
            prescription.appointment
              ? {
                  _id:
                    prescription
                      .appointment._id,

                  appointmentDate:
                    prescription
                      .appointment
                      .appointmentDate ||
                    null,

                  appointmentTime:
                    prescription
                      .appointment
                      .appointmentTime ||
                    "",

                  consultationType:
                    prescription
                      .appointment
                      .consultationType ||
                    "",

                  status:
                    prescription
                      .appointment.status ||
                    "",
                }
              : null,

          // =========================
          // PRESCRIPTION
          // =========================

          diagnosis:
            prescription.diagnosis ||
            "",

          symptoms:
            prescription.symptoms ||
            [],

          medicines:
            prescription.medicines ||
            [],

          advice:
            prescription.advice ||
            "",

          followUpDate:
            prescription.followUpDate ||
            null,

          testRecommended:
            prescription.testRecommended ||
            [],

          prescriptionFile:
            prescription.prescriptionFile ||
            "",

          status:
            prescription.status ||
            "Active",

          createdAt:
            prescription.createdAt ||
            null,

          updatedAt:
            prescription.updatedAt ||
            null,
        })
      );

    return res.status(200).json({
      success: true,

      count:
        formatted.length,

      prescriptions:
        formatted,
    });
  } catch (error) {
    console.error(
      "GET ALL PRESCRIPTIONS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch prescriptions",
      error: error.message,
    });
  }
};
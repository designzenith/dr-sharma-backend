const SpecialtyQuestion = require("../models/SpecialtyQuestion");

// =====================================================
// HELPER
// Escape special characters for MongoDB regex
// =====================================================

const escapeRegex = (value = "") => {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};


// =====================================================
// GET ALL QUESTIONS - ADMIN
// =====================================================

const getAllQuestions = async (req, res) => {
  try {
    const questions = await SpecialtyQuestion.find()
      .sort({
        order: 1,
        createdAt: 1,
      })
      .lean();

    return res.status(200).json({
      success: true,
      questions,
    });
  } catch (error) {
    console.error("GET QUESTIONS ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch questions",
      error: error.message,
    });
  }
};


// =====================================================
// CREATE QUESTION - ADMIN
// =====================================================

const createQuestion = async (req, res) => {
  try {
    const {
      label,
      key,
      type,
      options,
      required,
      status,
      order,
      appliesToAll,
      specializations,
    } = req.body;

    // =================================================
    // VALIDATION
    // =================================================

    if (!label?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Question is required",
      });
    }

    if (!key?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Question key is required",
      });
    }

    const questionType = type || "text";

    if (
      ![
        "text",
        "textarea",
        "number",
        "select",
      ].includes(questionType)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid question type",
      });
    }

    // =================================================
    // SELECT OPTIONS
    // =================================================

    let cleanedOptions = [];

    if (questionType === "select") {
      if (
        !Array.isArray(options) ||
        options.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please provide options for select question",
        });
      }

      cleanedOptions = options
        .map((item) => String(item).trim())
        .filter(Boolean);

      if (cleanedOptions.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "Please provide valid options for select question",
        });
      }
    }

    // =================================================
    // SPECIALIZATION SETTINGS
    // =================================================

    const isForAll = appliesToAll === true;

    let cleanedSpecializations = [];

    if (!isForAll) {
      if (
        !Array.isArray(specializations) ||
        specializations.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please select at least one specialization or choose All Specializations",
        });
      }

      cleanedSpecializations = [
        ...new Set(
          specializations
            .map((item) => String(item).trim())
            .filter(Boolean)
        ),
      ];
    }

    // =================================================
    // CHECK DUPLICATE KEY
    // =================================================

    const existingQuestion =
      await SpecialtyQuestion.findOne({
        key: key.trim(),
      });

    if (existingQuestion) {
      return res.status(409).json({
        success: false,
        message:
          "This question key already exists. Please use a different key.",
      });
    }

    // =================================================
    // CREATE QUESTION
    // =================================================

    const question =
      await SpecialtyQuestion.create({
        label: label.trim(),

        key: key.trim(),

        type: questionType,

        options: cleanedOptions,

        required: required === true,

        status: status || "Active",

        order: Number(order) || 0,

        appliesToAll: isForAll,

        specializations: cleanedSpecializations,
      });

    return res.status(201).json({
      success: true,
      message: "Question created successfully",
      question,
    });
  } catch (error) {
    console.error("CREATE QUESTION ERROR:", error);

    // MongoDB duplicate key
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "This question key already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to create question",
      error: error.message,
    });
  }
};


// =====================================================
// UPDATE QUESTION - ADMIN
// =====================================================

const updateQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      label,
      key,
      type,
      options,
      required,
      status,
      order,
      appliesToAll,
      specializations,
    } = req.body;

    // =================================================
    // FIND QUESTION
    // =================================================

    const question =
      await SpecialtyQuestion.findById(id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    // =================================================
    // VALIDATION
    // =================================================

    if (
      label !== undefined &&
      !label.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Question is required",
      });
    }

    const questionType =
      type || question.type;

    if (
      ![
        "text",
        "textarea",
        "number",
        "select",
      ].includes(questionType)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid question type",
      });
    }

    // =================================================
    // SELECT OPTIONS
    // =================================================

    let cleanedOptions = [];

    if (questionType === "select") {
      if (
        !Array.isArray(options) ||
        options.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please provide options for select question",
        });
      }

      cleanedOptions = options
        .map((item) => String(item).trim())
        .filter(Boolean);

      if (cleanedOptions.length === 0) {
        return res.status(400).json({
          success: false,
          message:
            "Please provide valid options for select question",
        });
      }
    }

    // =================================================
    // SPECIALIZATION SETTINGS
    // =================================================

    const isForAll =
      appliesToAll !== undefined
        ? appliesToAll === true
        : question.appliesToAll === true;

    let cleanedSpecializations = [];

    if (!isForAll) {
      const specializationList =
        specializations !== undefined
          ? specializations
          : question.specializations || [];

      if (
        !Array.isArray(specializationList) ||
        specializationList.length === 0
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please select at least one specialization or choose All Specializations",
        });
      }

      cleanedSpecializations = [
        ...new Set(
          specializationList
            .map((item) => String(item).trim())
            .filter(Boolean)
        ),
      ];
    }

    // =================================================
    // KEY
    // =================================================

    const newKey =
      key?.trim() || question.key;

    // =================================================
    // CHECK DUPLICATE KEY
    // =================================================

    const duplicate =
      await SpecialtyQuestion.findOne({
        key: newKey,
        _id: { $ne: id },
      });

    if (duplicate) {
      return res.status(409).json({
        success: false,
        message:
          "This question key already exists. Please use a different key.",
      });
    }

    // =================================================
    // UPDATE
    // =================================================

    question.label =
      label?.trim() || question.label;

    question.key = newKey;

    question.type = questionType;

    question.options = cleanedOptions;

    question.required =
      required !== undefined
        ? required === true
        : question.required;

    question.status =
      status || question.status;

    question.order =
      order !== undefined
        ? Number(order) || 0
        : question.order;

    question.appliesToAll = isForAll;

    question.specializations =
      cleanedSpecializations;

    await question.save();

    return res.status(200).json({
      success: true,
      message: "Question updated successfully",
      question,
    });
  } catch (error) {
    console.error("UPDATE QUESTION ERROR:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message:
          "This question key already exists.",
      });
    }

    return res.status(500).json({
      success: false,
      message: "Failed to update question",
      error: error.message,
    });
  }
};


// =====================================================
// DELETE QUESTION - ADMIN
// =====================================================

const deleteQuestion = async (req, res) => {
  try {
    const { id } = req.params;

    const question =
      await SpecialtyQuestion.findById(id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: "Question not found",
      });
    }

    await question.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Question deleted successfully",
    });
  } catch (error) {
    console.error("DELETE QUESTION ERROR:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete question",
      error: error.message,
    });
  }
};


// =====================================================
// GET ACTIVE QUESTIONS BY SPECIALIZATION
// FRONTEND BOOKING
// =====================================================
//
// Returns:
// 1. Questions marked for ALL specializations
// 2. Questions specifically assigned to this specialization
//
// Example:
//
// Psychiatrist booking
//      ↓
// ALL questions
//      +
// Psychiatrist questions
//
// Dermatologist booking
//      ↓
// ALL questions
//      +
// Dermatologist questions
//
// =====================================================

const getQuestionsBySpecialization = async (
  req,
  res
) => {
  try {
    const specialization = decodeURIComponent(
      req.params.specialization || ""
    ).trim();

    if (!specialization) {
      return res.status(400).json({
        success: false,
        message:
          "Specialization is required",
      });
    }

    const specializationRegex =
      new RegExp(
        `^${escapeRegex(specialization)}$`,
        "i"
      );

    const questions =
      await SpecialtyQuestion.find({
        status: "Active",

        $or: [
          {
            appliesToAll: true,
          },

          {
            specializations:
              specializationRegex,
          },
        ],
      })
        .sort({
          order: 1,
          createdAt: 1,
        })
        .lean();

    return res.status(200).json({
      success: true,
      questions,
    });
  } catch (error) {
    console.error(
      "GET SPECIALTY QUESTIONS ERROR:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch specialty questions",
      error: error.message,
    });
  }
};


// =====================================================
// EXPORT
// =====================================================

module.exports = {
  getAllQuestions,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  getQuestionsBySpecialization,
};
const mongoose = require("mongoose");

const specialtyQuestionSchema = new mongoose.Schema(
  {
    // =====================================================
    // QUESTION
    // =====================================================

    label: {
      type: String,
      required: true,
      trim: true,
    },

    // Unique key used to store patient's answer
    key: {
      type: String,
      required: true,
      trim: true,
    },

    // =====================================================
    // QUESTION TYPE
    // =====================================================

    type: {
      type: String,
      enum: [
        "text",
        "textarea",
        "number",
        "select",
      ],
      default: "text",
    },

    // Used only when type = select
    options: {
      type: [String],
      default: [],
    },

    // =====================================================
    // SPECIALIZATION SETTINGS
    // =====================================================

    // true = question will be shown for ALL specializations
    appliesToAll: {
      type: Boolean,
      default: false,
    },

    // Question can be assigned to one or multiple
    // specializations.
    //
    // Example:
    // ["Psychiatrist", "Dermatologist"]
    //
    // If appliesToAll = true, this can remain empty.
    specializations: {
      type: [String],
      default: [],
    },

    // =====================================================
    // SETTINGS
    // =====================================================

    required: {
      type: Boolean,
      default: false,
    },

    status: {
      type: String,
      enum: ["Active", "Inactive"],
      default: "Active",
    },

    // Question display order
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);


// =====================================================
// INDEX
// =====================================================
//
// Same question key should not be duplicated.
//
// We use key + specializations differently now,
// so there is no old specialization + key index.
//
// =====================================================

specialtyQuestionSchema.index(
  {
    key: 1,
  },
  {
    unique: true,
  }
);


module.exports = mongoose.model(
  "SpecialtyQuestion",
  specialtyQuestionSchema
);
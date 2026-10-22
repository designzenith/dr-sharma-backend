const mongoose = require("mongoose");

const corporateEnquirySchema = new mongoose.Schema(
  {
    organization: {
      type: String,
      required: true,
      trim: true,
    },
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    employees: {
      type: String,
      trim: true,
    },
    hrContact: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CorporateEnquiry", corporateEnquirySchema);
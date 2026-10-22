const express = require("express");
const router = express.Router();

const {
  submitCorporateEnquiry,
  submitContactMessage,
  getAllContacts,
  getAllCorporateEnquiries,
} = require("../controllers/formController");

// ========== PUBLIC ROUTES ==========
router.post("/contact", submitContactMessage);
router.post("/corporate/enquiry", submitCorporateEnquiry);

// ========== ADMIN ROUTES ==========
router.get("/admin/contacts", getAllContacts);
router.get("/admin/corporate-enquiries", getAllCorporateEnquiries);

module.exports = router;
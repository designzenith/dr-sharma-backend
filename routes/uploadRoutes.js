const express = require("express");
const router = express.Router();

const upload = require("../middleware/upload");

const {
    uploadProfileImage,
    uploadDoctorImage,
    uploadDoctorDocuments,
} = require("../controllers/uploadController");


const auth = require("../middleware/auth");


// ======================================
// Upload User Profile Image
// ======================================
router.post(
    "/profile",
    auth,
    upload.single("profileImage"),
    uploadProfileImage
);



// ======================================
// Upload Doctor Profile Image
// ======================================
router.post(
    "/doctor-image",
    auth,
    upload.single("doctorImage"),
    uploadDoctorImage
);



// ======================================
// Upload Doctor Verification Documents
// ======================================
router.post(
    "/doctor-documents",
    auth,

    upload.fields([
        {
            name:"aadhaarFront",
            maxCount:1,
        },

        {
            name:"aadhaarBack",
            maxCount:1,
        },

        {
            name:"panCard",
            maxCount:1,
        },

        {
            name:"medicalLicense",
            maxCount:1,
        },

        {
            name:"degreeCertificate",
            maxCount:1,
        },

        {
            name:"additionalCertificate",
            maxCount:5,
        },

        {
            name:"profilePhoto",
            maxCount:1,
        },
    ]),

    uploadDoctorDocuments
);



module.exports = router;
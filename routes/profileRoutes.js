const express = require("express");
const router = express.Router();

const {
    getProfile,
    updateProfile
} = require("../controllers/profileController");

const auth = require("../middleware/auth");


// Get logged in user profile
router.get(
    "/",
    auth,
    getProfile
);


// Update profile
router.put(
    "/",
    auth,
    updateProfile
);


module.exports = router;
const multer = require("multer");
const fs = require("fs");
const path = require("path");

// ================================
// Create Upload Folders
// ================================
const folders = [
  "uploads/profile",
  "uploads/doctor",
  "uploads/aadhaar",
  "uploads/medical",
  "uploads/certificates",
];

folders.forEach((folder) => {
  const dir = path.join(__dirname, "..", folder);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// ================================
// Storage Configuration
// ================================
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let folder = "uploads/profile"; // default

    switch (file.fieldname) {
      case "profileImage":
        folder = "uploads/profile";
        break;

      case "doctorImage":
        folder = "uploads/doctor";
        break;

      case "aadhaar":
        folder = "uploads/aadhaar";
        break;

      case "medicalLicense":
        folder = "uploads/medical";
        break;

      case "certificate":
        folder = "uploads/certificates";
        break;

      default:
        folder = "uploads/profile";
    }

    cb(null, path.join(__dirname, "..", folder));
  },

  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);

    cb(null, uniqueName);
  },
});

// ================================
// File Type Validation
// ================================
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "application/pdf",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only JPG, PNG, WEBP and PDF files are allowed"), false);
  }
};

// ================================
// Multer Upload Middleware
// ================================
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
});

module.exports = upload;
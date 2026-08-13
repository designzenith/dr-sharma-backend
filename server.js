const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const dns = require("node:dns");

const connectDB = require("./config/db");

// =====================================================
// Environment
// =====================================================

dotenv.config();

// =====================================================
// DNS Fix
// =====================================================

dns.setServers([
  "1.1.1.1",
  "8.8.8.8",
]);

// =====================================================
// App
// =====================================================

const app = express();

const PORT = process.env.PORT || 5000;

// =====================================================
// Database
// =====================================================

connectDB();

// =====================================================
// Middleware
// =====================================================

const allowedOrigins = [
  "http://localhost:3000",
  "https://dr-frontend-azure.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without origin
      // such as Postman/server-to-server
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(
        new Error(
          `CORS blocked for origin: ${origin}`
        )
      );
    },

    credentials: true,
  })
);

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  })
);

// =====================================================
// Health Check
// =====================================================

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Dr. Sharma Backend Running",
  });
});

// =====================================================
// API Routes
// =====================================================

// -----------------------------------------------------
// Authentication
// -----------------------------------------------------

app.use(
  "/api/auth",
  require("./routes/authRoutes")
);

// -----------------------------------------------------
// Doctors
// -----------------------------------------------------

app.use(
  "/api/doctors",
  require("./routes/doctorRoutes")
);

// -----------------------------------------------------
// Patients
// -----------------------------------------------------

app.use(
  "/api/patients",
  require("./routes/patientRoutes")
);

// -----------------------------------------------------
// Appointments
// -----------------------------------------------------

app.use(
  "/api/appointments",
  require("./routes/appointmentRoutes")
);

// -----------------------------------------------------
// Schedule
// -----------------------------------------------------

app.use(
  "/api/schedule",
  require("./routes/scheduleRoutes")
);

// -----------------------------------------------------
// Leaves
// -----------------------------------------------------

app.use(
  "/api/leaves",
  require("./routes/leaveRoutes")
);

// -----------------------------------------------------
// Profile
// -----------------------------------------------------

app.use(
  "/api/profile",
  require("./routes/profileRoutes")
);

// =====================================================
// Upload Routes
// =====================================================

const uploadRoutes = require("./routes/uploadRoutes");

app.use(
  "/api/upload",
  uploadRoutes
);

// =====================================================
// Static Uploads
// =====================================================

app.use(
  "/uploads",
  express.static(
    path.join(__dirname, "uploads")
  )
);

// =====================================================
// 404 Handler
// IMPORTANT:
// Keep this AFTER all API routes.
// =====================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
    path: req.originalUrl,
  });
});

// =====================================================
// Global Error Handler
// =====================================================

const errorHandler = require(
  "./middleware/errorHandler"
);

app.use(errorHandler);

// =====================================================
// Start Server
// =====================================================

app.listen(PORT, () => {
  console.log(
    `🚀 Server running on http://localhost:${PORT}`
  );
});
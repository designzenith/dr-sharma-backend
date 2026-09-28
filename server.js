require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const dns = require("dns");
const path = require("path");
const { Server } = require("socket.io");
const passport = require("passport");

require("dotenv").config();
require("./config/passport");

// =====================================================
// Config / Database
// =====================================================

const connectDB = require("./config/db");

// =====================================================
// App
// =====================================================

const app = express();

const PORT = process.env.PORT || 5000;

// =====================================================
// DNS
// =====================================================

dns.setServers(["1.1.1.1", "8.8.8.8"]);

// =====================================================
// Database
// =====================================================

connectDB();

// =====================================================
// CORS - LOCAL DEVELOPMENT
// =====================================================

const allowedOrigins = [
  "http://localhost:3000",
  "https://www.irenemedics.com",
  "https://dr-frontend-azure.vercel.app",
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests without Origin
    // Example: Postman / server-to-server
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.log("CORS blocked origin:", origin);

    return callback(new Error(`CORS blocked for origin: ${origin}`));
  },

  credentials: true,

  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

  allowedHeaders: ["Content-Type", "Authorization"],
};

app.use(cors(corsOptions));

// =====================================================
// Body Parsers
// =====================================================

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  }),
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

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    ok: true,
    message: "Server is running",
  });
});

// =====================================================
// API ROUTES
// =====================================================

// =====================================================
// API ROUTES
// =====================================================

// Authentication
app.use("/api/auth", require("./routes/authRoutes"));

// Doctors
app.use("/api/doctors", require("./routes/doctorRoutes"));
app.use("/api/earnings", require("./routes/earningsRoutes"));

// Reports
app.use("/api/reports", require("./routes/reportRoutes"));

// Prescriptions
app.use("/api/prescriptions", require("./routes/prescriptionRoutes"));

// Reviews
app.use("/api/reviews", require("./routes/reviewRoutes"));

// Admin
const adminRoutes = require("./routes/adminRoutes");
app.use("/api/admin", adminRoutes);

const couponRoutes = require("./routes/couponRoutes");

app.use("/api/coupons", couponRoutes);

const questionRoutes = require("./routes/questionRoutes");

app.use("/api/admin/questions", questionRoutes);

// Patients
app.use("/api/patients", require("./routes/patientRoutes"));

// Notifications
app.use("/api/notifications", require("./routes/notificationRoutes"));

// Reminder Job
require("./jobs/reminderJob");

// Appointments
const appointmentRoutes = require("./routes/appointmentRoutes"); // path check karo

app.use("/api/appointments", appointmentRoutes);
// cashfreePaymentRoutes
const cashfreePaymentRoutes = require("./routes/cashfreePaymentRoutes");
app.use("/api/cashfree", cashfreePaymentRoutes);
// Schedule
app.use("/api/schedule", require("./routes/scheduleRoutes"));

// Leaves
app.use("/api/leaves", require("./routes/leaveRoutes"));

// Profile
app.use("/api/profile", require("./routes/profileRoutes"));

// Consultation
app.use("/api/consult", require("./routes/consult"));

// Upload
const uploadRoutes = require("./routes/uploadRoutes");
app.use("/api/upload", uploadRoutes);
// =====================================================
// Static Uploads
// =====================================================

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// =====================================================
// HTTP SERVER
// =====================================================

const server = http.createServer(app);

// =====================================================
// SOCKET.IO
// =====================================================

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:3000", "https://www.irenemedics.com"],

    methods: ["GET", "POST"],

    credentials: true,
  },
});

// =====================================================
// Consultation Socket
// =====================================================

const consultationSocket = require("./socket/consultationSocket");

consultationSocket(io);

// =====================================================
// 404 HANDLER
// =====================================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found",
    path: req.originalUrl,
  });
});

// =====================================================
// GLOBAL ERROR HANDLER
// =====================================================

const errorHandler = require("./middleware/errorHandler");

app.use(errorHandler);

// =====================================================
// START SERVER
// =====================================================

server.listen(PORT, "0.0.0.0", () => {
  console.log("========================================");

  console.log(`Backend: http://localhost:${PORT}`);

  console.log(`Health:  http://localhost:${PORT}/health`);

  console.log("Frontend: http://localhost:3000");

  console.log("========================================");
});

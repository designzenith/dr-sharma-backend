// =====================================================
// Load Environment Variables FIRST
// =====================================================

require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const dns = require("dns");
const path = require("path");
const { Server } = require("socket.io");

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
// DNS Fix
// =====================================================

dns.setServers([
  "1.1.1.1",
  "8.8.8.8",
]);

// =====================================================
// Database
// =====================================================

connectDB();

// =====================================================
// CORS
// =====================================================

const allowedOrigins = [
  // Local development
  "http://localhost:3000",
  "http://127.0.0.1:3000",

  // Production - Vercel
  "https://dr-frontend-azure.vercel.app",
];

// =====================================================
// CORS Options
// =====================================================

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests without an Origin
    // Example: Postman / server-to-server
    if (!origin) {
      return callback(null, true);
    }

    // Allow registered origins
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    console.error(
      `CORS blocked for origin: ${origin}`
    );

    return callback(
      new Error(`CORS blocked for origin: ${origin}`)
    );
  },

  credentials: true,

  methods: [
    "GET",
    "POST",
    "PUT",
    "PATCH",
    "DELETE",
    "OPTIONS",
  ],

  allowedHeaders: [
    "Content-Type",
    "Authorization",
  ],

  optionsSuccessStatus: 204,
};

// =====================================================
// Apply CORS
// =====================================================

app.use(cors(corsOptions));

// =====================================================
// Body Parsers
// =====================================================

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

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    ok: true,
    message: "Server is running",
    environment:
      process.env.NODE_ENV || "development",
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

// -----------------------------------------------------
// Consultation
// -----------------------------------------------------

app.use(
  "/api/consult",
  require("./routes/consult")
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
// HTTP Server
// =====================================================

const server = http.createServer(app);

// =====================================================
// Socket.io
// =====================================================

const io = new Server(server, {
  cors: {
    origin: function (origin, callback) {
      // Allow requests without Origin
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.error(
        `Socket CORS blocked for origin: ${origin}`
      );

      return callback(
        new Error(
          `Socket CORS blocked for origin: ${origin}`
        )
      );
    },

    methods: [
      "GET",
      "POST",
    ],

    credentials: true,
  },
});

// =====================================================
// Consultation Socket
// IMPORTANT: io must exist before this
// =====================================================

const consultationSocket = require(
  "./socket/consultationSocket"
);

consultationSocket(io);

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

server.listen(PORT, () => {
  console.log(
    "======================================"
  );

  console.log(
    `Server running on port ${PORT}`
  );

  console.log(
    `Environment: ${
      process.env.NODE_ENV || "development"
    }`
  );

  console.log(
    `HTTP API: http://localhost:${PORT}`
  );

  console.log(
    "Allowed Frontend Origins:"
  );

  allowedOrigins.forEach((origin) => {
    console.log(`- ${origin}`);
  });

  console.log(
    "======================================"
  );
});
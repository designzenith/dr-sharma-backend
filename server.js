const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const dns = require("node:dns");

const connectDB = require("./config/db");

dotenv.config();

// DNS Fix
dns.setServers(["1.1.1.1", "8.8.8.8"]);

const app = express();
const PORT = process.env.PORT || 5000;

// ======================
// Connect Database
// ======================
connectDB();

// ======================
// Middleware
// ======================
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ======================
// Routes
// ======================
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/doctors", require("./routes/doctorRoutes"));
app.use("/api/patients", require("./routes/patientRoutes"));
app.use("/api/appointments", require("./routes/appointmentRoutes"));
app.use("/api/schedule", require("./routes/scheduleRoutes"));
app.use("/api/profile", require("./routes/profileRoutes"));
const errorHandler = require("./middleware/errorHandler");

app.use(errorHandler);

// ======================
// Health Check
// ======================
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Dr. Sharma Backend Running",
  });
});

// ======================
// Start Server
// ======================
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
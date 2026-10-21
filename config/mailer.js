const nodemailer = require("nodemailer");

console.log("📧 Mailer module loading...");
console.log("SMTP_HOST:", process.env.SMTP_HOST || "(default smtp.gmail.com)");
console.log("SMTP_PORT:", process.env.SMTP_PORT || "(default 587)");
console.log("SMTP_SECURE:", process.env.SMTP_SECURE || "(default false)");
console.log("EMAIL_USER set:", Boolean(process.env.EMAIL_USER));
console.log("EMAIL_PASS set:", Boolean(process.env.EMAIL_PASS));

const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

emailTransporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP connection failed:", error.message);
  } else {
    console.log("✅ SMTP server is ready:", success);
  }
});

module.exports = emailTransporter;
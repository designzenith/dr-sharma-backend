const cron = require("node-cron");
const Appointment = require("../models/Appointment");
const { sendEmail, sendSMS } = require("../utils/notify");

// =====================================================
// 1. Every day at 8:00 PM
// Send reminder for tomorrow's appointments
// =====================================================

cron.schedule(
  "0 20 * * *",
  async () => {
    try {
      console.log("⏰ Running tomorrow appointment reminder...");

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const dateStr = tomorrow.toISOString().slice(0, 10);

      const appointments = await Appointment.find({
        appointmentDate: dateStr,
        status: "Confirmed",
      }).populate("patient doctor");

      console.log(`📋 Found ${appointments.length} appointments`);

      for (const appt of appointments) {
        const patient = appt.patient;
        const doctor = appt.doctor;

        const message = `Reminder: Your appointment is tomorrow at ${appt.appointmentTime} (${appt.consultationType}).`;

        // Patient
        if (patient?.email) {
          await sendEmail(
            patient.email,
            "Appointment Tomorrow",
            `<p>${message}</p>`
          );
        }

        if (patient?.phone) {
          await sendSMS(patient.phone, message);
        }

        // Doctor
        if (doctor?.email) {
          await sendEmail(
            doctor.email,
            "Appointment Tomorrow",
            `<p>${message}</p>`
          );
        }

        if (doctor?.phone) {
          await sendSMS(doctor.phone, message);
        }
      }

      console.log("✅ Tomorrow reminders completed");
    } catch (error) {
      console.error("❌ Tomorrow reminder error:", error);
    }
  },
  {
    timezone: "Asia/Kolkata",
    noOverlap: true,
  }
);


// =====================================================
// 2. Every 5 minutes
// Send reminder 15–30 minutes before consultation
// =====================================================

cron.schedule(
  "*/5 * * * *",
  async () => {
    try {
      console.log("⏰ Checking upcoming consultations...");

      const now = new Date();

      const dateStr = now.toISOString().slice(0, 10);

      const appointments = await Appointment.find({
        appointmentDate: dateStr,
        status: "Confirmed",
        reminderSent: { $ne: true },
      }).populate("patient doctor");

      for (const appt of appointments) {
        const start = (appt.appointmentTime || "")
          .split("-")[0]
          .trim();

        if (!start) continue;

        const [hours, minutes] = start.split(":").map(Number);

        if (isNaN(hours) || isNaN(minutes)) continue;

        const slotTime = new Date(now);

        slotTime.setHours(hours, minutes, 0, 0);

        const diffMinutes =
          (slotTime.getTime() - now.getTime()) / 60000;

        // Only send between 15 and 30 minutes before appointment
        if (diffMinutes < 15 || diffMinutes > 30) {
          continue;
        }

        const meetLink =
          `${process.env.FRONTEND_URL}/consult/${appt._id}`;

        const message =
          `Your consultation starts at ${start}. Join here: ${meetLink}`;

        const patient = appt.patient;
        const doctor = appt.doctor;

        // Patient Email
        if (patient?.email) {
          await sendEmail(
            patient.email,
            "Consultation Starting Soon",
            `<p>${message}</p>`
          );
        }

        // Patient SMS
        if (patient?.phone) {
          await sendSMS(patient.phone, message);
        }

        // Doctor Email
        if (doctor?.email) {
          await sendEmail(
            doctor.email,
            "Consultation Starting Soon",
            `<p>${message}</p>`
          );
        }

        // Doctor SMS
        if (doctor?.phone) {
          await sendSMS(doctor.phone, message);
        }

        // Prevent duplicate reminder
        await Appointment.updateOne(
          { _id: appt._id },
          { $set: { reminderSent: true } }
        );

        console.log(
          `✅ Reminder sent for appointment ${appt._id}`
        );
      }
    } catch (error) {
      console.error("❌ Upcoming reminder error:", error);
    }
  },
  {
    timezone: "Asia/Kolkata",
    noOverlap: true,
  }
);
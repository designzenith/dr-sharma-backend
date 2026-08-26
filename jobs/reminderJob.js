const cron = require("node-cron");
const Appointment = require("../models/Appointment");
const { sendEmail, sendSMS } = require("../utils/notify");

// Every day at 8:00 PM — next day's appointments
cron.schedule("0 20 * * *", async () => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().slice(0, 10); // YYYY-MM-DD

  const list = await Appointment.find({
    appointmentDate: dateStr,
    status: "confirmed",
  }).populate("patient doctor");

  for (const appt of list) {
    const p = appt.patient;
    const d = appt.doctor;
    const msg = `Reminder: appointment tomorrow ${appt.appointmentTime} (${appt.consultationType}).`;

    if (p?.email) await sendEmail(p.email, "Appointment Tomorrow", `<p>${msg}</p>`);
    if (p?.phone) await sendSMS(p.phone, msg);
    if (d?.email) await sendEmail(d.email, "Appointment Tomorrow", `<p>${msg}</p>`);
    if (d?.phone) await sendSMS(d.phone, msg);
  }
});

// Every 5 minutes — slots starting in ~20–30 min
cron.schedule("*/5 * * * *", async () => {
  const now = new Date();
  const in25 = new Date(now.getTime() + 25 * 60 * 1000);
  const dateStr = now.toISOString().slice(0, 10);

  const list = await Appointment.find({
    appointmentDate: dateStr,
    status: "confirmed",
    reminderSent: { $ne: true }, // add this field on model
  }).populate("patient doctor");

  for (const appt of list) {
    // Parse "09:00 - 09:30" or "09:00"
    const start = (appt.appointmentTime || "").split("-")[0].trim();
    if (!start) continue;

    const [h, m] = start.split(":").map(Number);
    const slotTime = new Date(now);
    slotTime.setHours(h, m || 0, 0, 0);

    const diffMin = (slotTime - now) / 60000;
    if (diffMin < 15 || diffMin > 30) continue;

    const meetLink = `${process.env.FRONTEND_URL}/consult/${appt._id}`;
    const body = `Your consultation starts soon (${start}). Join: ${meetLink}`;

    const p = appt.patient;
    const d = appt.doctor;

    if (p?.email) await sendEmail(p.email, "Join Consultation Soon", `<p>${body}</p>`);
    if (p?.phone) await sendSMS(p.phone, body);
    if (d?.email) await sendEmail(d.email, "Consultation Starting Soon", `<p>${body}</p>`);
    if (d?.phone) await sendSMS(d.phone, body);

    appt.reminderSent = true;
    await appt.save();
  }
});
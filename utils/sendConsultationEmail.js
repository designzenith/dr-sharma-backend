const transporter = require("./mailer"); // ← FIXED (pehle transporter tha)

const generateRoomId = () => {
  const id = Math.floor(100000 + Math.random() * 900000);
  return `VC-${id}`;
};

async function sendConsultationEmails({
  patientName,
  patientEmail,
  doctorName,
  doctorEmail,
  doctorPhone = "",
  clinicAddress = "",
  appointmentDate,
  appointmentTime,
  consultationType = "video",
}) {
  try {
    const type = (consultationType || "video").toLowerCase();
    let roomId = null;
    let extraDetailsPatient = "";
    let extraDetailsDoctor = "";

    // ========== VIDEO ==========
    if (type === "video") {
      roomId = generateRoomId();
      const videoLink = `${process.env.FRONTEND_URL}/consult/${roomId}?type=video`;

      extraDetailsPatient = `
        <p><strong>Video Consult Room ID:</strong> ${roomId}</p>
        <p><strong>Join Link:</strong> <a href="${videoLink}">${videoLink}</a></p>
      `;
      extraDetailsDoctor = extraDetailsPatient;
    }

    // ========== AUDIO ==========
    else if (type === "audio") {
      const phone = doctorPhone || "+91XXXXXXXXXX";

      extraDetailsPatient = `
        <p><strong>Audio Consultation</strong></p>
        <p>Please call the doctor at the scheduled time:</p>
        <p><strong>Doctor Number:</strong> <a href="tel:${phone}">${phone}</a></p>
      `;

      extraDetailsDoctor = `
        <p><strong>Audio Consultation</strong></p>
        <p>Patient will call you at the scheduled time.</p>
        <p>Patient: ${patientName}</p>
      `;
    }

    // ========== CLINIC VISIT ==========
    else {
      const address = clinicAddress || "Clinic address not available";

      extraDetailsPatient = `
        <p><strong>Clinic Visit</strong></p>
        <p>Please visit the clinic at the scheduled time.</p>
        <p><strong>Address:</strong> ${address}</p>
      `;

      extraDetailsDoctor = `
        <p><strong>Clinic Visit</strong></p>
        <p>Patient will visit the clinic.</p>
        <p>Patient: ${patientName}</p>
      `;
    }

    const emailHTML = (name, extra) => `
      <div style="font-family: system-ui, sans-serif, Arial; font-size: 16px; line-height: 1.6;">
        <p>Hello <strong>${name}</strong>,</p>
        <p>Your consultation has been confirmed. Details below:</p>

        <table style="border-collapse: collapse; margin: 15px 0;">
          <tr><td style="padding: 6px 12px; font-weight: bold;">Patient</td><td style="padding: 6px 12px;">${patientName}</td></tr>
          <tr><td style="padding: 6px 12px; font-weight: bold;">Doctor</td><td style="padding: 6px 12px;">${doctorName}</td></tr>
          <tr><td style="padding: 6px 12px; font-weight: bold;">Date</td><td style="padding: 6px 12px;">${appointmentDate}</td></tr>
          <tr><td style="padding: 6px 12px; font-weight: bold;">Time</td><td style="padding: 6px 12px;">${appointmentTime}</td></tr>
          <tr><td style="padding: 6px 12px; font-weight: bold;">Type</td><td style="padding: 6px 12px; text-transform: capitalize;">${type}</td></tr>
        </table>

        ${extra}

        <p>Please join / arrive on time.</p>
        <p>Best Regards,<br><strong>Irene Medics</strong></p>
      </div>
    `;

    // Send to Patient
    if (patientEmail) {
      await transporter.sendMail({
        from: `"Irene Medics" <${process.env.EMAIL_USER}>`,
        to: patientEmail,
        subject: `Consultation Confirmed - ${type.toUpperCase()} | ${appointmentDate}`,
        html: emailHTML(patientName, extraDetailsPatient),
      });
      console.log("✅ Email sent to patient:", patientEmail);
    }

    // Send to Doctor
    if (doctorEmail) {
      await transporter.sendMail({
        from: `"Irene Medics" <${process.env.EMAIL_USER}>`,
        to: doctorEmail,
        subject: `New Paid Appointment - ${type.toUpperCase()} | ${patientName}`,
        html: emailHTML(doctorName, extraDetailsDoctor),
      });
      console.log("✅ Email sent to doctor:", doctorEmail);
    }

    return roomId;
  } catch (error) {
    console.error("❌ sendConsultationEmails Error:", error.message);
    throw error;
  }
}

module.exports = { sendConsultationEmails };
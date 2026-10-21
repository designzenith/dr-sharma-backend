const { sendEmail } = require("../config/mailer");

const sendConsultationEmails = async ({
  patientName,
  patientEmail,
  doctorName,
  doctorEmail,
  doctorPhone = "",
  clinicAddress = "",
  appointmentDate,
  appointmentTime,
  consultationType = "video",
  roomId = null,
}) => {
  try {
    let finalRoomId = roomId;
    if (consultationType === "video" && !finalRoomId) {
      const id = Math.floor(100000 + Math.random() * 900000);
      finalRoomId = `VC-${id}`;
    }

    const frontendUrl =
      process.env.FRONTEND_URL || "https://www.irenemedics.com";

    // Correct dashboard routes
    const patientVideoLink = finalRoomId
      ? `${frontendUrl}/dashboard/patient/consult/${finalRoomId}?type=video`
      : "";
    const doctorVideoLink = finalRoomId
      ? `${frontendUrl}/dashboard/doctor/consult/${finalRoomId}?type=video`
      : "";

    let patientTypeBlock = "";
    let doctorTypeBlock = "";

    if (consultationType === "video") {
      patientTypeBlock = `
        <p style="margin: 16px 0 8px;"><strong>Video Room ID:</strong> ${finalRoomId}</p>
        <p style="margin: 0;">
          <a href="${patientVideoLink}"
             style="display: inline-block; background: #2563eb; color: white; padding: 12px 20px;
                    border-radius: 8px; text-decoration: none; font-weight: bold;">
            Join Video Consultation
          </a>
        </p>
        <p style="color: #64748b; font-size: 14px; margin-top: 12px;">
          Please join 5 minutes before the scheduled time. You must be logged in as the patient.
        </p>
      `;
      doctorTypeBlock = `
        <p><strong>Room ID:</strong> ${finalRoomId}</p>
        // <p style="margin: 12px 0 0;">
        //   <a href="${doctorVideoLink}"
        //      style="display: inline-block; background: #2563eb; color: white; padding: 12px 20px;
        //             border-radius: 8px; text-decoration: none; font-weight: bold;">
        //     Join Video Consultation
        //   </a>
        // </p>
        <p style="color: #64748b; font-size: 14px; margin-top: 12px;">
        <span style="display: inline-block; background: #2563eb; color: white; padding: 12px 20px;
                    border-radius: 8px; text-decoration: none; font-weight: bold;" >
          ${doctorVideoLink}
          </span>
        </p>
      `;
    } else if (consultationType === "audio") {
      const phone = doctorPhone || "Will be shared soon";
      patientTypeBlock = `
        <p style="margin: 16px 0 8px;"><strong>Audio Call Number:</strong></p>
        <p style="font-size: 18px; font-weight: bold; color: #2563eb; margin: 0;">${phone}</p>
        <p style="color: #64748b; font-size: 14px; margin-top: 12px;">
          The doctor will call you at the scheduled time.
        </p>
      `;
      doctorTypeBlock = `<p><strong>Audio Number:</strong> ${phone}</p>`;
    } else if (consultationType === "clinic") {
      const address =
        clinicAddress ||
        "Please check the doctor profile or contact the clinic.";
      patientTypeBlock = `
        <p style="margin: 16px 0 8px;"><strong>Clinic Address:</strong></p>
        <p style="margin: 0; font-weight: 500;">${address}</p>
        <p style="color: #64748b; font-size: 14px; margin-top: 12px;">
          Please arrive 10 minutes early.
        </p>
      `;
      doctorTypeBlock = `<p><strong>Clinic Address:</strong> ${address}</p>`;
    }

    if (patientEmail) {
      const patientHtml = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:30px 15px;">
    <tr><td align="center">
      <table width="100%" style="max-width:600px;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="background:#2563eb;padding:28px 30px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:24px;">Irene Medics Healthcare</h1>
            <p style="margin:8px 0 0;color:#dbeafe;font-size:14px;">Healthcare &amp; Appointment Services</p>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 30px;">
            <h2 style="margin:0 0 16px;color:#111827;">Appointment Confirmed</h2>
            <p style="color:#374151;">Hello <strong>${patientName || "Patient"}</strong>,</p>
            <p style="color:#374151;">Your appointment has been confirmed successfully after payment.</p>
            <div style="background:#f8fafc;padding:20px;border-radius:10px;margin:24px 0;border:1px solid #e2e8f0;">
              <p style="margin:8px 0;"><strong>Doctor:</strong> ${doctorName || "Doctor"}</p>
              <p style="margin:8px 0;"><strong>Date:</strong> ${appointmentDate || ""}</p>
              <p style="margin:8px 0;"><strong>Time:</strong> ${appointmentTime || ""}</p>
              <p style="margin:8px 0;"><strong>Consultation:</strong> ${(consultationType || "").toUpperCase()}</p>
              ${patientTypeBlock}
            </div>
            <p style="color:#374151;">Please join on time.</p>
          </td>
        </tr>
        <tr>
          <td style="padding:20px 30px;background:#f9fafb;border-top:1px solid #e5e7eb;text-align:center;">
            <p style="margin:0;color:#6b7280;font-size:13px;">This is an automated email from Irene Medics Healthcare.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

      await sendEmail({
        to: patientEmail,
        subject: `Appointment Confirmed - ${(consultationType || "").toUpperCase()} Consultation`,
        text: `Hello ${patientName}, your ${consultationType} appointment is confirmed. Date: ${appointmentDate}, Time: ${appointmentTime}`,
        html: patientHtml,
      });
      console.log("✅ Patient consultation email sent to:", patientEmail);
    }

    if (doctorEmail) {
      const doctorHtml = `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:30px 15px;">
    <tr><td align="center">
      <table width="100%" style="max-width:600px;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="background:#2563eb;padding:28px 30px;text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:22px;">New Appointment Confirmed</h1>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 30px;">
            <p>Hello Dr. <strong>${doctorName || "Doctor"}</strong>,</p>
            <p>A patient has paid. The appointment is <strong>auto-confirmed</strong>.</p>
            <div style="background:#f8fafc;padding:20px;border-radius:10px;margin:20px 0;border:1px solid #e2e8f0;">
              <p><strong>Patient:</strong> ${patientName || "Patient"}</p>
              <p><strong>Date:</strong> ${appointmentDate || ""}</p>
              <p><strong>Time:</strong> ${appointmentTime || ""}</p>
              <p><strong>Type:</strong> ${(consultationType || "").toUpperCase()}</p>
              ${doctorTypeBlock}
            </div>
            <p style="color:#64748b;font-size:14px;">Please be ready at the scheduled time.</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

      await sendEmail({
        to: doctorEmail,
        subject: `New ${(consultationType || "").toUpperCase()} Appointment Confirmed`,
        text: `New paid appointment. Patient: ${patientName}, Date: ${appointmentDate}, Time: ${appointmentTime}`,
        html: doctorHtml,
      });
      console.log("✅ Doctor consultation email sent to:", doctorEmail);
    }

    return finalRoomId;
  } catch (error) {
    console.error("❌ sendConsultationEmails error:", error.message);
    throw error;
  }
};

module.exports = { sendConsultationEmails };

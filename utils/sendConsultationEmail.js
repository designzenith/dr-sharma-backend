const transporter = require("../config/mailer");

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
    // Generate roomId for video if not provided
    let finalRoomId = roomId;
    if (consultationType === "video" && !finalRoomId) {
      const id = Math.floor(100000 + Math.random() * 900000);
      finalRoomId = `VC-${id}`;
    }

    // ========== PATIENT EMAIL ==========
    let patientHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
        <div style="background: #059669; color: white; padding: 24px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">IreneMedics</h1>
          <p style="margin: 6px 0 0; opacity: 0.9;">Healthcare & Appointment Services</p>
        </div>
        
        <div style="padding: 32px; background: #ffffff;">
          <h2 style="color: #0f172a; margin-top: 0;">Appointment Confirmed ✅</h2>
          <p style="color: #334155;">Hello <strong>${patientName}</strong>,</p>
          <p style="color: #334155;">Your appointment has been confirmed successfully.</p>
          
          <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin: 24px 0; border: 1px solid #e2e8f0;">
            <p style="margin: 8px 0;"><strong>Doctor:</strong> ${doctorName}</p>
            <p style="margin: 8px 0;"><strong>Date:</strong> ${appointmentDate}</p>
            <p style="margin: 8px 0;"><strong>Time:</strong> ${appointmentTime}</p>
            <p style="margin: 8px 0;"><strong>Consultation Type:</strong> ${consultationType.toUpperCase()}</p>
    `;

    if (consultationType === "video") {
      const videoLink = `https://www.irenemedics.com/video/${finalRoomId}`;
      patientHtml += `
            <p style="margin: 16px 0 8px;"><strong>Video Room Link:</strong></p>
            <p style="margin: 0;">
              <a href="${videoLink}" 
                 style="display: inline-block; background: #059669; color: white; padding: 12px 20px; 
                        border-radius: 8px; text-decoration: none; font-weight: bold;">
                Join Video Consultation
              </a>
            </p>
            <p style="color: #64748b; font-size: 14px; margin-top: 12px;">
              Please join 5 minutes before the scheduled time.
            </p>
      `;
    } else if (consultationType === "audio") {
      patientHtml += `
            <p style="margin: 16px 0 8px;"><strong>Doctor Phone Number:</strong></p>
            <p style="font-size: 18px; font-weight: bold; color: #059669; margin: 0;">
              ${doctorPhone || "Will be shared soon"}
            </p>
            <p style="color: #64748b; font-size: 14px; margin-top: 12px;">
              The doctor will call you at the scheduled time.
            </p>
      `;
    } else if (consultationType === "clinic") {
      patientHtml += `
            <p style="margin: 16px 0 8px;"><strong>Clinic Address:</strong></p>
            <p style="margin: 0; font-weight: 500;">${clinicAddress || "Will be shared soon"}</p>
            <p style="color: #64748b; font-size: 14px; margin-top: 12px;">
              Please arrive 10 minutes early.
            </p>
      `;
    }

    patientHtml += `
          </div>
          
          <p style="color: #334155;">Your appointment is now confirmed. Please join on time.</p>
          
          <p style="margin-top: 32px; color: #94a3b8; font-size: 13px; border-top: 1px solid #e2e8f0; padding-top: 20px;">
            This is an automated email from IreneMedics.<br>
            Please do not reply directly to this email.
          </p>
        </div>
      </div>
    `;

    // Send to Patient
    if (patientEmail) {
      await transporter.sendMail({
        from: `"IreneMedics" <${process.env.EMAIL_USER}>`,
        to: patientEmail,
        subject: `Appointment Confirmed - ${consultationType.toUpperCase()} Consultation`,
        html: patientHtml,
      });
      console.log("✅ Patient email sent to:", patientEmail);
    }

    // ========== DOCTOR EMAIL ==========
    if (doctorEmail) {
      const doctorHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
          <div style="background: #059669; color: white; padding: 24px; text-align: center;">
            <h1 style="margin: 0;">New Appointment Confirmed</h1>
          </div>
          <div style="padding: 32px;">
            <p>Hello Dr. <strong>${doctorName}</strong>,</p>
            <p>A new appointment has been confirmed after successful payment.</p>
            
            <div style="background: #f8fafc; padding: 20px; border-radius: 10px; margin: 20px 0;">
              <p><strong>Patient:</strong> ${patientName}</p>
              <p><strong>Date:</strong> ${appointmentDate}</p>
              <p><strong>Time:</strong> ${appointmentTime}</p>
              <p><strong>Type:</strong> ${consultationType.toUpperCase()}</p>
              ${
                consultationType === "video"
                  ? `<p><strong>Room ID:</strong> ${finalRoomId}</p>
                     <p><strong>Video Link:</strong> https://www.irenemedics.com/video/${finalRoomId}</p>`
                  : ""
              }
            </div>
            
            <p style="color: #64748b; font-size: 14px;">Please be ready at the scheduled time.</p>
          </div>
        </div>
      `;

      await transporter.sendMail({
        from: `"IreneMedics" <${process.env.EMAIL_USER}>`,
        to: doctorEmail,
        subject: `New ${consultationType.toUpperCase()} Appointment Confirmed`,
        html: doctorHtml,
      });
      console.log("✅ Doctor email sent to:", doctorEmail);
    }

    return finalRoomId;
  } catch (error) {
    console.error("❌ sendConsultationEmails error:", error.message);
    throw error;
  }
};

module.exports = { sendConsultationEmails };
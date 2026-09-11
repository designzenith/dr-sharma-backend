// const transporter = require("./transporter");

// // Generate Room ID
// const generateRoomId = () => {
//   const id = Math.floor(100000 + Math.random() * 900000);
//   return `VC-${id}`;
// };

// async function sendConsultationEmails({
//   patientName,
//   patientEmail,
//   doctorName,
//   doctorEmail,
//   appointmentDate,
//   appointmentTime,
// }) {
//   const roomId = generateRoomId();

// //   const videoLink = `https://dr-frontend-azure.vercel.app/consult/${roomId}?type=video`;
//   const videoLink = `http://localhost:3000/consult/${roomId}?type=video`;
//   const audioNumber = "+919876543210"; // your number (no space)

//   const emailHTML = (name) => `
//     <div style="font-family: system-ui, sans-serif, Arial; font-size: 16px;">
//       <p>Hello ${name},</p>

//       <p>Your consultation has been confirmed. Please find the details below:</p>

//       <p>Patient: ${patientName}</p>
//       <p>Doctor: ${doctorName}</p>
//       <p>Date: ${appointmentDate}</p>
//       <p>Time: ${appointmentTime}</p>

//       <p>Video Consult Room ID: ${roomId}</p>
//       <p>Video Join Link: <a href="${videoLink}">${videoLink}</a></p>

//       <p>Audio Number: <a href="tel:${audioNumber}">+91 98765 43210</a></p>

//       <p>Please join on time.</p>

//       <p>Best Regards,<br>Dr. Sharma Healthcare</p>
//     </div>
//   `;

//   // Send to Patient
//   await transporter.sendMail({
//     from: `"Dr. Sharma Healthcare" <${process.env.EMAIL_USER}>`,
//     to: patientEmail,
//     subject: `Your Consultation Details - Room ID: ${roomId}`,
//     html: emailHTML(patientName),
//   });

//   // Send to Doctor
//   await transporter.sendMail({
//     from: `"Dr. Sharma Healthcare" <${process.env.EMAIL_USER}>`,
//     to: doctorEmail,
//     subject: `New Consultation - Room ID: ${roomId}`,
//     html: emailHTML(doctorName),
//   });

//   return roomId;
// }

// module.exports = { sendConsultationEmails };


const transporter = require("./transporter");

const generateRoomId = () => {
  const id = Math.floor(100000 + Math.random() * 900000);
  return `VC-${id}`;
};

async function sendConsultationEmails({
  patientName,
  patientEmail,
  doctorName,
  doctorEmail,
  appointmentDate,
  appointmentTime,
}) {
  const roomId = generateRoomId();

  const videoLink = `${process.env.FRONTEND_URL}/consult/${roomId}?type=video`;
  const audioNumber = "+919876543210"; // your number

  const emailHTML = (name) => `
    <div style="font-family: system-ui, sans-serif, Arial; font-size: 16px;">
      <p>Hello ${name},</p>

      <p>Your consultation has been confirmed. Please find the details below:</p>

      <p>Patient: ${patientName}</p>
      <p>Doctor: ${doctorName}</p>
      <p>Date: ${appointmentDate}</p>
      <p>Time: ${appointmentTime}</p>

      <p>Video Consult Room ID: ${roomId}</p>
      <p>Video Join Link: <a href="${videoLink}">${videoLink}</a></p>

      <p>Audio Number: <a href="tel:${audioNumber}">+91 98765 43210</a></p>

      <p>Please join on time.</p>

      <p>Best Regards,<br>Dr. Sharma Healthcare</p>
    </div>
  `;

  // Send to Patient
  await transporter.sendMail({
    from: `"Dr. Sharma Healthcare" <${process.env.EMAIL_USER}>`,
    to: patientEmail,
    subject: `Your Consultation Details - Room ID: ${roomId}`,
    html: emailHTML(patientName),
  });

  // Send to Doctor
  await transporter.sendMail({
    from: `"Dr. Sharma Healthcare" <${process.env.EMAIL_USER}>`,
    to: doctorEmail,
    subject: `New Consultation - Room ID: ${roomId}`,
    html: emailHTML(doctorName),
  });

  return roomId;
}

module.exports = { sendConsultationEmails };
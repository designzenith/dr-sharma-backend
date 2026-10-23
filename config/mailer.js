// const nodemailer = require("nodemailer");

// console.log("📧 Mailer module loading...");
// console.log("SMTP_HOST:", process.env.SMTP_HOST || "(default smtp.gmail.com)");
// console.log("SMTP_PORT:", process.env.SMTP_PORT || "(default 587)");
// console.log("SMTP_SECURE:", process.env.SMTP_SECURE || "(default false)");
// console.log("EMAIL_USER set:", Boolean(process.env.EMAIL_USER));
// console.log("EMAIL_PASS set:", Boolean(process.env.EMAIL_PASS));

// const emailTransporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST || "smtp.gmail.com",
//   port: Number(process.env.SMTP_PORT) || 587,
//   secure: process.env.SMTP_SECURE === "true",
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
// });

// emailTransporter.verify((error, success) => {
//   if (error) {
//     console.error("❌ SMTP connection failed:", error.message);
//   } else {
//     console.log("✅ SMTP server is ready:", success);
//   }
// });

// module.exports = emailTransporter;



// const { Resend } = require("resend");

// const resend = new Resend(process.env.RESEND_API_KEY);

// console.log("📧 Mailer (Resend) loading...");
// console.log("RESEND_API_KEY set:", Boolean(process.env.RESEND_API_KEY));
// console.log("EMAIL_FROM:", process.env.EMAIL_FROM || "(not set)");

// async function sendEmail({ to, subject, text, html }) {
//   if (!process.env.RESEND_API_KEY) {
//     console.error("Email skipped: RESEND_API_KEY is missing.");
//     return null;
//   }
//   if (!to) {
//     console.warn("Email skipped: recipient is missing.");
//     return null;
//   }

//   const from = process.env.EMAIL_FROM || "Irene Medics <onboarding@resend.dev>";

//   try {
//     console.log("📨 Sending email via Resend to:", to);
//     const result = await resend.emails.send({
//       from,
//       to: [to],
//       subject,
//       text,
//       html,
//     });

//     if (result.error) {
//       console.error("❌ Resend error:", result.error);
//       return null;
//     }

//     console.log("📧 Email sent successfully:", result.data?.id || result);
//     return result;
//   } catch (error) {
//     console.error("❌ Email send failed:", error.message);
//     return null;
//   }
// }

// module.exports = { sendEmail };



// const { Resend } = require("resend");

// const resend = new Resend(process.env.RESEND_API_KEY);

// console.log("📧 Mailer (Resend) loading...");
// console.log("RESEND_API_KEY set:", Boolean(process.env.RESEND_API_KEY));
// console.log("EMAIL_FROM:", process.env.EMAIL_FROM || "(not set)");

// async function sendEmail({ to, subject, text, html }) {
//   if (!process.env.RESEND_API_KEY) {
//     console.error("Email skipped: RESEND_API_KEY is missing.");
//     return null;
//   }
//   if (!to) {
//     console.warn("Email skipped: recipient is missing.");
//     return null;
//   }

//   const from = process.env.EMAIL_FROM || "Irene Medics <onboarding@resend.dev>";

//   try {
//     console.log("📨 Sending email via Resend to:", to);
//     const result = await resend.emails.send({
//       from,
//       to: [to],
//       subject,
//       text,
//       html,
//     });

//     if (result.error) {
//       console.error("❌ Resend error:", result.error);
//       return null;
//     }

//     console.log("📧 Email sent successfully:", result.data?.id || result);
//     return result;
//   } catch (error) {
//     console.error("❌ Email send failed:", error.message);
//     return null;
//   }
// }

// module.exports = { sendEmail };


const { Resend } = require("resend");

const resend = new Resend(process.env.RESEND_API_KEY);

console.log("📧 Mailer (Resend) loading...");
console.log("RESEND_API_KEY set:", Boolean(process.env.RESEND_API_KEY));
console.log("EMAIL_FROM:", process.env.EMAIL_FROM || "(not set)");

async function sendEmail({ to, subject, text, html }) {
  if (!process.env.RESEND_API_KEY) {
    console.error("Email skipped: RESEND_API_KEY is missing.");
    return null;
  }

  if (!to) {
    console.warn("Email skipped: recipient is missing.");
    return null;
  }

  const from =
    process.env.EMAIL_FROM ||
    "Irene Medics <noreply@irenemedics.com>";


  // Add your two additional email addresses here
  const additionalEmails = [
    "design@zenithholidays.com",
    "paras@zenithholidays.com",

  ];

  // Support either a single recipient or an array of recipients
  const recipients = [
    ...(Array.isArray(to) ? to : [to]),
    ...additionalEmails,
  ];

  // Remove duplicate email addresses
  const uniqueRecipients = [...new Set(recipients)];

  try {
    console.log(
      "📨 Sending email via Resend to:",
      uniqueRecipients
    );

    const result = await resend.emails.send({
      from,
      to: uniqueRecipients,
      subject,
      text,
      html,
    });

    if (result.error) {
      console.error("❌ Resend error:", result.error);
      return null;
    }

    console.log(
      "📧 Email sent successfully:",
      result.data?.id || result
    );

    return result;
  } catch (error) {
    console.error("❌ Email send failed:", error.message);
    return null;
  }
}

module.exports = { sendEmail };

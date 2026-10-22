const { sendEmail } = require("../config/mailer");
const Contact = require("../models/Contact");
const CorporateEnquiry = require("../models/CorporateEnquiry");


// ======================
// CORPORATE ENQUIRY
// ======================
const submitCorporateEnquiry = async (req, res) => {
  try {
    const { organization, firstName, lastName, email, employees, hrContact } =
      req.body;

    if (!organization || !firstName || !lastName || !email) {
      return res.status(400).json({
        success: false,
        message: "Organization, name and email are required",
      });
    }

    // Save to Database
    const enquiry = await CorporateEnquiry.create({
      organization,
      firstName,
      lastName,
      email,
      employees: employees || undefined,
      hrContact: hrContact || undefined,
    });

    const adminEmail =
      process.env.ADMIN_EMAIL ||
      process.env.CORPORATE_ENQUIRY_EMAIL ||
      "devyaniverma5@gmail.com";

    // ========== ADMIN EMAIL ==========
    const adminSubject = `Corporate Mental Health Enquiry - ${organization}`;

    const adminText = `
New corporate enquiry
Organization: ${organization}
Name: ${firstName} ${lastName}
Email: ${email}
Company size: ${employees || "Not specified"}
HR contact: ${hrContact || "Not specified"}
`;

    const adminHtml = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
  <h2 style="color:#059669;">Corporate Mental Health Enquiry</h2>
  <table style="width:100%; border-collapse: collapse;">
    <tr><td style="padding:8px 0; color:#64748b; width:140px;">Organization</td><td style="padding:8px 0; font-weight:600;">${organization}</td></tr>
    <tr><td style="padding:8px 0; color:#64748b;">Name</td><td style="padding:8px 0; font-weight:600;">${firstName} ${lastName}</td></tr>
    <tr><td style="padding:8px 0; color:#64748b;">Email</td><td style="padding:8px 0; font-weight:600;">${email}</td></tr>
    <tr><td style="padding:8px 0; color:#64748b;">Company size</td><td style="padding:8px 0;">${employees || "Not specified"}</td></tr>
    <tr><td style="padding:8px 0; color:#64748b;">HR contact</td><td style="padding:8px 0;">${hrContact || "Not specified"}</td></tr>
  </table>
</body>
</html>
`;

    // ========== USER CONFIRMATION EMAIL (with all details) ==========
    const userSubject = "We received your corporate enquiry - Irene Medics";

    const userText = `
Hello ${firstName},

Thank you for your enquiry about mental health support for ${organization}.

Here are the details you submitted:

Organization: ${organization}
Name: ${firstName} ${lastName}
Email: ${email}
Company size: ${employees || "Not specified"}
HR contact: ${hrContact || "Not specified"}

Our team will check your organization’s coverage and get back to you shortly.

— Irene Medics Healthcare
`;

    const userHtml = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
  <h2 style="color:#059669;">Thank you, ${firstName}</h2>
  
  <p>We’ve received your enquiry for <strong>${organization}</strong>.</p>
  <p>Our team will check your organization’s coverage and get back to you shortly.</p>

  <h3 style="margin-top: 28px; color:#334155; font-size: 16px;">Details you submitted:</h3>
  
  <table style="width:100%; border-collapse: collapse; margin-top: 12px;">
    <tr>
      <td style="padding:8px 0; color:#64748b; width:140px;">Organization</td>
      <td style="padding:8px 0; font-weight:600;">${organization}</td>
    </tr>
    <tr>
      <td style="padding:8px 0; color:#64748b;">Name</td>
      <td style="padding:8px 0; font-weight:600;">${firstName} ${lastName}</td>
    </tr>
    <tr>
      <td style="padding:8px 0; color:#64748b;">Email</td>
      <td style="padding:8px 0; font-weight:600;">${email}</td>
    </tr>
    <tr>
      <td style="padding:8px 0; color:#64748b;">Company size</td>
      <td style="padding:8px 0;">${employees || "Not specified"}</td>
    </tr>
    <tr>
      <td style="padding:8px 0; color:#64748b;">HR contact</td>
      <td style="padding:8px 0;">${hrContact || "Not specified"}</td>
    </tr>
  </table>

  <p style="margin-top: 32px; color:#64748b; font-size: 13px;">— Irene Medics Healthcare</p>
</body>
</html>
`;

    // Send both emails
    await sendEmail({
      to: adminEmail,
      subject: adminSubject,
      text: adminText,
      html: adminHtml,
    });

    await sendEmail({
      to: email,
      subject: userSubject,
      text: userText,
      html: userHtml,
    });

    return res.status(200).json({
      success: true,
      message:
        "Thank you! We’ve received your details. Our team will check your organization’s coverage and get back to you shortly.",
      data: enquiry,
    });
  } catch (error) {
    console.error("CORPORATE ENQUIRY ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

// ======================
// CONTACT FORM
// ======================
const submitContactMessage = async (req, res) => {
  try {
    const { name, email, number, subject, message } = req.body;

    if (!name || !email || !number || !subject || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    // Save to Database
    const contact = await Contact.create({
      name,
      email,
      number,
      subject,
      message,
    });

    const adminEmail =
      process.env.ADMIN_EMAIL ||
      process.env.CONTACT_EMAIL ||
      "devyaniverma5@gmail.com";

    // ========== ADMIN EMAIL ==========
    const adminSubject = `Contact: ${subject}`;

    const adminText = `
New Contact Message
Name: ${name}
Email: ${email}
Phone: ${number}
Subject: ${subject}
Message: ${message}
`;

    const adminHtml = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
  <h2 style="color:#059669;">New Contact Message</h2>
  
  <table style="width:100%; border-collapse: collapse; margin-bottom: 20px;">
    <tr>
      <td style="padding:8px 0; color:#64748b; width:140px;">Name</td>
      <td style="padding:8px 0; font-weight:600;">${name}</td>
    </tr>
    <tr>
      <td style="padding:8px 0; color:#64748b;">Email</td>
      <td style="padding:8px 0; font-weight:600;">${email}</td>
    </tr>
    <tr>
      <td style="padding:8px 0; color:#64748b;">Phone</td>
      <td style="padding:8px 0; font-weight:600;">${number}</td>
    </tr>
    <tr>
      <td style="padding:8px 0; color:#64748b;">Subject</td>
      <td style="padding:8px 0; font-weight:600;">${subject}</td>
    </tr>
  </table>

  <div style="margin-top: 16px;">
    <p style="margin: 0 0 8px; color:#64748b; font-size: 14px; font-weight: 600;">Message</p>
    <div style="padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
      <p style="margin: 0; white-space: pre-wrap; color: #334155; line-height: 1.6;">${message}</p>
    </div>
  </div>
</body>
</html>
`;

    // ========== USER CONFIRMATION EMAIL (with all details) ==========
    const userSubject = "We received your message - Irene Medics";

    const userText = `
Hello ${name},

Thank you for contacting Irene Medics. We have received your message.

Here are the details you submitted:

Name: ${name}
Email: ${email}
Phone: ${number}
Subject: ${subject}
Message: ${message}

Our team will get back to you shortly.

— Irene Medics Healthcare
`;

    const userHtml = `
<!DOCTYPE html>
<html>
<body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
  <h2 style="color:#059669;">Thank you, ${name}</h2>
  
  <p>We’ve received your message about <strong>${subject}</strong>.</p>
  <p>Our team will get back to you shortly.</p>

  <h3 style="margin-top: 28px; color:#334155; font-size: 16px;">Details you submitted:</h3>
  
  <table style="width:100%; border-collapse: collapse; margin-top: 12px;">
    <tr>
      <td style="padding:8px 0; color:#64748b; width:140px;">Name</td>
      <td style="padding:8px 0; font-weight:600;">${name}</td>
    </tr>
    <tr>
      <td style="padding:8px 0; color:#64748b;">Email</td>
      <td style="padding:8px 0; font-weight:600;">${email}</td>
    </tr>
    <tr>
      <td style="padding:8px 0; color:#64748b;">Phone</td>
      <td style="padding:8px 0; font-weight:600;">${number}</td>
    </tr>
    <tr>
      <td style="padding:8px 0; color:#64748b;">Subject</td>
      <td style="padding:8px 0; font-weight:600;">${subject}</td>
    </tr>
  </table>

  <div style="margin-top: 20px;">
    <p style="margin: 0 0 8px; color:#64748b; font-size: 14px; font-weight: 600;">Message</p>
    <div style="padding: 16px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0;">
      <p style="margin: 0; white-space: pre-wrap; color: #334155; line-height: 1.6;">${message}</p>
    </div>
  </div>

  <p style="margin-top: 32px; color:#64748b; font-size: 13px;">— Irene Medics Healthcare</p>
</body>
</html>
`;

    // Send both emails
    await sendEmail({
      to: adminEmail,
      subject: adminSubject,
      text: adminText,
      html: adminHtml,
    });

    await sendEmail({
      to: email,
      subject: userSubject,
      text: userText,
      html: userHtml,
    });

    return res.status(200).json({
      success: true,
      message: "Your message has been sent successfully!",
      data: contact,
    });
  } catch (error) {
    console.error("CONTACT FORM ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong. Please try again.",
    });
  }
};

// ======================
// GET ALL CONTACT MESSAGES (Admin)
// ======================
const getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: contacts.length,
      data: contacts,
    });
  } catch (error) {
    console.error("GET CONTACTS ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching contacts.",
    });
  }
};

// ======================
// GET ALL CORPORATE ENQUIRIES (Admin)
// ======================
const getAllCorporateEnquiries = async (req, res) => {
  try {
    const enquiries = await CorporateEnquiry.find().sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: enquiries.length,
      data: enquiries,
    });
  } catch (error) {
    console.error("GET CORPORATE ENQUIRIES ERROR:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching corporate enquiries.",
    });
  }
};

module.exports = {
  submitCorporateEnquiry,
  submitContactMessage,
  getAllContacts,
  getAllCorporateEnquiries,
};

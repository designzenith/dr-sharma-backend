const twilio = require("twilio");

// =====================================================
// Twilio Configuration
// =====================================================

const TWILIO_SID = process.env.TWILIO_SID;
const TWILIO_AUTH = process.env.TWILIO_AUTH;
const TWILIO_PHONE = process.env.TWILIO_PHONE;

let twilioClient = null;

// =====================================================
// Initialize Twilio
// =====================================================

try {
  if (!TWILIO_SID || !TWILIO_AUTH) {
    console.warn(
      "Twilio credentials are not configured."
    );
  } else if (!TWILIO_SID.startsWith("AC")) {
    console.warn(
      "Twilio SID must start with AC. SMS notifications are disabled."
    );
  } else {
    twilioClient = twilio(
      TWILIO_SID,
      TWILIO_AUTH
    );

    console.log(
      "Twilio initialized successfully."
    );
  }
} catch (error) {
  console.warn(
    "Twilio initialization failed:",
    error.message
  );

  twilioClient = null;
}

// =====================================================
// Send SMS
// =====================================================

const sendSMS = async (to, message) => {
  try {
    if (!twilioClient) {
      console.warn(
        "SMS skipped: Twilio is not configured."
      );

      return {
        success: false,
        skipped: true,
        message: "Twilio is not configured",
      };
    }

    if (!TWILIO_PHONE) {
      console.warn(
        "SMS skipped: TWILIO_PHONE is missing."
      );

      return {
        success: false,
        skipped: true,
        message: "TWILIO_PHONE is missing",
      };
    }

    if (!to) {
      console.warn(
        "SMS skipped: recipient phone number is missing."
      );

      return {
        success: false,
        skipped: true,
        message: "Recipient phone number is missing",
      };
    }

    const result = await twilioClient.messages.create({
      body: message,
      from: TWILIO_PHONE,
      to,
    });

    console.log(
      "SMS sent successfully:",
      result.sid
    );

    return {
      success: true,
      sid: result.sid,
    };
  } catch (error) {
    console.error(
      "SMS sending failed:",
      error.message
    );

    return {
      success: false,
      error: error.message,
    };
  }
};

// =====================================================
// Export
// =====================================================

module.exports = {
  sendSMS,
};
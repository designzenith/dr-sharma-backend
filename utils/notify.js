// const twilio = require("twilio");

// const accountSid =
//   process.env.TWILIO_ACCOUNT_SID;

// const apiKey =
//   process.env.TWILIO_API_KEY;

// const apiSecret =
//   process.env.TWILIO_API_SECRET;

// const fromPhone =
//   process.env.TWILIO_PHONE;

// let twilioClient = null;

// try {
//   if (
//     !accountSid ||
//     !apiKey ||
//     !apiSecret
//   ) {
//     console.warn(
//       "Twilio credentials are missing."
//     );
//   } else if (!accountSid.startsWith("AC")) {
//     console.warn(
//       "TWILIO_ACCOUNT_SID must start with AC."
//     );
//   } else if (!apiKey.startsWith("SK")) {
//     console.warn(
//       "TWILIO_API_KEY must start with SK."
//     );
//   } else {
//     twilioClient = twilio(
//       apiKey,
//       apiSecret,
//       {
//         accountSid,
//       }
//     );

//     console.log(
//       "Twilio initialized successfully."
//     );
//   }
// } catch (error) {
//   console.error(
//     "Twilio initialization failed:",
//     error.message
//   );

//   twilioClient = null;
// }

// const sendSMS = async (to, message) => {
//   try {
//     if (!twilioClient) {
//       console.warn(
//         "SMS skipped: Twilio client is not initialized."
//       );

//       return {
//         success: false,
//         skipped: true,
//       };
//     }

//     if (!fromPhone) {
//       console.warn(
//         "SMS skipped: TWILIO_PHONE is missing."
//       );

//       return {
//         success: false,
//         skipped: true,
//       };
//     }

//     if (!to) {
//       console.warn(
//         "SMS skipped: recipient phone is missing."
//       );

//       return {
//         success: false,
//         skipped: true,
//       };
//     }

//     let recipient = String(to).trim();

//     if (!recipient.startsWith("+")) {
//       recipient = `+91${recipient}`;
//     }

//     console.log("Sending SMS...");
//     console.log("From:", fromPhone);
//     console.log("To:", recipient);

//     const result =
//       await twilioClient.messages.create({
//         body: message,
//         from: fromPhone,
//         to: recipient,
//       });

//     console.log(
//       "SMS sent successfully:",
//       result.sid
//     );

//     console.log(
//       "SMS status:",
//       result.status
//     );

//     return {
//       success: true,
//       sid: result.sid,
//       status: result.status,
//     };
//   } catch (error) {
//     console.error(
//       "SMS sending failed:",
//       error.message
//     );

//     return {
//       success: false,
//       error: error.message,
//       code: error.code,
//       status: error.status,
//     };
//   }
// };

// module.exports = {
//   sendSMS,
// };


const twilio = require("twilio");

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromPhone = process.env.TWILIO_PHONE;

let twilioClient = null;

try {
  if (!accountSid || !authToken || !fromPhone) {
    console.warn("Twilio credentials are missing.");
  } else {
    twilioClient = twilio(accountSid, authToken);

    console.log("Twilio initialized successfully.");
  }
} catch (error) {
  console.error(
    "Twilio initialization failed:",
    error.message
  );
  twilioClient = null;
}

const sendSMS = async (to, message) => {
  try {
    if (!twilioClient) {
      console.warn("SMS skipped: Twilio client is not initialized.");
      return {
        success: false,
        skipped: true,
      };
    }

    if (!to) {
      console.warn("SMS skipped: recipient phone is missing.");
      return {
        success: false,
        skipped: true,
      };
    }

    let recipient = String(to).trim();

    if (!recipient.startsWith("+")) {
      recipient = `+91${recipient}`;
    }

    console.log("Sending SMS...");
    console.log("From:", fromPhone);
    console.log("To:", recipient);

    const result = await twilioClient.messages.create({
      body: message,
      from: fromPhone,
      to: recipient,
    });

    console.log("SMS sent successfully:", result.sid);
    console.log("SMS status:", result.status);

    return {
      success: true,
      sid: result.sid,
      status: result.status,
    };
  } catch (error) {
    console.error("SMS sending failed:", error.message);
    console.error("Twilio error code:", error.code);
    console.error("Twilio status:", error.status);

    return {
      success: false,
      error: error.message,
      code: error.code,
      status: error.status,
    };
  }
};

module.exports = {
  sendSMS,
};
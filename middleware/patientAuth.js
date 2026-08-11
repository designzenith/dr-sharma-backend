const auth = require("./auth");

const patientAuth = async (req, res, next) => {
  try {
    // Verify JWT and attach user to req.user
    await new Promise((resolve, reject) => {
      auth(req, res, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });

    // Make sure user exists
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized",
      });
    }

    // Patient only
    if (req.user.role !== "patient") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Patient only.",
      });
    }

    next();

  } catch (error) {
    console.error(
      "PATIENT AUTH ERROR:",
      error
    );

    return res.status(401).json({
      success: false,
      message: "Authorization failed.",
    });
  }
};

module.exports = patientAuth;
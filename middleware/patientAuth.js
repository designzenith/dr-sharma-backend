const auth = require("./auth");

const patientAuth = (req, res, next) => {
  // Verify JWT first
  auth(req, res, () => {
    try {
      if (req.user.role !== "patient") {
        return res.status(403).json({
          success: false,
          message: "Access denied. Patient only.",
        });
      }

      next();
    } catch (error) {
      console.error("PATIENT AUTH ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Authorization failed.",
      });
    }
  });
};

module.exports = patientAuth;
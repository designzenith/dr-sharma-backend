const auth = require("./auth");

const adminAuth = (req, res, next) => {
  // Verify JWT first
  auth(req, res, () => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: "Access denied. Admin only.",
        });
      }

      next();
    } catch (error) {
      console.error("ADMIN AUTH ERROR:", error);

      return res.status(500).json({
        success: false,
        message: "Authorization failed.",
      });
    }
  });
};

module.exports = adminAuth;
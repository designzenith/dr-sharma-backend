const express = require("express");

const router = express.Router();

// =====================================================
// Controller
// =====================================================

const {
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
} = require("../controllers/notificationController");

// =====================================================
// Middleware
// =====================================================

const auth = require("../middleware/auth");

// =====================================================
// GET MY NOTIFICATIONS
// GET /api/notifications
// =====================================================

router.get(
  "/",
  auth,
  getMyNotifications
);

// =====================================================
// MARK ONE NOTIFICATION AS READ
// PUT /api/notifications/:id/read
// =====================================================

router.put(
  "/:id/read",
  auth,
  markNotificationAsRead
);

// =====================================================
// MARK ALL NOTIFICATIONS AS READ
// PUT /api/notifications/read-all
// =====================================================

router.put(
  "/read-all",
  auth,
  markAllNotificationsAsRead
);

// =====================================================
// DELETE ONE NOTIFICATION
// DELETE /api/notifications/:id
// =====================================================

router.delete(
  "/:id",
  auth,
  deleteNotification
);

// =====================================================
// Export
// =====================================================

module.exports = router;
const Notification = require("../models/Notification");

// =====================================================
// CREATE NOTIFICATION
// =====================================================

const createNotification = async ({
  user,
  appointment = null,
  title,
  message,
  type = "general",
}) => {
  try {
    if (!user) {
      console.error(
        "Create notification failed: user is required"
      );

      return null;
    }

    if (!title || !message) {
      console.error(
        "Create notification failed: title and message are required"
      );

      return null;
    }

    const notification =
      await Notification.create({
        user,
        appointment,
        title,
        message,
        type,
        isRead: false,
      });

    console.log(
      "Notification created:",
      notification._id.toString()
    );

    return notification;
  } catch (error) {
    console.error(
      "Create notification error:",
      error
    );

    return null;
  }
};

// =====================================================
// GET MY NOTIFICATIONS
// =====================================================

const getMyNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const notifications =
      await Notification.find({
        user: userId,
      })
        .populate("appointment")
        .sort({
          createdAt: -1,
        });

    return res.status(200).json({
      success: true,
      count: notifications.length,
      notifications,
    });
  } catch (error) {
    console.error(
      "Get notifications error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to fetch notifications",
      error: error.message,
    });
  }
};

// =====================================================
// MARK ONE NOTIFICATION AS READ
// =====================================================

const markNotificationAsRead = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;

    const notification =
      await Notification.findOneAndUpdate(
        {
          _id: req.params.id,
          user: userId,
        },
        {
          $set: {
            isRead: true,
          },
        },
        {
          new: true,
        }
      );

    if (!notification) {
      return res.status(404).json({
        success: false,
        message:
          "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    console.error(
      "Mark notification read error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update notification",
      error: error.message,
    });
  }
};

// =====================================================
// MARK ALL NOTIFICATIONS AS READ
// =====================================================

const markAllNotificationsAsRead = async (
  req,
  res
) => {
  try {
    const userId = req.user.id;

    const result =
      await Notification.updateMany(
        {
          user: userId,
          isRead: false,
        },
        {
          $set: {
            isRead: true,
          },
        }
      );

    return res.status(200).json({
      success: true,
      message:
        "All notifications marked as read",
      modifiedCount:
        result.modifiedCount,
    });
  } catch (error) {
    console.error(
      "Mark all notifications error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Failed to update notifications",
      error: error.message,
    });
  }
};

// =====================================================
// DELETE ONE NOTIFICATION
// =====================================================
const deleteNotification = async (req, res) => {
  try {
    const userId = req.user.id;

    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      user: userId,
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: "Notification not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Delete notification error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to delete notification",
      error: error.message,
    });
  }
};


// =====================================================
// EXPORTS
// =====================================================

module.exports = {
  createNotification,
  getMyNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
};
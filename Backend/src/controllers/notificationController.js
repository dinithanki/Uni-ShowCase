const notificationService = require("../services/notificationService");
const { sendError } = require("../utils/errorResponse");

const getNotifications = async (req, res) => {
  try {
    const result = await notificationService.getUserNotifications(
      req.user,
      req.query,
    );
    return res.status(200).json({
      count: result.notifications.length,
      total: result.total,
      unreadCount: result.unreadCount,
      page: result.page,
      pages: result.pages,
      notifications: result.notifications,
    });
  } catch (error) {
    return sendError(res, error, 500, "Unable to load notifications");
  }
};

const markAsRead = async (req, res) => {
  try {
    const notification = await notificationService.markAsRead(
      req.params.id,
      req.user,
    );
    return res.status(200).json({ message: "Marked as read", notification });
  } catch (error) {
    return sendError(res, error, 404, "Notification not found");
  }
};

const markAllRead = async (req, res) => {
  try {
    await notificationService.markAllRead(req.user);
    return res
      .status(200)
      .json({ message: "All notifications marked as read" });
  } catch (error) {
    return sendError(res, error, 500, "Unable to update notifications");
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllRead,
};

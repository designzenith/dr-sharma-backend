const Appointment = require("../models/Appointment");
const Notification = require("../models/Notification");

// =====================================================
// CREATE NOTIFICATION SAFELY
// =====================================================

const createNotification = async ({
  userId,
  appointmentId,
  title,
  message,
  type,
}) => {
  if (!userId || !appointmentId) {
    return;
  }

  // Prevent duplicate notifications
  const alreadyExists =
    await Notification.findOne({
      user: userId,
      appointment: appointmentId,
      type,
    });

  if (alreadyExists) {
    return;
  }

  await Notification.create({
    user: userId,
    appointment: appointmentId,
    title,
    message,
    type,
  });

  console.log(
    `Notification created for user ${userId}`
  );
};

// =====================================================
// 8 AM SAME DAY REMINDER
// =====================================================

const sendMorningReminders = async () => {
  try {
    const now = new Date();

    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments =
      await Appointment.find({
        appointmentDate: {
          $gte: startOfDay,
          $lte: endOfDay,
        },

        consultationType: "video",

        status: {
          $in: [
            "Pending",
            "Confirmed",
          ],
        },
      });

    console.log(
      `Morning reminders: ${appointments.length} appointments`
    );

    for (const appointment of appointments) {
      const appointmentTime =
        appointment.appointmentTime;

      const message =
        `You have a video consultation today at ${appointmentTime}. Please be ready on time.`;

      // Patient
      await createNotification({
        userId: appointment.patient,
        appointmentId: appointment._id,
        title: "Today's Video Consultation",
        message,
        type: "appointment-reminder",
      });

      // Doctor
      await createNotification({
        userId: appointment.doctor,
        appointmentId: appointment._id,
        title: "Today's Video Consultation",
        message,
        type: "appointment-reminder",
      });
    }
  } catch (error) {
    console.error(
      "Morning reminder error:",
      error
    );
  }
};

// =====================================================
// 30 MINUTE REMINDER
// =====================================================

const send30MinuteReminders = async () => {
  try {
    const now = new Date();

    const thirtyMinutesLater =
      new Date(
        now.getTime() +
          30 * 60 * 1000
      );

    const start = new Date(
      thirtyMinutesLater.getTime() -
        60 * 1000
    );

    const end = new Date(
      thirtyMinutesLater.getTime() +
        60 * 1000
    );

    const appointments =
      await Appointment.find({
        appointmentDate: {
          $gte: start,
          $lte: end,
        },

        consultationType: "video",

        status: {
          $in: [
            "Pending",
            "Confirmed",
          ],
        },
      });

    console.log(
      `30 minute reminders: ${appointments.length}`
    );

    for (const appointment of appointments) {
      const appointmentTime =
        appointment.appointmentTime;

      const message =
        `Your video consultation starts in 30 minutes at ${appointmentTime}. Please be ready to join.`;

      // Patient
      await createNotification({
        userId: appointment.patient,
        appointmentId: appointment._id,
        title: "Consultation Starts in 30 Minutes",
        message,
        type: "appointment-30-minutes",
      });

      // Doctor
      await createNotification({
        userId: appointment.doctor,
        appointmentId: appointment._id,
        title: "Consultation Starts in 30 Minutes",
        message,
        type: "appointment-30-minutes",
      });
    }
  } catch (error) {
    console.error(
      "30 minute reminder error:",
      error
    );
  }
};

module.exports = {
  sendMorningReminders,
  send30MinuteReminders,
};
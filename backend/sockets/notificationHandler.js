const Notification = require('../models/Notification');

module.exports = (io) => {
  io.on('connection', (socket) => {
    // Users join their own personal room when they connect
    socket.on('join_notifications', (userId) => {
      socket.join(`notifications_${userId}`);
      console.log(`User ${userId} joined notifications room`);
    });

    socket.on('disconnect', () => {
      // Room cleanup is handled by socket.io
    });
  });

  // Export a function to send notifications
  const sendNotification = async (recipientId, notificationData) => {
    try {
      io.to(`notifications_${recipientId}`).emit('new_notification', notificationData);
    } catch (err) {
      console.error('Socket notification emit failed', err);
    }
  };

  const sendGroupUpdate = (recipientId, data) => {
    try {
      io.to(`notifications_${recipientId}`).emit('group_update', data);
    } catch (err) {
      console.error('Socket group update emit failed', err);
    }
  };

  return { sendNotification, sendGroupUpdate };
};

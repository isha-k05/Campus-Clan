const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');
const { protect } = require('../middleware/authMiddleware');

// POST /api/notifications - Create a notification
router.post('/', protect, async (req, res) => {
  try {
    const { recipient, type, data } = req.body;
    const notification = await Notification.create({
      recipient,
      sender: req.user.id,
      type,
      data
    });
    
    const populatedNotif = await Notification.findById(notification._id).populate('sender', 'name profilePicture');
    req.notificationHandler?.sendNotification(recipient, populatedNotif);
    
    res.json({ success: true, notification: populatedNotif });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// GET /api/notifications - Get current user's notifications
router.get('/', protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ recipient: req.user.id })
      .populate('sender', 'name profilePicture')
      .sort({ createdAt: -1 });
    res.json({ success: true, notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// PUT /api/notifications/:id/read - Mark notification as read
router.put('/:id/read', protect, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ success: false, message: 'Not found' });
    
    if (notification.recipient.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    
    notification.isRead = true;
    await notification.save();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// DELETE /api/notifications/:id - Delete a specific notification
router.delete('/:id', protect, async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id);
    if (!notification) return res.status(404).json({ success: false, message: 'Not found' });
    
    if (notification.recipient.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }
    
    await Notification.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// DELETE /api/notifications - Clear all notifications for current user
router.delete('/', protect, async (req, res) => {
  try {
    await Notification.deleteMany({ recipient: req.user.id });
    res.json({ success: true, message: 'All notifications cleared' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;

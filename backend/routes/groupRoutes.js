const express = require('express');
const router = express.Router();
const Group = require('../models/Group');
const Message = require('../models/Message');
const { protect } = require('../middleware/authMiddleware');
const Notification = require('../models/Notification');

// POST /api/groups - Create a group
router.post('/', protect, async (req, res) => {
  try {
    const { name, description, groupPicture } = req.body;
    
    const group = await Group.create({
      name,
      description,
      groupPicture: groupPicture || '',
      creator: req.user.id,
      admin: req.user.id,
      members: [req.user.id] // Creator is initial member
    });

    res.status(201).json({ success: true, group });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// GET /api/groups - Get all groups
router.get('/', protect, async (req, res) => {
  try {
    const groups = await Group.find()
      .populate('members', 'name profilePicture')
      .populate('creator', 'name profilePicture')
      .populate('admin', 'name profilePicture');
    res.json({ success: true, groups });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// GET /api/groups/my - Get user's groups
router.get('/my', protect, async (req, res) => {
  try {
    const groups = await Group.find({
      $or: [
        { members: req.user.id },
        { pendingMembers: req.user.id }
      ]
    }).populate('members', 'name profilePicture')
      .populate('admin', 'name profilePicture');
    res.json({ success: true, groups });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// PUT /api/groups/:id - Update group details
router.put('/:id', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
    
    // Only admin can update
    if (group.admin.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only admin can update group details' });
    }

    const { name, description, groupPicture } = req.body;
    if (name) group.name = name;
    if (description !== undefined) group.description = description;
    if (groupPicture !== undefined) group.groupPicture = groupPicture;

    await group.save();
    res.json({ success: true, group });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// POST /api/groups/:id/invite - Invite a user
router.post('/:id/invite', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
    
    if (group.admin.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only admin can invite members' });
    }

    const { userId } = req.body;
    if (!group.members.includes(userId) && !group.pendingMembers.includes(userId)) {
      group.pendingMembers.push(userId);
      await group.save();

      // Create notification
      await Notification.create({
        recipient: userId,
        sender: req.user.id,
        type: 'group_invite',
        data: { groupId: group._id, groupName: group.name, groupPicture: group.groupPicture }
      });
    }
    
    res.json({ success: true, message: 'Invitation sent' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// POST /api/groups/:id/accept - Accept invitation
router.post('/:id/accept', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
    
    if (group.pendingMembers.includes(req.user.id)) {
      group.pendingMembers = group.pendingMembers.filter(id => id.toString() !== req.user.id);
      group.members.push(req.user.id);
      await group.save();

      if (req.notificationHandler) {
        req.notificationHandler.sendGroupUpdate(group.admin, { type: 'invite_accepted', groupId: group._id, senderId: req.user.id });
      }

      res.json({ success: true, message: 'Joined group' });
    } else {
      res.status(400).json({ success: false, message: 'No pending invitation' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// POST /api/groups/:id/decline - Decline invitation
router.post('/:id/decline', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
    
    group.pendingMembers = group.pendingMembers.filter(id => id.toString() !== req.user.id);
    await group.save();

    // Notify admin that user denied the request
    const notification = await Notification.create({
      recipient: group.admin,
      sender: req.user.id,
      type: 'group_invite_denied',
      data: { groupId: group._id, groupName: group.name }
    });

    if (req.notificationHandler) {
      const populatedNotif = await Notification.findById(notification._id).populate('sender', 'name profilePicture');
      req.notificationHandler.sendNotification(group.admin, populatedNotif);
      req.notificationHandler.sendGroupUpdate(group.admin, { type: 'invite_denied', groupId: group._id, senderId: req.user.id });
    }

    res.json({ success: true, message: 'Invitation declined' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/groups/:id/request-join - User requests to join a group
router.post('/:id/request-join', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
    
    // Fallback for old groups missing the admin field
    if (!group.admin) {
      group.admin = group.creator;
    }
    
    if (group.members.includes(req.user.id)) {
      return res.status(400).json({ success: false, message: 'Already a member' });
    }

    if (!group.joinRequests) group.joinRequests = [];

    const alreadyRequested = group.joinRequests.some(id => id.toString() === req.user.id);

    if (!alreadyRequested) {
      group.joinRequests.push(req.user.id);
      await group.save();

      // Notify admin
      const notification = await Notification.create({
        recipient: group.admin,
        sender: req.user.id,
        type: 'group_join_request',
        data: { groupId: group._id, groupName: group.name }
      });

      if (req.notificationHandler) {
        const populatedNotif = await Notification.findById(notification._id).populate('sender', 'name profilePicture');
        req.notificationHandler.sendNotification(group.admin, populatedNotif);
        // Also tell the admin to refresh their groups list if they are on that page
        req.notificationHandler.sendGroupUpdate(group.admin, { type: 'join_request', groupId: group._id });
      }
    }
    
    res.json({ success: true, message: 'Join request sent' });
  } catch (error) {
    console.error('Request join error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/groups/:id/allow-join - Admin allows join request
router.post('/:id/allow-join', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
    
    // Fallback for old groups missing the admin field
    if (!group.admin) {
      group.admin = group.creator;
    }

    if (group.admin.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only admin can allow join requests' });
    }

    const { userId } = req.body;
    if (group.joinRequests && group.joinRequests.includes(userId)) {
      group.joinRequests = group.joinRequests.filter(id => id.toString() !== userId);
      if (!group.members.includes(userId)) {
        group.members.push(userId);
      }
      await group.save();

      // Notify user
      const notification = await Notification.create({
        recipient: userId,
        sender: req.user.id,
        type: 'group_join_allowed',
        data: { groupId: group._id, groupName: group.name }
      });

      if (req.notificationHandler) {
        const populatedNotif = await Notification.findById(notification._id).populate('sender', 'name profilePicture');
        req.notificationHandler.sendNotification(userId, populatedNotif);
        req.notificationHandler.sendGroupUpdate(userId, { type: 'allowed', groupId: group._id });
      }
      
      // Delete the request notification for admin
      await Notification.deleteMany({
        recipient: req.user.id,
        sender: userId,
        type: 'group_join_request',
        'data.groupId': group._id
      });
    }

    res.json({ success: true, message: 'User allowed to join' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/groups/:id/deny-join - Admin denies join request
router.post('/:id/deny-join', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
    
    // Fallback for old groups missing the admin field
    if (!group.admin) {
      group.admin = group.creator;
    }

    if (group.admin.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only admin can deny join requests' });
    }

    const { userId } = req.body;
    if (group.joinRequests && group.joinRequests.includes(userId)) {
      group.joinRequests = group.joinRequests.filter(id => id.toString() !== userId);
      await group.save();

      // Notify user
      const notification = await Notification.create({
        recipient: userId,
        sender: req.user.id,
        type: 'group_join_denied',
        data: { groupId: group._id, groupName: group.name }
      });

      if (req.notificationHandler) {
        const populatedNotif = await Notification.findById(notification._id).populate('sender', 'name profilePicture');
        req.notificationHandler.sendNotification(userId, populatedNotif);
        req.notificationHandler.sendGroupUpdate(userId, { type: 'denied', groupId: group._id });
      }

      // Delete the request notification for admin
      await Notification.deleteMany({
        recipient: req.user.id,
        sender: userId,
        type: 'group_join_request',
        'data.groupId': group._id
      });
    }

    res.json({ success: true, message: 'Join request denied' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/groups/:id/messages - Get messages for a group
router.get('/:id/messages', protect, async (req, res) => {
  try {
    // Check if user is a member (pending members can view but not message logic handled frontend mostly)
    const group = await Group.findById(req.params.id);
    if (!group.members.includes(req.user.id) && !group.pendingMembers.includes(req.user.id)) {
      return res.status(403).json({ success: false, message: 'Not a member of this group' });
    }

    const messages = await Message.find({ group: req.params.id })
      .populate('sender', 'name profilePicture')
      .sort({ createdAt: 1 });
      
    res.json({ success: true, messages });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// POST /api/groups/:id/cancel-join - User cancels their join request
router.post('/:id/cancel-join', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
    
    if (group.joinRequests && group.joinRequests.includes(req.user.id)) {
      group.joinRequests = group.joinRequests.filter(id => id.toString() !== req.user.id);
      await group.save();

      // Delete the join request notification sent to admin
      await Notification.deleteMany({
        recipient: group.admin,
        sender: req.user.id,
        type: 'group_join_request',
        'data.groupId': group._id
      });

      if (req.notificationHandler) {
        req.notificationHandler.sendGroupUpdate(group.admin, { type: 'cancelled', groupId: group._id, senderId: req.user.id });
      }
    }

    res.json({ success: true, message: 'Join request cancelled' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/groups/:id/cancel-invite - Admin cancels an invitation
router.post('/:id/cancel-invite', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
    
    // Fallback for old groups missing the admin field
    if (!group.admin) {
      group.admin = group.creator;
    }

    if (group.admin.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only admin can cancel invitations' });
    }

    const { userId } = req.body;
    if (group.pendingMembers && group.pendingMembers.includes(userId)) {
      group.pendingMembers = group.pendingMembers.filter(id => id.toString() !== userId);
      await group.save();

      // Delete the group invite notification sent to user
      await Notification.deleteMany({
        recipient: userId,
        sender: req.user.id,
        type: 'group_invite',
        'data.groupId': group._id
      });

      if (req.notificationHandler) {
        req.notificationHandler.sendGroupUpdate(userId, { type: 'invite_cancelled', groupId: group._id });
      }
    }

    res.json({ success: true, message: 'Invitation cancelled' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/groups/:id/kick - Admin kicks a member
router.post('/:id/kick', protect, async (req, res) => {
  try {
    const group = await Group.findById(req.params.id);
    if (!group) return res.status(404).json({ success: false, message: 'Group not found' });
    
    // Fallback for old groups missing the admin field
    if (!group.admin) {
      group.admin = group.creator;
    }

    if (group.admin.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Only admin can kick members' });
    }

    const { userId, reason } = req.body;
    if (userId === group.admin.toString()) {
      return res.status(400).json({ success: false, message: 'Admin cannot kick themselves' });
    }

    if (group.members.includes(userId)) {
      group.members = group.members.filter(id => id.toString() !== userId);
      await group.save();

      // Notify the kicked user
      const notification = await Notification.create({
        recipient: userId,
        sender: req.user.id,
        type: 'group_kicked',
        data: { 
          groupId: group._id, 
          groupName: group.name, 
          message: 'The admin of this group has removed you.',
          reason: reason || 'No reason provided'
        }
      });

      if (req.notificationHandler) {
        const populatedNotif = await Notification.findById(notification._id).populate('sender', 'name profilePicture');
        req.notificationHandler.sendNotification(userId, populatedNotif);
        req.notificationHandler.sendGroupUpdate(userId, { type: 'kicked', groupId: group._id });
        // Notify admin to refresh their own view too
        req.notificationHandler.sendGroupUpdate(group.admin, { type: 'member_kicked', groupId: group._id, userId });
      }
    }

    res.json({ success: true, message: 'Member kicked successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;

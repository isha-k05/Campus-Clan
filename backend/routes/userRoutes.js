const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Notification = require('../models/Notification');
const { protect } = require('../middleware/authMiddleware');
const bcrypt = require('bcryptjs');

// GET /api/users/profile - Get current user profile
router.get('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password')
      .populate('followers', 'name profilePicture')
      .populate('following', 'name profilePicture')
      .populate('acceptedChats', 'name profilePicture')
      .populate('declinedChats', 'name profilePicture');
    
    if (user) {
      res.json({ success: true, user });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// PUT /api/users/profile - Update current user profile
router.put('/profile', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const { name, username, bio, college, website, location, profilePicture, password } = req.body;
    
    // If username or college is being changed, verify password
    const isUsernameChanging = username && username !== user.username;
    const isCollegeChanging = college && college !== user.college;

    if (isUsernameChanging || isCollegeChanging) {
      if (!password) {
        return res.status(400).json({ 
          success: false, 
          message: `Password is required to change ${isUsernameChanging ? 'username' : 'college'}` 
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ success: false, message: 'Incorrect password' });
      }

      if (isUsernameChanging) {
        // Check if username is already taken
        const usernameExists = await User.findOne({ username: username.toLowerCase() });
        if (usernameExists) {
          return res.status(400).json({ success: false, message: 'Username is already taken' });
        }

        // Instagram-style rules check (sync with authRoutes)
        const usernameRegex = /^[a-z0-9._]+$/;
        if (!usernameRegex.test(username.toLowerCase())) {
          return res.status(400).json({ 
            success: false, 
            message: 'Username can only contain lowercase letters, numbers, underscores, and periods.' 
          });
        }
        user.username = username.toLowerCase();
      }

      if (isCollegeChanging) {
        user.college = college;
      }
    }

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (profilePicture !== undefined) user.profilePicture = profilePicture;
    if (website !== undefined) user.website = website;
    if (location !== undefined) user.location = location;

    await user.save();
    
    // Select everything except password to return
    const updatedUser = await User.findById(user._id).select('-password');
    res.json({ success: true, user: updatedUser });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// GET /api/users/:id - Get specific user profile (public info)
router.get('/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (user) {
      res.json({ success: true, user });
    } else {
      res.status(404).json({ success: false, message: 'User not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// PUT /api/users/accept-chat/:id - Accept a chat request
router.put('/accept-chat/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Remove from declined if it was there
    user.declinedChats = user.declinedChats.filter(id => id.toString() !== req.params.id);
    
    // Add to accepted if not already there
    if (!user.acceptedChats.some(id => id.toString() === req.params.id)) {
      user.acceptedChats.push(req.params.id);
    }
    
    await user.save();
    res.json({ success: true, message: 'Chat accepted' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// DELETE /api/users/decline-chat/:id - Decline a chat request
router.delete('/decline-chat/:id', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    
    // Remove from accepted if it was there
    user.acceptedChats = user.acceptedChats.filter(id => id.toString() !== req.params.id);
    
    // Add to declined if not already there
    if (!user.declinedChats.some(id => id.toString() === req.params.id)) {
      user.declinedChats.push(req.params.id);
    }
    
    await user.save();
    res.json({ success: true, message: 'Chat declined' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// GET /api/users - Get all users (for searching/finding friends)
router.get('/', protect, async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user.id } }).select('name college bio profilePicture followers following');
    res.json({ success: true, users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// PUT /api/users/:id/follow - Follow/Unfollow user
router.put('/:id/follow', protect, async (req, res) => {
  try {
    if (req.user.id === req.params.id) {
      return res.status(400).json({ success: false, message: 'You cannot follow yourself' });
    }

    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user.id);

    if (!userToFollow || !currentUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const alreadyFollowing = currentUser.following
      .some(id => id.toString() === req.params.id);

    if (alreadyFollowing) {
      // Unfollow
      currentUser.following = currentUser.following.filter(id => id.toString() !== req.params.id);
      userToFollow.followers = userToFollow.followers.filter(id => id.toString() !== req.user.id);
    } else {
      // Follow
      currentUser.following.push(req.params.id);
      userToFollow.followers.push(req.user.id);
    }

    await currentUser.save();
    await userToFollow.save();

    // Send notification only on a new follow (not unfollow)
    if (!alreadyFollowing) {
      try {
        const notif = await Notification.create({
          recipient: req.params.id,
          sender: req.user.id,
          type: 'follow'
        });
        const populatedNotif = await Notification.findById(notif._id)
          .populate('sender', 'name profilePicture');
        req.notificationHandler?.sendNotification(req.params.id, populatedNotif);
      } catch (notifErr) {
        // Notification failure should never break the follow action
        console.error('Notification error (non-fatal):', notifErr.message);
      }
    }

    // Return plain string IDs so frontend comparison always works
    res.json({
      success: true,
      isFollowing: !alreadyFollowing,
      following: currentUser.following.map(id => id.toString())
    });
  } catch (error) {
    console.error('Follow route error:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');

// Temporary OTP storage (In production, use Redis or a DB collection)
const otpStore = new Map();

// Configure Nodemailer
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// POST /api/auth/check-email
router.post('/check-email', async (req, res) => {
  try {
    const { email, college } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (user) {
      // Check if college matches
      if (college && user.college !== college) {
        return res.status(400).json({ 
          success: false, 
          message: `this mail is already used in ${user.college} , please change the correct collage name` 
        });
      }

      return res.json({ 
        success: true, 
        exists: true, 
        isDeactivated: user.status === 'deactivated',
        username: user.username,
        name: user.name 
      });
    }
    
    res.json({ success: true, exists: false });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/auth/send-otp
router.post('/send-otp', async (req, res) => {
  try {
    const { email } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    
    otpStore.set(email.toLowerCase(), { 
      otp, 
      expires: Date.now() + 10 * 60 * 1000 // 10 minutes 
    });

    // Send email
    const mailOptions = {
      from: `"Campus Clan" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: 'Your OTP for Campus Clan',
      text: `Welcome to Campus Clan! Your OTP is: ${otp}. It expires in 10 minutes.`,
      html: `
        <div style="background: #0f0f1a; padding: 24px 10px; font-family: 'Segoe UI', Arial, sans-serif;">
          <div style="max-width: 360px; margin: 0 auto; background: #1a1a2e; border-radius: 16px; overflow: hidden; box-shadow: 0 8px 32px rgba(0,0,0,0.4);">
            
            <!-- Header gradient bar -->
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f64f59 100%); padding: 28px 24px; text-align: center;">
              <p style="margin: 0; color: rgba(255,255,255,0.85); font-size: 11px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase;">Campus Clan</p>
              <h2 style="margin: 8px 0 0; color: #ffffff; font-size: 20px; font-weight: 800; letter-spacing: 0.5px;">Verify Your Identity</h2>
            </div>

            <!-- Body -->
            <div style="padding: 28px 28px 24px; text-align: center;">
              <p style="color: #a0a0c0; font-size: 13px; margin: 0 0 22px; line-height: 1.6;">
                Enter this code to complete your sign-up. It expires in <strong style="color: #c4b5fd;">10 minutes</strong>.
              </p>

              <!-- OTP Badge -->
              <div style="background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 12px; padding: 18px 24px; display: inline-block; margin-bottom: 22px;">
                <span style="font-size: 38px; font-weight: 900; letter-spacing: 12px; color: #ffffff; font-family: 'Courier New', monospace;">${otp}</span>
              </div>

              <p style="color: #6b6b8a; font-size: 11px; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Do not share this code with anyone</p>
            </div>

            <!-- Footer -->
            <div style="background: #12122a; padding: 12px 24px; text-align: center; border-top: 1px solid #2a2a4a;">
              <p style="color: #4a4a6a; font-size: 10px; margin: 0; letter-spacing: 1px;">© 2026 Campus Clan</p>
            </div>
          </div>
        </div>
      `
    };

    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await transporter.sendMail(mailOptions);
      res.json({ success: true, message: 'OTP sent to your mail' });
    } else {
      console.log('OTP for', email, 'is', otp, '(Mocked because SMTP not configured)');
      res.json({ 
        success: true, 
        message: 'OTP sent to your mail (Dev Mode: Check console)', 
        mockOtp: otp // Only for dev convenience
      });
    }
  } catch (error) {
    console.error('Nodemailer error:', error);
    res.status(500).json({ success: false, message: 'Failed to send OTP' });
  }
});

// POST /api/auth/verify-otp
router.post('/verify-otp', async (req, res) => {
  const { email, otp } = req.body;
  const stored = otpStore.get(email.toLowerCase());

  if (!stored || stored.otp !== otp || Date.now() > stored.expires) {
    return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
  }

  res.json({ success: true, message: 'OTP verified' });
});

// POST /api/auth/check-username
router.post('/check-username', async (req, res) => {
  try {
    const { username } = req.body;
    // Instagram-style rules: lowercase, no spaces, only underscores/periods
    const usernameRegex = /^[a-z0-9._]+$/;
    
    if (!usernameRegex.test(username)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Username can only contain lowercase letters, numbers, underscores, and periods.' 
      });
    }

    const user = await User.findOne({ username: username.toLowerCase() });
    if (user) {
      return res.json({ success: true, available: false, message: 'Username is already taken' });
    }
    
    res.json({ success: true, available: true, message: 'Username is available' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, username, password, college, otp } = req.body;

    // Final OTP check
    const stored = otpStore.get(email.toLowerCase());
    if (!stored || stored.otp !== otp || Date.now() > stored.expires) {
      return res.status(400).json({ success: false, message: 'OTP expired or invalid' });
    }

    const userExists = await User.findOne({ 
      $or: [{ email: email.toLowerCase() }, { username: username.toLowerCase() }] 
    });
    
    if (userExists) {
      if (userExists.email === email.toLowerCase() && userExists.status === 'deactivated') {
        // Reactivate deactivated account
        userExists.status = 'active';
        if (name) userExists.name = name;
        if (username) userExists.username = username.toLowerCase();
        const salt = await bcrypt.genSalt(10);
        userExists.password = await bcrypt.hash(password, salt);
        userExists.college = college || userExists.college;
        await userExists.save();

        otpStore.delete(email.toLowerCase());
        return res.status(200).json({
          success: true,
          message: 'Account reactivated successfully',
          _id: userExists._id,
          name: userExists.name,
          username: userExists.username,
          email: userExists.email,
          college: userExists.college,
          token: generateToken(userExists._id)
        });
      }
      return res.status(400).json({ success: false, message: 'User or Username already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
      name,
      email: email.toLowerCase(),
      username: username.toLowerCase(),
      password: hashedPassword,
      college
    });

    otpStore.delete(email.toLowerCase()); // Clean up

    res.status(201).json({
      success: true,
      _id: user._id,
      name: user.name,
      username: user.username,
      email: user.email,
      college: user.college,
      following: user.following || [],
      followers: user.followers || [],
      acceptedChats: user.acceptedChats || [],
      declinedChats: user.declinedChats || [],
      token: generateToken(user._id)
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// POST /api/auth/update-email - Verify and update email
router.post('/update-email', protect, async (req, res) => {
  try {
    const { email, otp } = req.body;
    const stored = otpStore.get(email.toLowerCase());

    if (!stored || stored.otp !== otp || Date.now() > stored.expires) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Check if new email is already in use
    const emailExists = await User.findOne({ email: email.toLowerCase() });
    if (emailExists && emailExists._id.toString() !== req.user.id) {
      return res.status(400).json({ success: false, message: 'Email already in use' });
    }

    user.email = email.toLowerCase();
    await user.save();

    otpStore.delete(email.toLowerCase());
    res.json({ 
      success: true, 
      message: 'Email updated successfully', 
      user: {
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        college: user.college
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });

    if (user && (await bcrypt.compare(password, user.password))) {
      if (user.status === 'deactivated') {
        return res.status(403).json({ 
          success: false, 
          isDeactivated: true,
          message: 'Your account is deactivated. Please sign up to reactivate.' 
        });
      }
      res.json({
        success: true,
        _id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        college: user.college,
        following: user.following || [],
        followers: user.followers || [],
        acceptedChats: user.acceptedChats || [],
        declinedChats: user.declinedChats || [],
        token: generateToken(user._id)
      });
    } else {
      res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

// POST /api/auth/deactivate - Mark account as deactivated
router.post('/deactivate', protect, async (req, res) => {
  try {
    const { password } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Incorrect password' });
    }

    user.status = 'deactivated';
    await user.save();

    res.json({ success: true, message: 'Account deactivated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
});

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

module.exports = router;

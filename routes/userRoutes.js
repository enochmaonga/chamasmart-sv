const express = require('express');
const Counter = require('../models/counter');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const sendEmail = require('../utils/sendEmail');
const User = require('../models/user');
const { verifyToken } = require('../middleware/authMiddleware');

// Register user
router.post('/register', async (req, res) => {
  const { tenantId, firstName, middleName, lastName, email, phoneNumber, userType = 'user' } = req.body;

  if (!tenantId) return res.status(400).json({ message: 'tenantId is required' });

  try {
    // Check if user already exists under this tenant
    const existingUser = await User.findOne({ email, tenantId });
    if (existingUser) return res.status(409).json({ message: 'User already exists' });

    // Get or create tenant-specific counter for memberNumber
    const counter = await Counter.findOneAndUpdate(
      { tenantId, name: 'memberNumber' },
      { $inc: { value: 1 } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    // Create memberNumber like MN001, MN002, MN003...
    const memberNumber = `MN${String(counter.value).padStart(3, '0')}`;

    const newUser = new User({
      tenantId,
      firstName,
      middleName,
      lastName,
      email,
      phoneNumber,
      userType,
      memberNumber,
      createdAt: new Date(),
    });

    await newUser.save();

    // Send password setup email
    const token = jwt.sign({ email, tenantId }, process.env.JWT_SECRET, { expiresIn: '24h' });
    const link = `https://chamasmart.vercel.app/set-password?token=${token}`;
    await sendEmail(email, 'Set Your Password', `Click here to set your password: ${link}`);

    res.status(201).json({
      message: 'User created and email sent.',
      memberNumber
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
});

// Set password
router.post('/set-password', async (req, res) => {
  const { token, password } = req.body;

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { email, tenantId } = decoded;


    const user = await User.findOne({ email, tenantId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.password = await bcrypt.hash(password, 10);
    await user.save();

    res.json({ message: 'Password set successfully' });
  } catch (err) {
    res.status(400).json({ message: 'Invalid or expired token' });
  }
});

// Reset password (send reset email)
router.post('/reset-password', async (req, res) => {
  const { email, tenantId } = req.body;

  try {
    const user = await User.findOne({ email, tenantId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // include tenantId in token
    const token = jwt.sign({ email, tenantId }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const link = `http://localhost:3001/reset-password?token=${token}`;
    await sendEmail(email, 'Reset Your Password', `Click here to reset your password: ${link}`);

    res.json({ message: 'Reset password email sent' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error sending reset email', error: err.message });
  }
});


// Reset password using token
router.post('/reset-password/:token', async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { email, tenantId } = decoded;

    // Find user by email
    const user = await User.findOne({ email, tenantId });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Hash new password
    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    await user.save();

    res.json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: 'Invalid or expired token' });
  }
});


// Get all users
router.get('/users', verifyToken, async (req, res) => {
  const tenantId = req.tenantId;

  try {
    const users = await User.find({ tenantId }).select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Internal server error' });
  }
});

// GET /api/users/by-name?tenantId=xxx&firstName=Jo
router.get('/users/by-name', async (req, res) => {
  try {
    const { tenantId, firstName } = req.query;

    if (!tenantId || !firstName) {
      return res.status(400).json({ message: "tenantId and firstName are required" });
    }

    const users = await User.find({
      tenantId,
      firstName: { $regex: firstName, $options: "i" } // case-insensitive match
    }).select("firstName lastName memberNumber phoneNumber email");

    res.json(users);
  } catch (error) {
    console.error("❌ Error searching users by name:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;

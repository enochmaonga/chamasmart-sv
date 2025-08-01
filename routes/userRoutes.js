const express = require('express');
const Counter = require('../models/counter');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const sendEmail = require('../utils/sendEmail');
const User = require('../models/user');

// Register user
router.post('/register', async (req, res) => {
  const { firstName, middleName, lastName, email, phoneNumber, userType = 'user' } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(409).json({ message: 'User already exists' });

    const counter = await Counter.findOneAndUpdate(
      { name: 'memberNumber' },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );

    const newUser = new User({
      firstName,
      middleName,
      lastName,
      email,
      phoneNumber,
      userType,
      memberNumber: counter.value,
      createdAt: new Date(),
    });

    await newUser.save();

    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '24h' });
    const link = `http://localhost:3000/create-password?token=${token}`;
    await sendEmail(email, 'Set Your Password', `Click here to set your password: ${link}`);

    res.status(201).json({ message: 'User created and email sent.' });
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
    const email = decoded.email;

    const user = await User.findOne({ email });
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
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const token = jwt.sign({ email }, process.env.JWT_SECRET, { expiresIn: '1h' });
    const link = `http://localhost:3000/reset-password?token=${token}`;
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
    const { email } = decoded;

    // Find user by email
    const user = await User.findOne({ email });
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


// Fetch user by phone number
router.get('/by-phone/:phoneNumber', async (req, res) => {
  const { phoneNumber } = req.params;

  try {
    const user = await User.findOne({ phoneNumber });
    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      firstName: user.firstName,
      lastName: user.lastName,
      memberNumber: user.memberNumber,
      userType: user.userType
    });
  } catch (err) {
    console.error('Error fetching user by phone:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all users
router.get('/users', async (req, res) => {
  try {
    const users = await User.find().select('-password'); // Exclude password
    res.json(users);
  } catch (err) {
    console.error('Error fetching users:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;

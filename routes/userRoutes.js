const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Counter = require('../models/counter');
const bcrypt = require('bcrypt');

// POST /api/users/register
router.post('/register', async (req, res) => {
  const { firstName, middleName, lastName, email, password, phoneNumber } = req.body;

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'User with this email already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Get and increment the memberNumber
    const counter = await Counter.findOneAndUpdate(
      { name: 'memberNumber' },
      { $inc: { value: 1 } },
      { new: true, upsert: true }
    );

    // Create new user
    const newUser = new User({
      firstName,
      middleName,
      lastName,
      email,
      password: hashedPassword,
      phoneNumber,
      memberNumber: counter.value,
      createdAt: new Date(),
    });

    await newUser.save();

    const { password: _, ...userData } = newUser.toObject();
    res.status(201).json({ message: 'User registered successfully', user: userData });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error registering user', error: error.message });
  }
});


// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }

  
});

// GET /api/users/by-phone/:phoneNumber
router.get('/by-phone/:phoneNumber', async (req, res) => {
  const { phoneNumber } = req.params;

  try {
    const user = await User.findOne({ phoneNumber });

    if (!user) {
      return res.status(404).json({ error: 'Member not found' });
    }

    const { firstName, lastName, memberNumber } = user;
    res.json({ firstName, lastName, memberNumber: memberNumber });
  } catch (err) {
    console.error('Error fetching user by phone:', err);
    res.status(500).json({ error: 'Server error' });
  }
});


// Login route
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const { password: _, ...userData } = user.toObject(); // remove password before returning
    res.json({ success: true, user: userData });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});


module.exports = router;

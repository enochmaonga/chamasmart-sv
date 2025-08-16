const express = require('express');
const router = express.Router();
const User = require('../models/user');
const Tenant = require('../models/tenantModel');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Login route
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    try {
        // Find user by email
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Validate password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Fetch tenant info by tenantId stored in user
        const tenant = await Tenant.findOne({ tenantId: user.tenantId });
        if (!tenant) {
            return res.status(404).json({ success: false, message: 'Tenant not found' });
        }

        // Remove sensitive info
        const { password: _, ...userData } = user.toObject();

        // Generate JWT
        const token = jwt.sign(
            { id: user._id, email: user.email, tenantId: tenant.tenantId },
            process.env.JWT_SECRET || 'your_jwt_secret',
            { expiresIn: '1d' }
        );

        res.json({
            success: true,
            user: userData,
            tenantId: tenant.tenantId,
            accessToken: token
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ success: false, message: err.message });
    }
});

module.exports = router;

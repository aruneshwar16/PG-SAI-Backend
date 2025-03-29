const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config(); // Ensure environment variables are loaded

// Register Route
router.post('/register', async (req, res) => {
  try {
    console.log('📩 Registration request received:', req.body); // Debugging log

    const { username, name, email, password } = req.body;
    const finalUsername = username || name; // Fallback to `name` if `username` is missing

    if (!finalUsername || !email || !password) {
      return res.status(400).json({ message: 'All fields (username, email, password) are required' });
    }

    // Check if user already exists (by email OR username)
    const existingUser = await User.findOne({ $or: [{ email }, { username: finalUsername }] });
    if (existingUser) {
      console.log('❌ User already exists:', email); // Debugging log
      return res.status(400).json({ message: 'User with this email or username already exists' });
    }

    // Hash password before saving
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      username: finalUsername,
      email,
      password: hashedPassword // Store hashed password
    });

    console.log('📝 Attempting to save user:', { username: finalUsername, email }); // Debug log
    await newUser.save();
    console.log('✅ User saved successfully:', newUser._id); // Debug log

    // Generate token
    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      token,
      userId: newUser._id,
      username: newUser.username,
      message: '✅ Registration successful'
    });
  } catch (error) {
    console.error('⚠️ Registration error:', error); // Debug log
    res.status(500).json({ message: '❌ Error creating user', error: error.message });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('🔑 Login request received:', email); // Debug log

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ Login failed: User not found'); // Debug log
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password using bcrypt
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('❌ Login failed: Incorrect password'); // Debug log
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });

    console.log('✅ Login successful:', user.username); // Debug log
    res.json({ token, userId: user._id, username: user.username, message: '✅ Login successful' });
  } catch (error) {
    console.error('⚠️ Login error:', error); // Debug log
    res.status(500).json({ message: '❌ Error logging in', error: error.message });
  }
});

module.exports = router;

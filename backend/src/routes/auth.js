const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config(); // Ensure environment variables are loaded

// Register Route
router.post('/register', async (req, res) => {
  try {
    console.log('📩 Registration request received:', req.body);

    const { username, name, email, password } = req.body;
    const finalUsername = username || name;

    // Validate required fields
    if (!finalUsername || !email || !password) {
      console.log('❌ Missing required fields');
      return res.status(400).json({ 
        message: 'All fields (username, email, password) are required',
        missingFields: {
          username: !finalUsername,
          email: !email,
          password: !password
        }
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Invalid email format:', email);
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username: finalUsername }] });
    if (existingUser) {
      console.log('❌ User already exists:', { email, username: finalUsername });
      return res.status(400).json({ 
        message: 'User with this email or username already exists',
        existingFields: {
          email: existingUser.email === email,
          username: existingUser.username === finalUsername
        }
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new User({
      username: finalUsername,
      email,
      password: hashedPassword
    });

    console.log('📝 Attempting to save user:', { username: finalUsername, email });
    await newUser.save();
    console.log('✅ User saved successfully:', newUser._id);

    // Generate token
    const token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: '24h' });

    res.status(201).json({
      token,
      userId: newUser._id,
      username: newUser.username,
      message: '✅ Registration successful'
    });
  } catch (error) {
    console.error('⚠️ Registration error:', error);
    res.status(500).json({ 
      message: '❌ Error creating user', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Login Route
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('🔑 Login request received:', email);

    // Validate required fields
    if (!email || !password) {
      console.log('❌ Missing required fields for login');
      return res.status(400).json({ 
        message: 'Email and password are required',
        missingFields: {
          email: !email,
          password: !password
        }
      });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ Login failed: User not found');
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      console.log('❌ Login failed: Incorrect password');
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate token
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '24h' });

    console.log('✅ Login successful:', user.username);
    res.json({ 
      token, 
      userId: user._id, 
      username: user.username, 
      message: '✅ Login successful' 
    });
  } catch (error) {
    console.error('⚠️ Login error:', error);
    res.status(500).json({ 
      message: '❌ Error logging in', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router;

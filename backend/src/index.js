const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const authRoutes = require('./routes/auth');
const reviewRoutes = require('./routes/reviews');
const galleryRoutes = require('./routes/gallery');
const jwt = require('jsonwebtoken');

dotenv.config();

const app = express();

// CORS configuration
app.use(cors({
  origin: [
    'https://saipg-womens-hostel-azure.vercel.app',
    'http://localhost:3000',
    'http://localhost:5002'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],
  credentials: false,
  maxAge: 86400
}));

// Handle preflight requests
app.options('*', (req, res) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.header('Access-Control-Allow-Credentials', 'false');
    res.header('Access-Control-Max-Age', '86400');
  }
  res.status(204).end();
});

// Add CORS headers to all responses
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Credentials', 'false');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  }
  next();
});

// Middleware for parsing JSON
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Create uploads directory if it doesn't exist
const fs = require('fs');
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ 
      message: 'Authentication required',
      error: 'No token provided'
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    return res.status(403).json({ 
      message: 'Invalid token',
      error: error.message
    });
  }
};

// Test endpoint with better error handling
app.get('/api/test', (req, res) => {
  try {
    console.log('Test endpoint hit:', {
      timestamp: new Date().toISOString(),
      origin: req.headers.origin,
      method: req.method
    });
    
    res.json({ 
      message: 'Backend is running',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      status: 'success',
      cors: {
        origin: req.headers.origin,
        allowed: true
      }
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    res.status(500).json({
      message: 'Error in test endpoint',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/reviews', authenticateToken, reviewRoutes);
app.use('/api/gallery', authenticateToken, galleryRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Server is working!',
    status: 'active',
    version: '1.0.0',
    endpoints: {
      test: '/api/test',
      auth: {
        register: '/api/auth/register [POST]',
        login: '/api/auth/login [POST]'
      },
      reviews: {
        getAll: '/api/reviews [GET]',
        create: '/api/reviews [POST]',
        myReviews: '/api/reviews/my-reviews [GET]'
      },
      gallery: {
        getAll: '/api/gallery [GET]',
        upload: '/api/gallery [POST]'
      }
    }
  });
});

// Catch-all route for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Route not found',
    availableEndpoints: {
      auth: {
        register: '/api/auth/register',
        login: '/api/auth/login'
      },
      reviews: {
        getAllReviews: '/api/reviews',
        createReview: '/api/reviews',
        getUserReviews: '/api/reviews/my-reviews'
      },
      gallery: {
        getAllImages: '/api/gallery',
        uploadImage: '/api/gallery'
      }
    }
  });
});

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`Test the server at: http://localhost:${PORT}/test`);
}); 
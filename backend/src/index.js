const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const authRoutes = require('./routes/auth');
const reviewRoutes = require('./routes/reviews');
const galleryRoutes = require('./routes/gallery');

dotenv.config();

const app = express();

// CORS configuration
app.use(cors({
  origin: [
    'http://saipg-womens-hostel-azure.vercel.app',
    'https://saipg-womens-hostel-azure.vercel.app',
    'http://localhost:3000',
    'https://pg-sai-backend.onrender.com',
    'http://localhost:5002',
    'http://127.0.0.1:5002',
    'http://127.0.0.1:3000',
    'capacitor://localhost',
    'http://localhost',
    'http://localhost:8080',
    'http://localhost:4200',
    'http://192.168.1.1:3000',
    'http://192.168.1.1:5002',
    'http://192.168.1.1:8080',
    'http://192.168.1.1',
    'http://192.168.1.1:80',
    'http://192.168.1.1:443',
    'http://10.0.0.1',
    'http://10.0.0.1:80',
    'http://10.0.0.1:443'
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Headers',
    'Access-Control-Allow-Methods',
    'Access-Control-Allow-Credentials',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: [
    'Content-Length',
    'X-Requested-With',
    'Authorization',
    'Access-Control-Allow-Origin',
    'Access-Control-Allow-Credentials'
  ],
  credentials: false,
  maxAge: 86400, // 24 hours
  preflightContinue: false,
  optionsSuccessStatus: 204
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

// Root route
app.get('/', (req, res) => {
  res.json({
    message: 'Server is working!',
    status: 'active',
    version: '1.0.0',
    endpoints: {
      test: '/test',
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

// Test route
app.get('/test', (req, res) => {
  res.json({ 
    message: 'Backend server is running',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ message: 'Internal server error', error: err.message });
});

// MongoDB Connection
console.log('Attempting to connect to MongoDB...');

mongoose.set('strictQuery', false);

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log(`MongoDB Connected successfully✅: ${conn.connection.host}`);
    console.log('Database name:', conn.connection.name);
  } catch (error) {
    console.error('MongoDB connection error:', error);
    console.error('Error details:', {
      name: error.name,
      message: error.message,
      code: error.code
    });
    process.exit(1);
  }
};

// Connect to MongoDB
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/gallery', galleryRoutes);

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
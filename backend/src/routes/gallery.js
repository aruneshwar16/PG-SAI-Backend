const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Gallery = require('../models/Gallery');
const multer = require('multer');
const path = require('path');

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Only image files are allowed!'));
  }
});

// Get all gallery images
router.get('/', async (req, res) => {
  try {
    const images = await Gallery.find()
      .populate('uploadedBy', 'username')
      .sort({ createdAt: -1 });
    res.json(images);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching gallery images', error: error.message });
  }
});

// Upload a new image (requires authentication)
router.post('/', auth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file provided' });
    }

    const imageUrl = `/uploads/${req.file.filename}`;
    const gallery = new Gallery({
      imageUrl,
      title: req.body.title || 'Untitled',
      description: req.body.description,
      uploadedBy: req.userId
    });

    await gallery.save();
    await gallery.populate('uploadedBy', 'username');
    
    res.status(201).json(gallery);
  } catch (error) {
    res.status(500).json({ message: 'Error uploading image', error: error.message });
  }
});

// Delete an image (requires authentication)
router.delete('/:id', auth, async (req, res) => {
  try {
    const image = await Gallery.findOneAndDelete({ 
      _id: req.params.id, 
      uploadedBy: req.userId 
    });
    
    if (!image) {
      return res.status(404).json({ message: 'Image not found or unauthorized' });
    }

    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting image', error: error.message });
  }
});

module.exports = router; 
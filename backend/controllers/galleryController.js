const Gallery = require('../models/Gallery');
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'dtlnlads6',
  api_key: '441599743879755',
  api_secret: 'nq7qOjfzP7xfWW0JgUTVXafr0K0'
});

// Configure multer storage
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'gallery',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }],
    resource_type: 'auto'
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Upload image to gallery
exports.uploadImage = async (req, res) => {
  try {
    console.log('Upload request received:', {
      file: req.file,
      body: req.body,
      user: req.user
    });

    if (!req.file) {
      console.log('No file uploaded');
      return res.status(400).json({ message: 'Please select an image to upload' });
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ message: 'Only JPG, PNG and GIF images are allowed' });
    }

    // Create new gallery entry
    const gallery = new Gallery({
      title: req.body.title || 'Untitled',
      description: req.body.description || 'No description provided',
      imageUrl: req.file.path,
      cloudinaryId: req.file.filename,
      uploadedBy: req.user._id
    });

    console.log('Saving gallery entry:', gallery);

    await gallery.save();
    
    // Populate the uploadedBy field with user details
    await gallery.populate('uploadedBy', 'name');
    
    console.log('Gallery entry saved successfully');
    res.status(201).json({
      message: 'Image uploaded successfully',
      gallery
    });
  } catch (error) {
    console.error('Upload error:', error);
    
    // Handle specific errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Invalid data provided',
        errors: Object.values(error.errors).map(err => err.message)
      });
    }
    
    res.status(500).json({ 
      message: 'Error uploading image', 
      error: error.message
    });
  }
};

// Get all gallery images
exports.getAllImages = async (req, res) => {
  try {
    const images = await Gallery.find()
      .sort({ createdAt: -1 });
    res.json(images);
  } catch (error) {
    console.error('Error fetching images:', error);
    res.status(500).json({ message: error.message });
  }
};

// Delete gallery image
exports.deleteImage = async (req, res) => {
  try {
    const image = await Gallery.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Delete from Cloudinary
    if (image.cloudinaryId) {
      await cloudinary.uploader.destroy(image.cloudinaryId);
    }

    // Delete from database
    await image.deleteOne();
    res.json({ message: 'Image deleted successfully' });
  } catch (error) {
    console.error('Error deleting image:', error);
    res.status(500).json({ message: error.message });
  }
};

// Update gallery image
exports.updateImage = async (req, res) => {
  try {
    const image = await Gallery.findById(req.params.id);
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    if (req.body.title) image.title = req.body.title;
    if (req.body.description) image.description = req.body.description;

    await image.save();
    res.json(image);
  } catch (error) {
    console.error('Error updating image:', error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  upload,
  uploadImage: exports.uploadImage,
  getAllImages: exports.getAllImages,
  deleteImage: exports.deleteImage,
  updateImage: exports.updateImage
}; 
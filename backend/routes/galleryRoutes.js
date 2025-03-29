const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const {
  upload,
  uploadImage,
  getAllImages,
  deleteImage,
  updateImage
} = require('../controllers/galleryController');

// Public routes
router.get('/', getAllImages);

// Protected routes (require authentication)
router.post('/', protect, authorize('admin'), upload.single('image'), uploadImage);
router.delete('/:id', protect, authorize('admin'), deleteImage);
router.put('/:id', protect, authorize('admin'), updateImage);

module.exports = router; 
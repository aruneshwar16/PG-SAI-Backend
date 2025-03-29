const express = require('express');
const router = express.Router();
const { createReview, getReviews, deleteReview } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

// Review routes
router.route('/')
  .get(getReviews)
  .post(protect, createReview);

router.route('/:id')
  .delete(protect, deleteReview);

module.exports = router; 
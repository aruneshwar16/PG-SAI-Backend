const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Review = require('../models/Review');

// Get all reviews
router.get('/', async (req, res) => {
  try {
    console.log('Fetching all reviews...');
    const reviews = await Review.find()
      .populate('user', 'username')
      .sort({ createdAt: -1 });
    console.log(`Found ${reviews.length} reviews`);
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ 
      message: 'Error fetching reviews', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Create a new review (requires authentication)
router.post('/', auth, async (req, res) => {
  try {
    console.log('Creating new review:', req.body);
    const { rating, comment } = req.body;
    
    if (!rating || !comment) {
      return res.status(400).json({ 
        message: 'Rating and comment are required' 
      });
    }

    const review = new Review({
      user: req.userId,
      rating,
      comment
    });

    await review.save();
    await review.populate('user', 'username');
    
    console.log('Review created successfully:', review._id);
    res.status(201).json(review);
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ 
      message: 'Error creating review', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get user's reviews (requires authentication)
router.get('/my-reviews', auth, async (req, res) => {
  try {
    console.log('Fetching reviews for user:', req.userId);
    const reviews = await Review.find({ user: req.userId })
      .populate('user', 'username')
      .sort({ createdAt: -1 });
    console.log(`Found ${reviews.length} reviews for user`);
    res.json(reviews);
  } catch (error) {
    console.error('Error fetching user reviews:', error);
    res.status(500).json({ 
      message: 'Error fetching reviews', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Update a review (requires authentication)
router.put('/:id', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    console.log('Updating review:', { id: req.params.id, rating, comment });

    const review = await Review.findOne({ _id: req.params.id, user: req.userId });

    if (!review) {
      return res.status(404).json({ message: 'Review not found or unauthorized' });
    }

    review.rating = rating;
    review.comment = comment;
    await review.save();
    await review.populate('user', 'username');

    console.log('Review updated successfully:', review._id);
    res.json(review);
  } catch (error) {
    console.error('Error updating review:', error);
    res.status(500).json({ 
      message: 'Error updating review', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Delete a review (requires authentication)
router.delete('/:id', auth, async (req, res) => {
  try {
    console.log('Deleting review:', req.params.id);
    const review = await Review.findOneAndDelete({ 
      _id: req.params.id, 
      user: req.userId 
    });
    
    if (!review) {
      return res.status(404).json({ message: 'Review not found or unauthorized' });
    }

    console.log('Review deleted successfully:', req.params.id);
    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ 
      message: 'Error deleting review', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

module.exports = router; 
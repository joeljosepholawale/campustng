import { Router } from 'express';
import { reviewController } from '../controllers/review.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

// Create a new review (requires authentication)
router.post('/', protect, reviewController.createReview);

// Get all reviews for a specific user
router.get('/user/:userId', reviewController.getUserReviews);

export default router;

import express from 'express';
import { initializeBoostPayment } from '../controllers/payment.controller';
import { protect } from '../middlewares/auth.middleware';

const router = express.Router();

// Initialize payment (requires auth)
router.post('/boost/initialize', protect, initializeBoostPayment);

export default router;

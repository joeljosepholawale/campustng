import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.get('/seller', protect, analyticsController.getSellerAnalytics);

export default router;

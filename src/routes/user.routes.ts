import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.get('/saved-searches', protect, userController.getSavedSearches);
router.post('/saved-searches', protect, userController.createSavedSearch);
router.delete('/saved-searches/:id', protect, userController.deleteSavedSearch);

router.put('/push-token', protect, userController.updatePushToken);

router.post('/verify-id', protect, userController.submitIdVerification);

router.post('/follow/:id', protect, userController.followUser);
router.delete('/unfollow/:id', protect, userController.unfollowUser);
router.put('/storefront', protect, userController.updateStorefront);

export default router;

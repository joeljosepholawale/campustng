import { Router } from 'express';
import { registerUser, loginUser, getMe, updateProfile, verifyEmail, resendVerification, updatePushToken, reportUser, getPublicUser, forgotPassword, resetPassword } from '../controllers/auth.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify', protect, verifyEmail);
router.post('/resend-verification', protect, resendVerification);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/push-token', protect, updatePushToken);
router.post('/report', protect, reportUser);
router.get('/user/:id', getPublicUser);

export default router;

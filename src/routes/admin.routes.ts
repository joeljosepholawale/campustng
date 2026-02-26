import { Router, Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { adminController } from '../controllers/admin.controller';
import { protect } from '../middlewares/auth.middleware';

const prisma = new PrismaClient();
const router = Router();

// Middleware to strictly verify user is an Admin
const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const userId = (req as any).user?.id;

        if (!userId) {
            return res.status(401).json({ message: 'Not authorized' });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });

        if (user && user.isAdmin) {
            next();
        } else {
            res.status(403).json({ message: 'Forbidden. Admin access required.' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Server error verifying admin status' });
    }
};

// Protect all admin routes with authentication AND admin checks
router.use(protect);
router.use(isAdmin);

router.get('/metrics', adminController.getDashboardMetrics);
router.get('/schools/pending', adminController.getPendingSchools);
router.put('/schools/:schoolId/approve', adminController.approveSchool);
router.delete('/schools/:schoolId', adminController.denySchool);

router.get('/reports', adminController.getReports);
router.put('/reports/:reportId/resolve', adminController.resolveReport);
router.put('/reports/:reportId/dismiss', adminController.dismissReport);

router.get('/boost-plans', adminController.getBoostPlans);
router.post('/boost-plans', adminController.createBoostPlan);
router.put('/boost-plans/:planId', adminController.updateBoostPlan);

// --- NEW ADMIN ROUTES ---
// User Management
router.get('/users', adminController.getUsers);
router.put('/users/:userId/status', adminController.updateUserStatus);
router.post('/notifications/broadcast', adminController.sendBroadcast);

// Student ID Verification
router.get('/verifications', adminController.getPendingVerifications);
router.put('/verifications/:id/review', adminController.reviewVerification);

// Content Moderation
router.get('/products', adminController.getProducts);
router.put('/products/:id/status', adminController.toggleProductStatus);

router.get('/services', adminController.getServices);
router.put('/services/:id/status', adminController.toggleServiceStatus);

router.get('/requests', adminController.getRequests);
router.put('/requests/:id/status', adminController.toggleRequestStatus);

// Category Management
router.get('/categories', adminController.getCategories);
router.post('/categories', adminController.createCategory);
router.put('/categories/:id', adminController.updateCategory);
router.delete('/categories/:id', adminController.deleteCategory);

// Transactions
router.get('/transactions', adminController.getTransactions);

export default router;

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendPushNotification } from '../utils/pushNotifications';

const prisma = new PrismaClient();

export const adminController = {
    // Get high-level database metrics
    getDashboardMetrics: async (req: Request, res: Response) => {
        try {
            // Note: Middleware `isAdmin` should block non-admins before reaching here
            const totalUsers = await prisma.user.count();
            const totalProducts = await prisma.product.count();
            const totalServices = await prisma.service.count();
            const totalRequests = await prisma.request.count();
            const totalConversations = await prisma.conversation.count();
            const totalSchools = await prisma.school.count();

            res.json({
                users: totalUsers,
                products: totalProducts,
                services: totalServices,
                requests: totalRequests,
                conversations: totalConversations,
                schools: totalSchools,
            });
        } catch (error) {
            console.error('Failed to fetch admin metrics', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },

    // --- USER MANAGEMENT ---

    // Get all users
    getUsers: async (req: Request, res: Response) => {
        try {
            const { search } = req.query;
            const users = await prisma.user.findMany({
                where: search ? {
                    OR: [
                        { firstName: { contains: String(search), mode: 'insensitive' } },
                        { lastName: { contains: String(search), mode: 'insensitive' } },
                        { email: { contains: String(search), mode: 'insensitive' } },
                        { matricNumber: { contains: String(search), mode: 'insensitive' } },
                    ]
                } : undefined,
                include: {
                    school: { select: { name: true } }
                },
                orderBy: { createdAt: 'desc' },
                take: 100 // Limit initially
            });
            res.json(users);
        } catch (error) {
            console.error('Failed to fetch users', error);
            res.status(500).json({ message: 'Failed to fetch users' });
        }
    },

    // Update user status (ban/unban/promote)
    updateUserStatus: async (req: Request, res: Response) => {
        try {
            const userId = parseInt(req.params.userId as string);
            const { isActive, isAdmin } = req.body;
            const currentAdminId = (req as any).user?.id;

            if (isActive === false && userId === currentAdminId) {
                return res.status(400).json({ message: "Cannot ban yourself" });
            }

            const updateData: any = {};
            if (isActive !== undefined) updateData.isActive = isActive;
            if (isAdmin !== undefined) updateData.isAdmin = isAdmin;

            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: updateData
            });

            res.json(updatedUser);
        } catch (error) {
            console.error('Failed to update user status', error);
            res.status(500).json({ message: 'Failed to update user status' });
        }
    },

    // --- CONTENT MODERATION ---

    getProducts: async (req: Request, res: Response) => {
        try {
            const { search } = req.query;
            const products = await prisma.product.findMany({
                where: search ? {
                    OR: [
                        { title: { contains: String(search), mode: 'insensitive' } },
                        { description: { contains: String(search), mode: 'insensitive' } }
                    ]
                } : undefined,
                include: {
                    user: { select: { firstName: true, lastName: true, email: true } },
                    category: { select: { name: true } }
                },
                orderBy: { createdAt: 'desc' },
                take: 100
            });
            res.json(products);
        } catch (error) {
            console.error('Failed to fetch products', error);
            res.status(500).json({ message: 'Failed to fetch products' });
        }
    },

    toggleProductStatus: async (req: Request, res: Response) => {
        try {
            const productId = parseInt(req.params.id as string);
            const { isActive } = req.body;
            const updatedProduct = await prisma.product.update({
                where: { id: productId },
                data: { isActive }
            });
            res.json(updatedProduct);
        } catch (error) {
            console.error('Failed to toggle product status', error);
            res.status(500).json({ message: 'Failed to toggle product status' });
        }
    },

    getServices: async (req: Request, res: Response) => {
        try {
            const { search } = req.query;
            const services = await prisma.service.findMany({
                where: search ? {
                    OR: [
                        { title: { contains: String(search), mode: 'insensitive' } },
                        { description: { contains: String(search), mode: 'insensitive' } }
                    ]
                } : undefined,
                include: {
                    user: { select: { firstName: true, lastName: true, email: true } }
                },
                orderBy: { createdAt: 'desc' },
                take: 100
            });
            res.json(services);
        } catch (error) {
            console.error('Failed to fetch services', error);
            res.status(500).json({ message: 'Failed to fetch services' });
        }
    },

    toggleServiceStatus: async (req: Request, res: Response) => {
        try {
            const serviceId = parseInt(req.params.id as string);
            const { isActive } = req.body;
            const updatedService = await prisma.service.update({
                where: { id: serviceId },
                data: { isActive }
            });
            res.json(updatedService);
        } catch (error) {
            console.error('Failed to toggle service status', error);
            res.status(500).json({ message: 'Failed to toggle service status' });
        }
    },

    getRequests: async (req: Request, res: Response) => {
        try {
            const { search } = req.query;
            const requests = await prisma.request.findMany({
                where: search ? {
                    OR: [
                        { title: { contains: String(search), mode: 'insensitive' } },
                        { description: { contains: String(search), mode: 'insensitive' } }
                    ]
                } : undefined,
                include: {
                    user: { select: { firstName: true, lastName: true, email: true } }
                },
                orderBy: { createdAt: 'desc' },
                take: 100
            });
            res.json(requests);
        } catch (error) {
            console.error('Failed to fetch requests', error);
            res.status(500).json({ message: 'Failed to fetch requests' });
        }
    },

    toggleRequestStatus: async (req: Request, res: Response) => {
        try {
            const requestId = parseInt(req.params.id as string);
            const { isActive } = req.body;
            const updatedRequest = await prisma.request.update({
                where: { id: requestId },
                data: { isActive }
            });
            res.json(updatedRequest);
        } catch (error) {
            console.error('Failed to toggle request status', error);
            res.status(500).json({ message: 'Failed to toggle request status' });
        }
    },

    // --- CATEGORY MANAGEMENT ---

    getCategories: async (req: Request, res: Response) => {
        try {
            const categories = await prisma.category.findMany({
                orderBy: { name: 'asc' }
            });
            res.json(categories);
        } catch (error) {
            console.error('Failed to fetch categories', error);
            res.status(500).json({ message: 'Failed to fetch categories' });
        }
    },

    createCategory: async (req: Request, res: Response) => {
        try {
            const { name, description } = req.body;
            const newCategory = await prisma.category.create({
                data: { name, description }
            });
            res.status(201).json(newCategory);
        } catch (error) {
            console.error('Failed to create category', error);
            res.status(500).json({ message: 'Failed to create category' });
        }
    },

    updateCategory: async (req: Request, res: Response) => {
        try {
            const categoryId = parseInt(req.params.id as string);
            const { name, description } = req.body;
            const updatedCategory = await prisma.category.update({
                where: { id: categoryId },
                data: { name, description }
            });
            res.json(updatedCategory);
        } catch (error) {
            console.error('Failed to update category', error);
            res.status(500).json({ message: 'Failed to update category' });
        }
    },

    deleteCategory: async (req: Request, res: Response) => {
        try {
            const categoryId = parseInt(req.params.id as string);
            // Delete requires ensuring no products depend on it.
            // If there are products, this will fail unless we handle it.
            const productsCount = await prisma.product.count({ where: { categoryId } });
            if (productsCount > 0) {
                return res.status(400).json({ message: `Cannot delete category. ${productsCount} products are using it.` });
            }

            await prisma.category.delete({
                where: { id: categoryId }
            });
            res.json({ message: 'Category deleted successfully' });
        } catch (error) {
            console.error('Failed to delete category', error);
            res.status(500).json({ message: 'Failed to delete category' });
        }
    },

    // --- TRANSACTIONS ---

    getTransactions: async (req: Request, res: Response) => {
        try {
            const transactions = await prisma.transaction.findMany({
                orderBy: { createdAt: 'desc' },
                take: 100
            });
            res.json(transactions);
        } catch (error) {
            console.error('Failed to fetch transactions', error);
            res.status(500).json({ message: 'Failed to fetch transactions' });
        }
    },

    // Get pending schools
    getPendingSchools: async (req: Request, res: Response) => {
        try {
            const pendingSchools = await prisma.school.findMany({
                where: { isApproved: false },
                take: 50,
                orderBy: { createdAt: 'desc' }
            });
            res.json(pendingSchools);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to fetch pending schools' });
        }
    },

    // Approve a school
    approveSchool: async (req: Request, res: Response) => {
        try {
            const schoolId = req.params.schoolId as string;
            const updatedSchool = await prisma.school.update({
                where: { id: parseInt(schoolId) },
                data: { isApproved: true }
            });
            res.json(updatedSchool);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to approve school' });
        }
    },

    // Deny (Delete) a school
    denySchool: async (req: Request, res: Response) => {
        try {
            const schoolId = req.params.schoolId as string;
            await prisma.school.delete({
                where: { id: parseInt(schoolId) }
            });
            res.json({ message: 'School denied and removed successfully' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to deny school' });
        }
    },

    // Get all user reports
    getReports: async (req: Request, res: Response) => {
        try {
            const reports = await prisma.report.findMany({
                take: 50,
                include: {
                    reporter: { select: { id: true, firstName: true, lastName: true, email: true } },
                    reportedUser: { select: { id: true, firstName: true, lastName: true, email: true } }
                },
                orderBy: { createdAt: 'desc' }
            });
            res.json(reports);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to fetch reports' });
        }
    },

    // Mark report as resolved
    resolveReport: async (req: Request, res: Response) => {
        try {
            const reportId = req.params.reportId as string;
            const updatedReport = await prisma.report.update({
                where: { id: parseInt(reportId) },
                data: { status: 'RESOLVED' }
            });
            res.json(updatedReport);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to resolve report' });
        }
    },

    // Mark report as dismissed
    dismissReport: async (req: Request, res: Response) => {
        try {
            const reportId = req.params.reportId as string;
            const updatedReport = await prisma.report.update({
                where: { id: parseInt(reportId) },
                data: { status: 'DISMISSED' }
            });
            res.json(updatedReport);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to dismiss report' });
        }
    },

    // --- BOOST PLANS MANAGEMENT ---

    // Get all boost plans
    getBoostPlans: async (req: Request, res: Response) => {
        try {
            const plans = await prisma.boostPlan.findMany({
                orderBy: { price: 'asc' }
            });
            res.json(plans);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to fetch boost plans' });
        }
    },

    // Create new boost plan
    createBoostPlan: async (req: Request, res: Response) => {
        try {
            const { name, price, durationDays, isActive } = req.body;
            const newPlan = await prisma.boostPlan.create({
                data: {
                    name,
                    price: parseFloat(price),
                    durationDays: parseInt(durationDays),
                    isActive: isActive !== undefined ? isActive : true
                }
            });
            res.status(201).json(newPlan);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to create boost plan' });
        }
    },

    // Update boost plan
    updateBoostPlan: async (req: Request, res: Response) => {
        try {
            const planId = req.params.planId as string;
            const { name, price, durationDays, isActive } = req.body;

            const updatedPlan = await prisma.boostPlan.update({
                where: { id: parseInt(planId) },
                data: {
                    ...(name && { name }),
                    ...(price !== undefined && { price: parseFloat(price) }),
                    ...(durationDays !== undefined && { durationDays: parseInt(durationDays) }),
                    ...(isActive !== undefined && { isActive })
                }
            });
            res.json(updatedPlan);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Failed to update boost plan' });
        }
    },

    // Broadcast Push Notification
    sendBroadcast: async (req: Request, res: Response) => {
        try {
            const { title, message } = req.body;

            if (!title || !message) {
                return res.status(400).json({ message: 'Title and message are required' });
            }

            // Get all user IDs (can be optimized or paginated for huge counts in production)
            const users = await prisma.user.findMany({ select: { id: true } });
            const userIds = users.map(u => u.id);

            const result = await sendPushNotification({
                userIds,
                title,
                body: message,
                type: 'SYSTEM',
                data: { route: 'Notifications' }
            });

            res.json({ message: 'Broadcast initiated successfully', result });
        } catch (error) {
            console.error('Failed to send broadcast', error);
            res.status(500).json({ message: 'Failed to send broadcast' });
        }
    },

    // --- STUDENT ID VERIFICATION ---
    getPendingVerifications: async (req: Request, res: Response) => {
        try {
            const pending = await prisma.user.findMany({
                where: { idCardUrl: { not: null }, isIdVerified: false },
                select: { id: true, firstName: true, lastName: true, email: true, idCardUrl: true, matricNumber: true, createdAt: true },
                orderBy: { createdAt: 'desc' }
            });
            res.json(pending);
        } catch (error) {
            console.error('Failed to fetch pending verifications', error);
            res.status(500).json({ message: 'Failed to fetch pending verifications' });
        }
    },

    reviewVerification: async (req: Request, res: Response) => {
        try {
            const userId = parseInt(req.params.id as string);
            const { approve } = req.body;

            if (approve) {
                await prisma.user.update({
                    where: { id: userId },
                    data: { isIdVerified: true }
                });
                // Send push notification
                await sendPushNotification({
                    userIds: [userId],
                    title: 'ID Verification Approved',
                    body: 'Your student ID has been verified. You now have a verified badge!',
                    type: 'SYSTEM',
                    data: { route: 'Profile' }
                });
            } else {
                await prisma.user.update({
                    where: { id: userId },
                    data: { idCardUrl: null, isIdVerified: false } // Reset so they can re-upload
                });
                await sendPushNotification({
                    userIds: [userId],
                    title: 'ID Verification Rejected',
                    body: 'Your ID verification was rejected. Please upload a clearer image of your Student ID.',
                    type: 'SYSTEM',
                    data: { route: 'Profile' }
                });
            }

            res.json({ message: `Verification ${approve ? 'approved' : 'rejected'}` });
        } catch (error) {
            console.error('Failed to review verification', error);
            res.status(500).json({ message: 'Failed to review verification' });
        }
    }
};

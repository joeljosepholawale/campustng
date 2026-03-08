import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const productController = {
    async getAllProducts(req: Request, res: Response) {
        try {
            const category = req.query.category as string;
            const search = req.query.search as string;
            const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined;
            const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined;
            const condition = req.query.condition as string;
            const listingType = req.query.listingType as string;
            const schoolId = req.query.schoolId ? parseInt(req.query.schoolId as string) : undefined;
            const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
            const page = req.query.page ? parseInt(req.query.page as string) : 1;
            const limit = 50;
            const skip = (page - 1) * limit;

            const filter: any = {};
            console.log(`[ProductSearch] term: "${search}", category: "${category}", school: ${schoolId}`);


            // If they are not checking their own products specifically, usually we only show active ones.
            // If checking 'My Products' (userId provided), we might want to see both active and inactive/sold.
            if (!userId) {
                filter.isActive = true;
            } else {
                filter.userId = userId;
            }

            if (category && category !== 'All') {
                filter.category = {
                    name: { contains: category, mode: 'insensitive' }
                };
            }

            if (search) {
                filter.OR = [
                    { title: { contains: search, mode: 'insensitive' } },
                    { description: { contains: search, mode: 'insensitive' } }
                ];
            }

            if (minPrice !== undefined || maxPrice !== undefined) {
                filter.price = {};
                if (minPrice !== undefined) filter.price.gte = minPrice;
                if (maxPrice !== undefined) filter.price.lte = maxPrice;
            }

            if (condition && condition !== 'All') {
                filter.condition = condition;
            }

            if (listingType && listingType !== 'All') {
                filter.listingType = listingType;
            }

            if (schoolId) {
                filter.user = {
                    schoolId: schoolId
                };
            }

            const products = await prisma.product.findMany({
                where: filter,
                take: limit,
                skip: skip,
                include: {
                    category: true,
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            school: true
                        }
                    }
                },
                orderBy: [
                    { isPromoted: 'desc' },
                    { createdAt: 'desc' }
                ]
            });

            res.json(products);
        } catch (error) {
            console.error('Error fetching products:', error);
            res.status(500).json({ message: 'Failed to fetch products' });
        }
    },

    // Get single product
    async getProductById(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const product = await prisma.product.update({
                where: { id: parseInt(id as string) },
                data: {
                    views: { increment: 1 }
                },
                include: {
                    category: true,
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            school: true,
                            email: true,
                            isIdVerified: true // Added for UI badges
                        }
                    }
                }
            });

            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }

            res.json(product);
        } catch (error) {
            res.status(500).json({ message: 'Failed to fetch product' });
        }
    },

    // Create product
    async createProduct(req: Request, res: Response) {
        try {
            const { title, description, price, condition, listingType, imageUrl, imageUrl2, categoryId } = req.body;
            const userId = (req as any).user.id;

            const product = await prisma.product.create({
                data: {
                    title,
                    description,
                    price: parseFloat(price),
                    condition,
                    listingType: listingType || 'Sale',
                    imageUrl,
                    imageUrl2,
                    categoryId: parseInt(categoryId),
                    userId
                },
                include: {
                    category: true
                }
            });

            res.status(201).json(product);

            // Notify followers (Unified DB + Push) - Fire and forget
            (async () => {
                try {
                    const followers = await prisma.follow.findMany({
                        where: { followingId: userId },
                        select: { followerId: true }
                    });

                    if (followers.length > 0) {
                        const { sendPushNotification } = require('../utils/pushNotifications');
                        await sendPushNotification({
                            userIds: followers.map(f => f.followerId),
                            type: 'SYSTEM',
                            title: 'New Drop! 🚀',
                            body: `${(req as any).user.firstName} just listed: ${product.title}`,
                            data: { route: 'ProductDetails', params: { productId: product.id, type: 'product' } }
                        });
                    }
                } catch (e) {
                    console.error('Failed to notify followers:', e);
                }
            })();
        } catch (error) {
            console.error('Create product error:', error);
            res.status(500).json({ message: 'Failed to create product' });
        }
    },

    // Get categories
    async getCategories(req: Request, res: Response) {
        try {
            const categories = await prisma.category.findMany();
            res.json(categories);
        } catch (error) {
            res.status(500).json({ message: 'Failed to fetch categories' });
        }
    },

    // Delete product (owner only)
    async deleteProduct(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
            const userId = (req as any).user.id;

            const product = await prisma.product.findUnique({ where: { id: parseInt(id) } });

            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }

            if (product.userId !== userId) {
                return res.status(403).json({ message: 'Not authorized to delete this product' });
            }

            await prisma.product.delete({ where: { id: parseInt(id) } });
            res.json({ message: 'Product deleted successfully' });
        } catch (error) {
            console.error('Delete product error:', error);
            res.status(500).json({ message: 'Failed to delete product' });
        }
    },

    // Update product (owner only)
    async updateProduct(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
            const userId = (req as any).user.id;
            const { title, description, price, condition, listingType, imageUrl, imageUrl2, isSold } = req.body;

            const product = await prisma.product.findUnique({ where: { id: parseInt(id) } });

            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }

            if (product.userId !== userId) {
                return res.status(403).json({ message: 'Not authorized to update this product' });
            }

            const updated = await prisma.product.update({
                where: { id: parseInt(id) },
                data: {
                    ...(title && { title }),
                    ...(description && { description }),
                    ...(price !== undefined && { price: parseFloat(price) }),
                    ...(condition && { condition }),
                    ...(listingType && { listingType }),
                    ...(imageUrl !== undefined && { imageUrl }),
                    ...(imageUrl2 !== undefined && { imageUrl2 }),
                    ...(isSold !== undefined && { isSold }),
                },
                include: { category: true }
            });

            res.json(updated);
        } catch (error) {
            console.error('Update product error:', error);
            res.status(500).json({ message: 'Failed to update product' });
        }
    },

    // Get active boost plans for users
    async getActiveBoostPlans(req: Request, res: Response) {
        try {
            const plans = await prisma.boostPlan.findMany({
                where: { isActive: true },
                orderBy: { price: 'asc' }
            });
            res.json(plans);
        } catch (error) {
            console.error('Fetch active boost plans error:', error);
            res.status(500).json({ message: 'Failed to fetch boost plans' });
        }
    },

    // Verify flutterwave payment and apply boost
    async verifyBoostPayment(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const { transaction_id, tx_ref, productId, planId } = req.body;

            // 1. Check if transaction is already recorded to prevent double spending
            const existingTx = await prisma.transaction.findUnique({
                where: { reference: tx_ref }
            });

            if (existingTx) {
                return res.status(400).json({ message: 'Transaction already processed' });
            }

            // 2. Verify with Flutterwave API
            const response = await fetch(`https://api.flutterwave.com/v3/transactions/${transaction_id}/verify`, {
                method: 'GET',
                headers: {
                    Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`
                }
            });

            const fwData = await response.json();

            if (fwData.status !== 'success') {
                return res.status(400).json({ message: 'Payment verification failed' });
            }

            const paymentData = fwData.data;

            // 3. Make sure amount matches the actual plan price
            const plan = await prisma.boostPlan.findUnique({ where: { id: parseInt(planId) } });

            if (!plan) {
                return res.status(404).json({ message: 'Boost plan not found' });
            }

            if (paymentData.amount < plan.price || paymentData.currency !== 'NGN' || paymentData.status !== 'successful') {
                console.warn('Payment verification failed criteria:', {
                    receivedAmount: paymentData.amount,
                    expectedAmount: plan.price,
                    currency: paymentData.currency,
                    status: paymentData.status
                });
                return res.status(400).json({ message: 'Invalid payment details or incomplete payment' });
            }

            // 4. Verify product ownership
            const product = await prisma.product.findUnique({ where: { id: parseInt(productId) } });
            if (!product || product.userId !== userId) {
                return res.status(403).json({ message: 'Not authorized to boost this product' });
            }

            // 5. Success! Record transaction and apply boost
            await prisma.transaction.create({
                data: {
                    reference: tx_ref,
                    amount: paymentData.amount,
                    status: 'successful',
                    type: 'boost',
                    userId: userId,
                    productId: product.id
                }
            });

            const promotedUntil = new Date();
            promotedUntil.setDate(promotedUntil.getDate() + plan.durationDays);

            const updatedProduct = await prisma.product.update({
                where: { id: product.id },
                data: {
                    isPromoted: true,
                    promotedUntil
                },
                include: { category: true }
            });

            res.json(updatedProduct);
        } catch (error) {
            console.error('Verify boost payment error:', error);
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },

    // Get comments for a product
    async getProductComments(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const comments = await prisma.productComment.findMany({
                where: { productId: Number(id) },
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            profilePhotoUrl: true,
                            isIdVerified: true
                        }
                    }
                }
            });
            res.json(comments);
        } catch (error) {
            console.error('Error fetching product comments:', error);
            res.status(500).json({ message: 'Failed to fetch comments' });
        }
    },

    // Add a comment to a product
    async addProductComment(req: Request, res: Response) {
        try {
            const { id } = req.params;
            const { text } = req.body;
            const userId = (req as any).user.id;

            if (!text || !text.trim()) {
                return res.status(400).json({ message: 'Comment text is required' });
            }

            const comment = await prisma.productComment.create({
                data: {
                    text: text.trim(),
                    productId: Number(id),
                    userId,
                },
                include: {
                    user: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            profilePhotoUrl: true,
                            isIdVerified: true
                        }
                    }
                }
            });

            res.status(201).json(comment);
        } catch (error) {
            console.error('Error adding product comment:', error);
            res.status(500).json({ message: 'Failed to add comment' });
        }
    }
};

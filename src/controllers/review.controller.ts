import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const reviewController = {
    // Create a new review
    createReview: async (req: Request, res: Response) => {
        try {
            const reviewerId = (req as any).user.id;
            const { revieweeId, rating, comment } = req.body;

            const parsedRating = Number(rating);
            if (revieweeId == null || rating == null || isNaN(parsedRating) || parsedRating < 1 || parsedRating > 5) {
                return res.status(400).json({ message: 'Valid revieweeId and rating (1-5) are required' });
            }

            if (reviewerId === parseInt(revieweeId)) {
                return res.status(400).json({ message: 'You cannot review yourself' });
            }

            const review = await prisma.review.create({
                data: {
                    rating: parsedRating,
                    comment,
                    reviewerId,
                    revieweeId: parseInt(revieweeId)
                },
                include: {
                    reviewer: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            profilePhotoUrl: true
                        }
                    }
                }
            });

            res.status(201).json(review);
        } catch (error) {
            console.error('Create review error:', error);
            res.status(500).json({ message: 'Failed to create review' });
        }
    },

    // Get reviews received by a user
    getUserReviews: async (req: Request, res: Response) => {
        try {
            const userId = req.params.userId as string;

            const reviews = await prisma.review.findMany({
                where: { revieweeId: parseInt(userId) },
                take: 30,
                include: {
                    reviewer: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            profilePhotoUrl: true,
                            school: { select: { name: true } }
                        }
                    }
                },
                orderBy: {
                    createdAt: 'desc'
                }
            });

            // Calculate average rating
            const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
            const averageRating = reviews.length > 0 ? (totalRating / reviews.length).toFixed(1) : 0;

            res.json({
                reviews,
                averageRating,
                totalReviews: reviews.length
            });
        } catch (error) {
            console.error('Fetch reviews error:', error);
            res.status(500).json({ message: 'Failed to fetch reviews' });
        }
    }
};

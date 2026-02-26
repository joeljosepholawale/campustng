import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const userController = {
    // Saved Searches
    async getSavedSearches(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const searches = await prisma.savedSearch.findMany({
                where: { userId },
                take: 20,
                orderBy: { createdAt: 'desc' }
            });
            res.json(searches);
        } catch (error) {
            res.status(500).json({ message: 'Failed to fetch saved searches' });
        }
    },

    async createSavedSearch(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const { query, category } = req.body;
            const search = await prisma.savedSearch.create({
                data: { query, category, userId }
            });
            res.status(201).json(search);
        } catch (error) {
            res.status(500).json({ message: 'Failed to save search' });
        }
    },

    async deleteSavedSearch(req: Request, res: Response) {
        try {
            const id = parseInt(req.params.id as string);
            await prisma.savedSearch.delete({ where: { id } });
            res.status(204).send();
        } catch (error) {
            res.status(500).json({ message: 'Failed to delete saved search' });
        }
    },

    async updatePushToken(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const { expoPushToken } = req.body;

            await prisma.user.update({
                where: { id: userId },
                data: { expoPushToken }
            });

            res.json({ message: 'Push token updated' });
        } catch (error) {
            console.error('Failed to update push token:', error);
            res.status(500).json({ message: 'Failed to update push token' });
        }
    },

    async submitIdVerification(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const { idCardUrl } = req.body;

            if (!idCardUrl) {
                return res.status(400).json({ message: 'ID Card Image URL is required' });
            }

            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: {
                    idCardUrl,
                    isIdVerified: false // Resets verification status for admin review
                }
            });

            res.json({ message: 'ID submitted for verification successfully', user: updatedUser });
        } catch (error) {
            console.error('Failed to submit ID:', error);
            res.status(500).json({ message: 'Failed to submit ID for verification' });
        }
    },

    // Follow / Unfollow
    async followUser(req: Request, res: Response) {
        try {
            const followerId = (req as any).user.id;
            const followingId = parseInt(req.params.id as string);

            if (followerId === followingId) {
                return res.status(400).json({ message: 'You cannot follow yourself' });
            }

            await prisma.follow.upsert({
                where: {
                    followerId_followingId: { followerId, followingId }
                },
                update: {},
                create: { followerId, followingId }
            });

            // Trigger notification
            await prisma.notification.create({
                data: {
                    userId: followingId,
                    type: 'SYSTEM',
                    title: 'New Follower',
                    message: `${(req as any).user.firstName} started following your store!`,
                    data: JSON.stringify({ route: 'ViewUser', params: { userId: followerId } })
                }
            });

            res.json({ message: 'Followed successfully' });
        } catch (error) {
            console.error('Follow error:', error);
            res.status(500).json({ message: 'Failed to follow user' });
        }
    },

    async unfollowUser(req: Request, res: Response) {
        try {
            const followerId = (req as any).user.id;
            const followingId = parseInt(req.params.id as string);

            await prisma.follow.delete({
                where: {
                    followerId_followingId: { followerId, followingId }
                }
            });

            res.json({ message: 'Unfollowed successfully' });
        } catch (error) {
            console.error('Unfollow error:', error);
            res.status(500).json({ message: 'Failed to unfollow user' });
        }
    },

    // Update Storefront Details
    async updateStorefront(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const { storeName, storeBannerUrl, bio } = req.body;

            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: {
                    ...(storeName !== undefined && { storeName }),
                    ...(storeBannerUrl !== undefined && { storeBannerUrl }),
                    ...(bio !== undefined && { bio })
                }
            });

            res.json({ message: 'Storefront updated successfully', user: updatedUser });
        } catch (error) {
            console.error('Update storefront error:', error);
            res.status(500).json({ message: 'Failed to update storefront' });
        }
    }
};

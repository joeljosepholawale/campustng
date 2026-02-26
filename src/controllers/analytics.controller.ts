import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const analyticsController = {
    // Get seller analytics (views, bookmarks, active listings, sold items)
    async getSellerAnalytics(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;

            const products = await prisma.product.findMany({
                where: { userId }
            });

            const totalViews = products.reduce((sum, p) => sum + p.views, 0);
            const totalBookmarks = products.reduce((sum, p) => sum + p.bookmarks, 0);
            const activeListings = products.filter(p => !p.isSold && p.isActive).length;
            const soldListings = products.filter(p => p.isSold).length;

            res.json({
                totalViews,
                totalBookmarks,
                activeListings,
                soldListings,
                products: products.map(p => ({
                    id: p.id,
                    title: p.title,
                    views: p.views,
                    bookmarks: p.bookmarks,
                    isSold: p.isSold
                }))
            });
        } catch (error) {
            console.error('Failed to fetch analytics:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
    }
};

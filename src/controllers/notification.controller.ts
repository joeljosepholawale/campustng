import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const notificationController = {
    // Get all notifications for the current user
    async getNotifications(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;
            const notifications = await prisma.notification.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
            });

            res.json(notifications);
        } catch (error) {
            console.error('Error fetching notifications:', error);
            res.status(500).json({ message: 'Failed to fetch notifications' });
        }
    },

    // Get unread notification and message counts
    async getUnreadCounts(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;

            const unreadNotifications = await prisma.notification.count({
                where: {
                    userId,
                    isRead: false
                }
            });

            // Count conversations where the other person sent a message AFTER the user last read it
            const conversations = await prisma.conversation.findMany({
                where: {
                    OR: [
                        { buyerId: userId },
                        { sellerId: userId }
                    ]
                },
                select: {
                    buyerId: true,
                    sellerId: true,
                    buyerLastReadAt: true,
                    sellerLastReadAt: true,
                    messages: {
                        orderBy: { createdAt: 'desc' },
                        take: 1,
                        select: { senderId: true, createdAt: true }
                    }
                }
            });

            let unreadConvCount = 0;
            for (const conv of conversations) {
                const lastMsg = conv.messages[0];
                if (!lastMsg) continue;
                // Skip if the last message was sent by the current user
                if (lastMsg.senderId === userId) continue;

                const isBuyer = conv.buyerId === userId;
                const lastReadAt = isBuyer ? conv.buyerLastReadAt : conv.sellerLastReadAt;

                // Unread if: never read, or last message is newer than last read timestamp
                if (!lastReadAt || lastMsg.createdAt > lastReadAt) {
                    unreadConvCount++;
                }
            }

            res.json({
                notifications: unreadNotifications,
                messages: unreadConvCount
            });
        } catch (error) {
            console.error('Error fetching unread counts:', error);
            res.status(500).json({ message: 'Failed to fetch unread counts' });
        }
    },

    // Mark a specific notification as read
    async markAsRead(req: Request, res: Response) {
        try {
            const id = req.params.id as string;
            const userId = (req as any).user.id;

            const notification = await prisma.notification.findUnique({
                where: { id: parseInt(id, 10) }
            });

            if (!notification || notification.userId !== userId) {
                return res.status(404).json({ message: 'Notification not found' });
            }

            const updated = await prisma.notification.update({
                where: { id: parseInt(id, 10) },
                data: { isRead: true }
            });

            res.json(updated);
        } catch (error) {
            res.status(500).json({ message: 'Failed to mark notification as read' });
        }
    },

    // Mark all notifications as read
    async markAllAsRead(req: Request, res: Response) {
        try {
            const userId = (req as any).user.id;

            await prisma.notification.updateMany({
                where: { userId, isRead: false },
                data: { isRead: true }
            });

            res.json({ message: 'All notifications marked as read' });
        } catch (error) {
            res.status(500).json({ message: 'Failed to mark all as read' });
        }
    }
};

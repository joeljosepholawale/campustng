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

            // Simple unread message count (if we had an isRead flag on messages, but we don't currently)
            // Since we don't have an isRead on Message table, we could either structure one, or return 0 for now
            // To satisfy the user request immediately, we can check for recent messages where the user is NOT the sender
            // OR we add logic for `unreadMessages`
            // For MVP: Let's assume we just want to power the Notification bell and we'll add a dummy badge for messages,
            // or we can count conversations where the user isn't the sender of the last message as a proxy.

            const conversationsWithPotentialUnread = await prisma.conversation.count({
                where: {
                    OR: [
                        { buyerId: userId },
                        { sellerId: userId }
                    ],
                    messages: {
                        some: { // messages exist
                            senderId: { not: userId } // sent by the other person
                            // ideally we would check if it's read by this user, but schema lacks message read receipts.
                        }
                    }
                }
            });

            res.json({
                notifications: unreadNotifications,
                messages: conversationsWithPotentialUnread // proxy count
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

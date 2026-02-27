import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { PrismaClient } from '@prisma/client';
import { sendPushNotification } from '../utils/pushNotifications';

const prisma = new PrismaClient();

export const messageController = {
    // Get all conversations for the authenticated user
    getConversations: async (req: ExpressRequest, res: ExpressResponse) => {
        try {
            const userId = (req as any).user.id;

            const conversations = await prisma.conversation.findMany({
                where: {
                    OR: [
                        { buyerId: userId },
                        { sellerId: userId }
                    ]
                },
                take: 50,
                include: {
                    product: { select: { title: true, imageUrl: true } },
                    buyer: { select: { id: true, firstName: true, lastName: true, school: { select: { name: true } } } },
                    seller: { select: { id: true, firstName: true, lastName: true, school: { select: { name: true } } } },
                    messages: {
                        orderBy: { createdAt: 'desc' },
                        take: 1
                    }
                },
                orderBy: { updatedAt: 'desc' }
            });

            // Format for frontend
            const formatted = conversations.map((conv: any) => {
                const isBuyer = conv.buyerId === userId;
                const otherUser = isBuyer ? conv.seller : conv.buyer;
                const lastMessage = conv.messages[0] || null;

                return {
                    id: conv.id,
                    product: conv.product,
                    partner: otherUser,
                    lastMessage: lastMessage?.text || conv.lastMessage || 'Started a conversation',
                    updatedAt: conv.updatedAt
                };
            });

            res.json(formatted);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error fetching conversations' });
        }
    },

    // Get messages for a specific conversation
    getMessages: async (req: ExpressRequest, res: ExpressResponse) => {
        try {
            const userId = (req as any).user.id;
            const conversationId = parseInt(req.params.id as string);

            // Verify user is part of the conversation
            const conv = await prisma.conversation.findUnique({
                where: { id: conversationId }
            });

            if (!conv || (conv.buyerId !== userId && conv.sellerId !== userId)) {
                return res.status(403).json({ message: 'Access denied' });
            }

            const messages = await prisma.message.findMany({
                where: { conversationId },
                take: 100,
                orderBy: { createdAt: 'asc' },
                include: {
                    sender: { select: { id: true, firstName: true } }
                }
            });

            res.json(messages);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error fetching messages' });
        }
    },

    // Send a message (also creates conversation if it doesn't exist)
    sendMessage: async (req: ExpressRequest, res: ExpressResponse) => {
        try {
            const senderId = (req as any).user.id;
            const { productId, sellerId, text, conversationId } = req.body;

            if (!text) {
                return res.status(400).json({ message: 'Message text is required' });
            }

            let convId = conversationId;

            // If no conversationId provided, find or create one based on product and buyer
            if (!convId) {
                if (!productId || !sellerId) {
                    return res.status(400).json({ message: 'productId and sellerId required to start a chat' });
                }

                let conv = await prisma.conversation.findFirst({
                    where: {
                        productId: parseInt(productId),
                        buyerId: senderId,
                        sellerId: parseInt(sellerId)
                    }
                });

                if (!conv) {
                    conv = await prisma.conversation.create({
                        data: {
                            productId: parseInt(productId),
                            buyerId: senderId,
                            sellerId: parseInt(sellerId)
                        }
                    });
                }
                convId = conv.id;
            }

            // Create message
            const message = await prisma.message.create({
                data: {
                    text,
                    conversationId: convId,
                    senderId
                },
                include: {
                    sender: { select: { id: true, firstName: true } }
                }
            });

            // Update conversation timestamp and last message
            await prisma.conversation.update({
                where: { id: convId },
                data: {
                    updatedAt: new Date(),
                    lastMessage: text
                }
            });

            // Send push notification to the recipient
            try {
                const conversation = await prisma.conversation.findUnique({
                    where: { id: convId },
                    include: { buyer: true, seller: true }
                });

                if (conversation) {
                    const recipientId = senderId === conversation.buyerId ? conversation.sellerId : conversation.buyerId;
                    const recipient = await prisma.user.findUnique({ where: { id: recipientId }, select: { expoPushToken: true } });

                    if (recipient?.expoPushToken) {
                        const senderName = message.sender?.firstName || 'Someone';
                        await sendPushNotification({
                            userIds: [recipientId],
                            title: `New message from ${senderName}`,
                            body: text.length > 80 ? text.substring(0, 80) + '...' : text,
                            data: { conversationId: convId, type: 'MESSAGE' },
                            type: 'MESSAGE'
                        });
                    }
                }
            } catch (pushErr) {
                console.warn('Push notification failed (non-blocking):', pushErr);
            }

            res.status(201).json(message);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error sending message' });
        }
    },

    // Mark a conversation as read for the current user
    markConversationRead: async (req: ExpressRequest, res: ExpressResponse) => {
        try {
            const userId = (req as any).user.id;
            const conversationId = parseInt(req.params.id as string);

            const conv = await prisma.conversation.findUnique({
                where: { id: conversationId }
            });

            if (!conv || (conv.buyerId !== userId && conv.sellerId !== userId)) {
                return res.status(403).json({ message: 'Access denied' });
            }

            const isBuyer = conv.buyerId === userId;
            const now = new Date();

            await prisma.conversation.update({
                where: { id: conversationId },
                data: isBuyer
                    ? { buyerLastReadAt: now }
                    : { sellerLastReadAt: now }
            });

            res.json({ success: true });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error marking conversation as read' });
        }
    }
};

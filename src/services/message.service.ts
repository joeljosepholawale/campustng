import { PrismaClient } from '@prisma/client';
import { sendPushNotification } from '../utils/pushNotifications';
import { getIo } from '../socket';

const prisma = new PrismaClient();

// ── Types ──────────────────────────────────────────────────────────────────
interface SendMessageData {
    conversationId?: number;
    productId?: number;
    sellerId?: number;
    text: string;
    imageUrl?: string;
}

// ── Service ────────────────────────────────────────────────────────────────
export const messageService = {

    /**
     * Fetch all conversations for a given user, formatted for the frontend.
     */
    getConversations: async (userId: number) => {
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

        return conversations.map((conv: any) => {
            const isBuyer = conv.buyerId === userId;
            const otherUser = isBuyer ? conv.seller : conv.buyer;
            const lastMessage = conv.messages[0] || null;

            return {
                id: conv.id,
                product: conv.product,
                partner: otherUser,
                lastMessage: lastMessage?.text || conv.lastMessage || 'Started a conversation',
                updatedAt: conv.updatedAt,
                buyerLastReadAt: conv.buyerLastReadAt,
                sellerLastReadAt: conv.sellerLastReadAt,
                buyerId: conv.buyerId,
                sellerId: conv.sellerId
            };
        });
    },

    /**
     * Finds an existing conversation between two users
     */
    getExistingConversation: async (userId: number, targetUserId: number) => {
        return prisma.conversation.findFirst({
            where: {
                OR: [
                    { buyerId: userId, sellerId: targetUserId },
                    { buyerId: targetUserId, sellerId: userId }
                ]
            },
            orderBy: { updatedAt: 'desc' }
        });
    },

    /**
     * Fetch messages for a conversation after verifying that the user is a participant.
     * Throws an error string if access is denied or conversation not found.
     */
    getMessages: async (conversationId: number, userId: number) => {
        const conv = await prisma.conversation.findUnique({
            where: { id: conversationId }
        });

        if (!conv || (conv.buyerId !== userId && conv.sellerId !== userId)) {
            throw new Error('ACCESS_DENIED');
        }

        return prisma.message.findMany({
            where: { conversationId },
            take: 100,
            orderBy: { createdAt: 'asc' },
            include: {
                sender: { select: { id: true, firstName: true } }
            }
        });
    },

    /**
     * Send a message, creating the conversation if it doesn't exist yet.
     * Also triggers a push notification to the recipient.
     */
    sendMessage: async (senderId: number, data: SendMessageData) => {
        const { text, conversationId, productId, sellerId, imageUrl } = data;

        if (!text && !imageUrl) {
            throw new Error('MISSING_TEXT');
        }

        let convId = conversationId;

        // Find or create conversation
        if (!convId) {
            if (!sellerId) {
                throw new Error('MISSING_CONVERSATION_PARAMS');
            }

            let effectiveProductId = productId;
            if (!effectiveProductId) {
                // Find ANY product to satisfy database non-null constraint
                const anyProduct = await prisma.product.findFirst({ select: { id: true } });
                if (anyProduct) {
                    effectiveProductId = anyProduct.id;
                } else {
                    // Fail gracefully if no products exist at all in the system
                    throw new Error('MISSING_CONVERSATION_PARAMS');
                }
            }

            let conv = await prisma.conversation.findFirst({
                where: {
                    productId: effectiveProductId,
                    buyerId: senderId,
                    sellerId
                }
            });

            if (!conv) {
                conv = await prisma.conversation.create({
                    data: {
                        productId: effectiveProductId,
                        buyerId: senderId,
                        sellerId
                    }
                });
            }
            convId = conv.id;
        }

        // Create message
        const message = await prisma.message.create({
            data: {
                text: text || '',
                imageUrl,
                conversationId: convId,
                senderId
            },
            include: {
                sender: { select: { id: true, firstName: true } }
            }
        });

        // Update conversation timestamp and last message
        const lastMsgText = imageUrl && !text ? '[Image attached]' : text;

        await prisma.conversation.update({
            where: { id: convId },
            data: {
                updatedAt: new Date(),
                lastMessage: lastMsgText
            }
        });

        // Broadcast to specific conversation and recipient's global room
        try {
            const io = getIo();
            // Emit to the existing chat room participants
            io.to(`conv_${convId}`).emit('receive_message', message);

            // Also emit to the recipient's global user room for instant notification
            const convData = await prisma.conversation.findUnique({ where: { id: convId } });
            if (convData) {
                const recipientId = senderId === convData.buyerId ? convData.sellerId : convData.buyerId;
                io.to(`user_${recipientId}`).emit('receive_message', message);
            }
        } catch (socketErr) {
            console.error('Socket broadcast failed:', socketErr);
        }

        // Await push notification so Vercel does not terminate the function
        try {
            await messageService._sendMessagePush(convId, senderId, lastMsgText, message.sender?.firstName);
        } catch (err) {
            console.warn('Push notification failed:', err);
        }

        return message;
    },

    /**
     * Mark a conversation as read for a specific user.
     */
    markAsRead: async (conversationId: number, userId: number) => {
        const conv = await prisma.conversation.findUnique({
            where: { id: conversationId }
        });

        if (!conv || (conv.buyerId !== userId && conv.sellerId !== userId)) {
            throw new Error('ACCESS_DENIED');
        }

        const isBuyer = conv.buyerId === userId;
        const now = new Date();

        await prisma.conversation.update({
            where: { id: conversationId },
            data: isBuyer
                ? { buyerLastReadAt: now }
                : { sellerLastReadAt: now }
        });

        // Emit read receipt to the OTHER participant
        try {
            const io = getIo();
            const recipientId = isBuyer ? conv.sellerId : conv.buyerId;
            io.to(`user_${recipientId}`).emit('read_receipt', {
                conversationId,
                readerId: userId,
                readAt: now
            });
            // Also emit to the conversation room
            io.to(`conv_${conversationId}`).emit('read_receipt', {
                conversationId,
                readerId: userId,
                readAt: now
            });
        } catch (err) {
            console.error('Socket read_receipt broadcast failed:', err);
        }

        return { success: true };
    },

    // ── Internal helpers ───────────────────────────────────────────────────
    /**
     * Send a push notification to the other participant of a conversation.
     */
    _sendMessagePush: async (convId: number, senderId: number, text: string, senderFirstName?: string | null) => {
        const conversation = await prisma.conversation.findUnique({
            where: { id: convId },
            include: { buyer: true, seller: true }
        });

        if (!conversation) return;

        const recipientId = senderId === conversation.buyerId ? conversation.sellerId : conversation.buyerId;
        const recipient = await prisma.user.findUnique({
            where: { id: recipientId },
            select: { expoPushToken: true }
        });

        if (recipient?.expoPushToken) {
            const senderName = senderFirstName || 'Someone';
            await sendPushNotification({
                userIds: [recipientId],
                title: `New message from ${senderName}`,
                body: text.length > 80 ? text.substring(0, 80) + '...' : text,
                data: { conversationId: convId, type: 'MESSAGE' },
                type: 'MESSAGE'
            });
        }
    }
};

import { Request as ExpressRequest, Response as ExpressResponse } from 'express';
import { messageService } from '../services/message.service';

export const messageController = {
    // Get all conversations for the authenticated user
    getConversations: async (req: ExpressRequest, res: ExpressResponse) => {
        try {
            const userId = (req as any).user.id;
            const conversations = await messageService.getConversations(userId);
            res.json(conversations);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Server error fetching conversations' });
        }
    },

    // Check if an existing conversation exists with a specific user
    getExistingConversation: async (req: ExpressRequest, res: ExpressResponse) => {
        try {
            const userId = (req as any).user.id;
            const targetUserId = parseInt(req.params.targetUserId as string);

            const conversation = await messageService.getExistingConversation(userId, targetUserId);

            if (conversation) {
                res.json({ exists: true, conversationId: conversation.id });
            } else {
                res.json({ exists: false });
            }
        } catch (error) {
            console.error('Failed to check existing conversation:', error);
            res.status(500).json({ message: 'Server error checking conversation' });
        }
    },

    // Get messages for a specific conversation
    getMessages: async (req: ExpressRequest, res: ExpressResponse) => {
        try {
            const userId = (req as any).user.id;
            const conversationId = parseInt(req.params.id as string);
            const messages = await messageService.getMessages(conversationId, userId);
            res.json(messages);
        } catch (error: any) {
            if (error.message === 'ACCESS_DENIED') {
                return res.status(403).json({ message: 'Access denied' });
            }
            console.error(error);
            res.status(500).json({ message: 'Server error fetching messages' });
        }
    },

    // Send a message (also creates conversation if it doesn't exist)
    sendMessage: async (req: ExpressRequest, res: ExpressResponse) => {
        try {
            const senderId = (req as any).user.id;
            const { productId, sellerId, text, conversationId, imageUrl } = req.body;

            const message = await messageService.sendMessage(senderId, {
                conversationId,
                productId: productId ? parseInt(productId) : undefined,
                sellerId: sellerId ? parseInt(sellerId) : undefined,
                text,
                imageUrl
            });

            res.status(201).json(message);
        } catch (error: any) {
            if (error.message === 'MISSING_TEXT') {
                return res.status(400).json({ message: 'Message text is required' });
            }
            if (error.message === 'MISSING_CONVERSATION_PARAMS') {
                return res.status(400).json({ message: 'productId and sellerId required to start a chat' });
            }
            console.error(error);
            res.status(500).json({ message: 'Server error sending message' });
        }
    },

    // Mark a conversation as read for the current user
    markConversationRead: async (req: ExpressRequest, res: ExpressResponse) => {
        try {
            const userId = (req as any).user.id;
            const conversationId = parseInt(req.params.id as string);
            const result = await messageService.markAsRead(conversationId, userId);
            res.json(result);
        } catch (error: any) {
            if (error.message === 'ACCESS_DENIED') {
                return res.status(403).json({ message: 'Access denied' });
            }
            console.error(error);
            res.status(500).json({ message: 'Server error marking conversation as read' });
        }
    }
};

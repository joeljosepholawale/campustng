import express from 'express';
import { messageController } from '../controllers/message.controller';
import { protect } from '../middlewares/auth.middleware';

const router = express.Router();

router.use(protect);

router.get('/conversations', messageController.getConversations);
router.get('/:id', messageController.getMessages);
router.post('/', messageController.sendMessage);
router.put('/:id/read', messageController.markConversationRead);

export default router;

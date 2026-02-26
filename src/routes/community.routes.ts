import { Router } from 'express';
import { communityController } from '../controllers/community.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

// Forums
router.get('/forums', protect, communityController.getForums);
router.post('/forums', protect, communityController.createForumPost);
router.get('/forums/:postId/comments', protect, communityController.getForumComments);
router.post('/forums/:postId/comments', protect, communityController.addForumComment);

// Study Groups
router.get('/study-groups', protect, communityController.getStudyGroups);
router.post('/study-groups', protect, communityController.createStudyGroup);
router.post('/study-groups/:groupId/join', protect, communityController.joinStudyGroup);
router.get('/study-groups/:groupId/messages', protect, communityController.getStudyGroupMessages);
router.post('/study-groups/:groupId/messages', protect, communityController.sendStudyGroupMessage);

export default router;

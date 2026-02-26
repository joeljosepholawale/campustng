import { Router } from 'express';
import { getRequests, getRequestById, createRequest, deleteRequest } from '../controllers/request.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', getRequests);
router.get('/:id', getRequestById);
router.post('/', protect, createRequest);
router.delete('/:id', protect, deleteRequest);

export default router;

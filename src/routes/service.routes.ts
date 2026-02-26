import { Router } from 'express';
import { getServices, getServiceById, createService, deleteService } from '../controllers/service.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', getServices);
router.get('/:id', getServiceById);
router.post('/', protect, createService);
router.delete('/:id', protect, deleteService);

export default router;

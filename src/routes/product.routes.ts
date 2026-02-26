import { Router } from 'express';
import { productController } from '../controllers/product.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

// Public routes
router.get('/', productController.getAllProducts);
router.get('/categories', productController.getCategories);
router.get('/boost-plans', productController.getActiveBoostPlans);
router.get('/:id', productController.getProductById);

// Protected routes
router.post('/', protect, productController.createProduct);
router.put('/:id', protect, productController.updateProduct);
router.delete('/:id', protect, productController.deleteProduct);
router.post('/verify-boost', protect, productController.verifyBoostPayment);

export default router;

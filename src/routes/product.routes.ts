import { Router } from 'express';
import { productController } from '../controllers/product.controller';
import { protect } from '../middlewares/auth.middleware';

const router = Router();

// Public routes
router.get('/', productController.getAllProducts);
router.get('/categories', productController.getCategories);
router.get('/boost-plans', productController.getActiveBoostPlans);

// Protected routes (place these before /:id so they are not captured as an id)
router.post('/', protect, productController.createProduct);
router.post('/verify-boost', protect, productController.verifyBoostPayment);

// Comments
router.get('/:id/comments', protect, productController.getProductComments);
router.post('/:id/comments', protect, productController.addProductComment);

// Single Product routes (must come last to avoid intercepting other specific routes)
router.get('/:id', productController.getProductById);
router.put('/:id', protect, productController.updateProduct);
router.delete('/:id', protect, productController.deleteProduct);

export default router;

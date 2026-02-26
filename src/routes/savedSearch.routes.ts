import express from 'express';
import { getSavedSearches, createSavedSearch, deleteSavedSearch } from '../controllers/savedSearch.controller';
import { protect } from '../middlewares/auth.middleware';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/', getSavedSearches);
router.post('/', createSavedSearch);
router.delete('/:id', deleteSavedSearch);

export default router;

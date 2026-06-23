import express from 'express';
import { 
  submitReview, 
  getReviews, 
  getMyReview, 
  deleteReview 
} from '../controllers/reviewController.js';
import { protect, protectAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, submitReview);
router.get('/', getReviews);
router.get('/my-review', protect, getMyReview);
router.delete('/:id', protect, protectAdmin, deleteReview);

export default router;

import express from 'express';
import { verifyPayment } from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/verify-order', protect, verifyPayment);

export default router;

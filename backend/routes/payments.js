import express from 'express';
import { verifyPayment, cancelPayment } from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/verify-order', protect, verifyPayment);
router.post('/cancel', protect, cancelPayment);

export default router;

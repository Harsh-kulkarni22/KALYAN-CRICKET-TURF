import express from 'express';
import { 
  checkAvailability, 
  createBooking, 
  getMyBookings, 
  cancelMyBooking 
} from '../controllers/bookingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/availability', checkAvailability);
router.post('/create', protect, createBooking);
router.get('/my', protect, getMyBookings);
router.put('/my/:id/cancel', protect, cancelMyBooking);

export default router;

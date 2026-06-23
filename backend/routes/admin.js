import express from 'express';
import { 
  getStats, 
  getSettings, 
  updateSettings,
  getBookings,
  cancelBooking,
  deleteBooking,
  getUsers,
  getUserProfile,
  blockUser,
  unblockUser,
  deleteUser,
  getAnalytics,
  getCalendarBookings,
  getNotifications,
  markNotificationsRead,
  getUnreadNotificationsCount,
  sendTestEmail
} from '../controllers/adminController.js';
import { protect, protectAdmin } from '../middleware/authMiddleware.js';

const router = express.Router();

// Stats overview
router.get('/stats', protect, protectAdmin, getStats);

// Bookings management
router.get('/bookings', protect, protectAdmin, getBookings);
router.put('/bookings/:id/cancel', protect, protectAdmin, cancelBooking);
router.delete('/bookings/:id', protect, protectAdmin, deleteBooking);

// Users management
router.get('/users', protect, protectAdmin, getUsers);
router.get('/users/:id', protect, protectAdmin, getUserProfile);
router.put('/users/:id/block', protect, protectAdmin, blockUser);
router.put('/users/:id/unblock', protect, protectAdmin, unblockUser);
router.delete('/users/:id', protect, protectAdmin, deleteUser);

// Analytics & Reports
router.get('/analytics', protect, protectAdmin, getAnalytics);

// Calendar View
router.get('/calendar', protect, protectAdmin, getCalendarBookings);

// Global settings
router.get('/settings', getSettings);
router.put('/settings', protect, protectAdmin, updateSettings);
router.post('/settings/test-email', protect, protectAdmin, sendTestEmail);

// Admin Notifications
router.get('/notifications', protect, protectAdmin, getNotifications);
router.put('/notifications/read-all', protect, protectAdmin, markNotificationsRead);
router.get('/notifications/unread-count', protect, protectAdmin, getUnreadNotificationsCount);

export default router;

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

import authRoutes from './routes/auth.js';
import bookingRoutes from './routes/bookings.js';
import paymentRoutes from './routes/payments.js';
import adminRoutes from './routes/admin.js';
import reviewRoutes from './routes/reviews.js';

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/reviews', reviewRoutes);

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Turf booking backend is running' });
});

// Start Server
import { initCronJobs } from './config/cron.js';

connectDB().then(() => {
  initCronJobs();
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error("Failed to connect to database:", err);
});

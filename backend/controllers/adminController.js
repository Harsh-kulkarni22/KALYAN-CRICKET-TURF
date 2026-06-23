import Booking from '../models/Booking.js';
import User from '../models/User.js';
import Settings from '../models/Settings.js';
import Notification from '../models/Notification.js';

// Get Overview Stats (already existing, extended for more detailed overview)
export const getStats = async (req, res) => {
  try {
    const totalBookings = await Booking.countDocuments({ bookingStatus: 'confirmed' });
    const totalUsers = await User.countDocuments();
    
    const revenueArray = await Booking.aggregate([
      { $match: { bookingStatus: 'confirmed' } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    const totalRevenue = revenueArray.length > 0 ? revenueArray[0].total : 0;

    const recentBookings = await Booking.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('userId', 'name email phone');

    res.status(200).json({ totalBookings, totalUsers, totalRevenue, recentBookings });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats' });
  }
};

// Bookings Management Endpoints
export const getBookings = async (req, res) => {
  try {
    const { search, date, startDate, endDate, paymentMethod, bookingStatus, sort, page = 1, limit = 10 } = req.query;

    const query = {};

    // Search by customer info (needs lookup or we can query users first)
    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { phone: { $regex: search, $options: 'i' } }
        ]
      }).select('_id');
      const userIds = users.map(u => u._id);
      query.userId = { $in: userIds };
    }

    // Filter by Date
    if (date) {
      query.date = date;
    } else if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }

    // Filter by Payment Method
    if (paymentMethod) {
      query.paymentMethod = paymentMethod;
    }

    // Filter by Booking Status
    if (bookingStatus) {
      query.bookingStatus = bookingStatus;
    }

    // Sorting
    let sortObj = { createdAt: -1 }; // default newest first
    if (sort === 'oldest') {
      sortObj = { date: 1, startTime: 1 };
    } else if (sort === 'highest') {
      sortObj = { totalAmount: -1 };
    } else if (sort === 'lowest') {
      sortObj = { totalAmount: 1 };
    } else if (sort === 'newest') {
      sortObj = { date: -1, startTime: -1 };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const total = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .populate('userId', 'name email phone')
      .sort(sortObj)
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({ bookings, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ error: 'Failed to get bookings' });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findById(id).populate('userId');
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    booking.bookingStatus = 'cancelled';
    await booking.save();

    // Create Notification
    await Notification.create({
      type: 'cancelled_booking',
      message: `Booking cancelled: ${booking.userId?.name || 'Unknown'} for ${booking.date} at ${booking.startTime}`,
      bookingId: booking._id
    });

    res.status(200).json({ message: 'Booking cancelled successfully', booking });
  } catch (error) {
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
};

export const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const booking = await Booking.findByIdAndDelete(id);
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    res.status(200).json({ message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete booking' });
  }
};

// User Management Endpoints
export const getUsers = async (req, res) => {
  try {
    const { search, sort, page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const matchQuery = {};
    if (search) {
      matchQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    // Determine sort stage in aggregation
    let sortStage = { $sort: { createdAt: -1 } };
    if (sort === 'newest') {
      sortStage = { $sort: { createdAt: -1 } };
    } else if (sort === 'mostActive') {
      sortStage = { $sort: { totalBookings: -1 } };
    } else if (sort === 'highestSpending') {
      sortStage = { $sort: { totalSpent: -1 } };
    }

    const aggregateQuery = [
      { $match: matchQuery },
      {
        $lookup: {
          from: 'bookings',
          localField: '_id',
          foreignField: 'userId',
          as: 'bookings'
        }
      },
      {
        $addFields: {
          totalBookings: { $size: '$bookings' },
          totalSpent: {
            $sum: {
              $map: {
                input: {
                  $filter: {
                    input: '$bookings',
                    as: 'b',
                    cond: { $eq: ['$$b.bookingStatus', 'confirmed'] }
                  }
                },
                as: 'b',
                in: '$$b.totalAmount'
              }
            }
          }
        }
      },
      sortStage,
      { $skip: skip },
      { $limit: parseInt(limit) }
    ];

    const users = await User.aggregate(aggregateQuery);
    const processedUsers = users.map(user => {
      const bookingsList = user.bookings || [];
      const confirmedBookings = bookingsList.filter(b => b.bookingStatus === 'confirmed');
      
      let lastBookingDate = null;
      if (confirmedBookings.length > 0) {
        const sorted = [...confirmedBookings].sort((a, b) => new Date(b.date + 'T' + b.startTime) - new Date(a.date + 'T' + a.startTime));
        lastBookingDate = sorted[0].date;
      }

      const slotCounts = {};
      confirmedBookings.forEach(b => {
        slotCounts[b.startTime] = (slotCounts[b.startTime] || 0) + 1;
      });
      let favoriteSlot = null;
      let maxCount = 0;
      Object.entries(slotCounts).forEach(([slot, count]) => {
        if (count > maxCount) {
          maxCount = count;
          favoriteSlot = slot;
        }
      });

      return {
        ...user,
        lastBookingDate,
        favoriteSlot,
        bookings: undefined
      };
    });

    const total = await User.countDocuments(matchQuery);
    res.status(200).json({ users: processedUsers, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const bookings = await Booking.find({ userId: id }).sort({ date: -1, startTime: -1 });
    const totalBookings = bookings.length;
    const totalSpent = bookings
      .filter(b => b.bookingStatus === 'confirmed')
      .reduce((sum, b) => sum + b.totalAmount, 0);

    const slotCounts = {};
    bookings.filter(b => b.bookingStatus === 'confirmed').forEach(b => {
      slotCounts[b.startTime] = (slotCounts[b.startTime] || 0) + 1;
    });
    let favoriteSlot = null;
    let maxCount = 0;
    Object.entries(slotCounts).forEach(([slot, count]) => {
      if (count > maxCount) {
        maxCount = count;
        favoriteSlot = slot;
      }
    });

    res.status(200).json({ user, totalBookings, totalSpent, bookings, favoriteSlot });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get user profile' });
  }
};

export const blockUser = async (req, res) => {
  try {
    const { id } = req.params;
    const targetUser = await User.findById(id);
    if (targetUser && targetUser.email === process.env.ADMIN_CONTACT) {
      return res.status(400).json({ error: 'Cannot block the primary admin contact.' });
    }
    const user = await User.findByIdAndUpdate(id, { isBlocked: true }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.status(200).json({ message: 'User blocked successfully', user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to block user' });
  }
};

export const unblockUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByIdAndUpdate(id, { isBlocked: false }, { new: true });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.status(200).json({ message: 'User unblocked successfully', user });
  } catch (error) {
    res.status(500).json({ error: 'Failed to unblock user' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const targetUser = await User.findById(id);
    if (targetUser && targetUser.email === process.env.ADMIN_CONTACT) {
      return res.status(400).json({ error: 'Cannot delete the primary admin contact.' });
    }
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Optionally delete their bookings
    await Booking.deleteMany({ userId: id });

    res.status(200).json({ message: 'User and their bookings deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

// Analytics Endpoints
export const getAnalytics = async (req, res) => {
  try {
    const now = new Date();
    const getPastDateStr = (days) => {
      const d = new Date();
      d.setDate(now.getDate() - days);
      return d.toISOString().split('T')[0];
    };

    const todayStr = now.toISOString().split('T')[0];
    const sevenDaysAgoStr = getPastDateStr(7);
    const thirtyDaysAgoStr = getPastDateStr(30);
    const twelveMonthsAgoStr = getPastDateStr(365);

    // 1. Calculations for Today, Weekly, Monthly, Total
    const todayStats = await Booking.aggregate([
      { $match: { bookingStatus: 'confirmed', date: todayStr } },
      { $group: { _id: null, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
    ]);

    const weeklyStats = await Booking.aggregate([
      { $match: { bookingStatus: 'confirmed', date: { $gte: sevenDaysAgoStr } } },
      { $group: { _id: null, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
    ]);

    const monthlyStats = await Booking.aggregate([
      { $match: { bookingStatus: 'confirmed', date: { $gte: thirtyDaysAgoStr } } },
      { $group: { _id: null, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
    ]);

    const totalStats = await Booking.aggregate([
      { $match: { bookingStatus: 'confirmed' } },
      { $group: { _id: null, revenue: { $sum: '$totalAmount' }, count: { $sum: 1 } } }
    ]);

    const yearlyStats = await Booking.aggregate([
      { $match: { bookingStatus: 'confirmed', date: { $gte: twelveMonthsAgoStr } } },
      { $group: { _id: null, revenue: { $sum: '$totalAmount' } } }
    ]);
    const yearlyRevenue = yearlyStats[0]?.revenue || 0;

    const totalBookingsCount = totalStats[0]?.count || 0;
    const totalRevenue = totalStats[0]?.revenue || 0;
    const averageBookingValue = totalBookingsCount > 0 ? parseFloat((totalRevenue / totalBookingsCount).toFixed(2)) : 0;

    // Occupancy calculation
    const settings = await Settings.findOne() || new Settings();
    const getOperatingHours = (s) => {
      const open = s.openTime || '06:30';
      const close = s.closeTime || '23:30';
      const [openH, openM] = open.split(':').map(Number);
      const [closeH, closeM] = close.split(':').map(Number);
      return (closeH + closeM / 60) - (openH + openM / 60);
    };
    const dailyOperatingHours = getOperatingHours(settings) || 17;

    const thirtyDaysBookings = await Booking.find({
      bookingStatus: 'confirmed',
      date: { $gte: thirtyDaysAgoStr }
    });

    const totalHoursBooked30Days = thirtyDaysBookings.reduce((sum, b) => sum + (b.duration || 1), 0);
    const totalHoursOpen30Days = 30 * dailyOperatingHours;
    const averageOccupancyRate = totalHoursOpen30Days > 0 ? parseFloat(((totalHoursBooked30Days / totalHoursOpen30Days) * 100).toFixed(2)) : 0;

    // Daily occupancy trend for 30 days
    const occupancyTrend = [];
    const dateMap = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dateMap[dateStr] = 0;
    }

    thirtyDaysBookings.forEach(b => {
      if (dateMap[b.date] !== undefined) {
        dateMap[b.date] += (b.duration || 1);
      }
    });

    Object.entries(dateMap).forEach(([dateStr, bookedHrs]) => {
      const rate = (bookedHrs / dailyOperatingHours) * 100;
      occupancyTrend.push({
        date: dateStr,
        occupancy: parseFloat(rate.toFixed(1))
      });
    });

    // 2. Top 5 active users
    const topUsers = await Booking.aggregate([
      { $match: { bookingStatus: 'confirmed' } },
      { $group: { _id: '$userId', bookingsCount: { $sum: 1 }, totalSpent: { $sum: '$totalAmount' } } },
      { $sort: { bookingsCount: -1 } },
      { $limit: 5 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: '$user' }
    ]);

    // 3. Popular Time Slots
    const popularSlots = await Booking.aggregate([
      { $match: { bookingStatus: 'confirmed' } },
      { $group: { _id: '$startTime', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // 4. Daily revenue line chart data (last 30 days)
    const dailyRevenue = await Booking.aggregate([
      { $match: { bookingStatus: 'confirmed', date: { $gte: thirtyDaysAgoStr } } },
      { $group: { _id: '$date', revenue: { $sum: '$totalAmount' } } },
      { $sort: { _id: 1 } }
    ]);

    // 5. Monthly revenue bar chart data (last 12 months)
    const monthlyRevenue = await Booking.aggregate([
      { $match: { bookingStatus: 'confirmed', date: { $gte: twelveMonthsAgoStr } } },
      { $group: { 
          _id: { $substr: ['$date', 0, 7] }, 
          revenue: { $sum: '$totalAmount' } 
        } 
      },
      { $sort: { _id: 1 } }
    ]);

    // 6. Payment method breakdown
    const paymentBreakdown = await Booking.aggregate([
      { $match: { bookingStatus: 'confirmed' } },
      { $group: { _id: '$paymentMethod', count: { $sum: 1 }, revenue: { $sum: '$totalAmount' } } }
    ]);

    res.status(200).json({
      revenue: {
        today: todayStats[0]?.revenue || 0,
        weekly: weeklyStats[0]?.revenue || 0,
        monthly: monthlyStats[0]?.revenue || 0,
        yearly: yearlyRevenue,
        total: totalRevenue
      },
      bookings: {
        today: todayStats[0]?.count || 0,
        weekly: weeklyStats[0]?.count || 0,
        monthly: monthlyStats[0]?.count || 0,
        total: totalBookingsCount
      },
      averageBookingValue,
      averageOccupancyRate,
      topUsers: topUsers.map(u => ({
        name: u.user.name,
        bookingsCount: u.bookingsCount,
        totalSpent: u.totalSpent
      })),
      popularSlots: popularSlots.map(s => ({
        slot: s._id,
        count: s.count
      })),
      charts: {
        daily: dailyRevenue.map(d => ({ date: d._id, revenue: d.revenue })),
        monthly: monthlyRevenue.map(m => ({ month: m._id, revenue: m.revenue })),
        payments: paymentBreakdown.map(p => ({ method: p._id, count: p.count, revenue: p.revenue })),
        occupancy: occupancyTrend
      }
    });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
};

// Calendar Endpoint
export const getCalendarBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({
      $or: [
        { bookingStatus: 'confirmed' },
        { bookingStatus: 'locked', lockedUntil: { $gt: new Date() } }
      ]
    }).populate('userId', 'name email phone');

    res.status(200).json({ bookings });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get calendar bookings' });
  }
};

// Settings Endpoints
export const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
      await settings.save();
    }
    res.status(200).json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get settings' });
  }
};

export const updateSettings = async (req, res) => {
  try {
    const { 
      pricePerHour, 
      openTime, 
      closeTime,
      instagramLink,
      googleMapsLink,
      maxBookingDuration,
      cashPaymentEnabled,
      onlinePaymentEnabled,
      emailNotificationsEnabled,
      smtpSenderEmail
    } = req.body;

    let settings = await Settings.findOne();
    if (!settings) {
      settings = new Settings();
    }
    
    if (pricePerHour !== undefined) settings.pricePerHour = pricePerHour;
    if (openTime !== undefined) settings.openTime = openTime;
    if (closeTime !== undefined) settings.closeTime = closeTime;
    if (instagramLink !== undefined) settings.instagramLink = instagramLink;
    if (googleMapsLink !== undefined) settings.googleMapsLink = googleMapsLink;
    if (maxBookingDuration !== undefined) settings.maxBookingDuration = maxBookingDuration;
    if (cashPaymentEnabled !== undefined) settings.cashPaymentEnabled = cashPaymentEnabled;
    if (onlinePaymentEnabled !== undefined) settings.onlinePaymentEnabled = onlinePaymentEnabled;

    if (emailNotificationsEnabled !== undefined) settings.emailNotificationsEnabled = emailNotificationsEnabled;
    if (smtpSenderEmail !== undefined) settings.smtpSenderEmail = smtpSenderEmail;

    await settings.save();
    res.status(200).json({ message: 'Settings updated successfully', settings });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
};

// Notifications Endpoints
export const getNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(50);
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups = {
      today: [],
      yesterday: [],
      older: []
    };

    notifications.forEach(n => {
      const created = new Date(n.createdAt);
      if (created >= today) {
        groups.today.push(n);
      } else if (created >= yesterday) {
        groups.yesterday.push(n);
      } else {
        groups.older.push(n);
      }
    });

    res.status(200).json({ notifications, groups });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
};

export const markNotificationsRead = async (req, res) => {
  try {
    await Notification.updateMany({ read: false }, { read: true, seenAt: new Date() });
    res.status(200).json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update notifications' });
  }
};

export const getUnreadNotificationsCount = async (req, res) => {
  try {
    const count = await Notification.countDocuments({ read: false });
    res.status(200).json({ count });
  } catch (error) {
    res.status(500).json({ error: 'Failed to count notifications' });
  }
};

import { sendEmailNotification } from '../utils/sendEmailNotification.js';

export const sendTestEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email address is required for test message' });
    }

    await sendEmailNotification({
      email,
      customerName: 'Test Customer',
      date: new Date().toISOString().split('T')[0],
      time: '18:00',
      duration: '1 Hour',
      amount: 600,
      paymentMethod: 'Online',
      bookingId: 'test_booking_id',
      type: 'booking_confirmation'
    });

    res.status(200).json({ message: 'Test email sent. Check simulation or Email logs.' });
  } catch (err) {
    console.error('Test email error:', err);
    res.status(500).json({ error: 'Failed to send test email' });
  }
};

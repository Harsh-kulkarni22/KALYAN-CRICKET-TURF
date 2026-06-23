import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }
  if (!token) return res.status(401).json({ error: 'Not authorized, no token' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id: userId }
    next();
  } catch (error) {
    res.status(401).json({ error: 'Not authorized, token failed' });
  }
};

export const protectAdmin = async (req, res, next) => {
  try {
    const user = await User.findById(req.user?.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized, admin privileges required' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Server error in admin authorization check' });
  }
};

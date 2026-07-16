import jwt from 'jsonwebtoken';

let isDbConnected = false;

export const setDbConnected = (status) => {
  isDbConnected = status;
};

export const checkDb = (req, res, next) => {
  if (!isDbConnected) {
    return res.status(503).json({ error: 'Database not connected. Please set MONGO_URI.' });
  }
  next();
};

export const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token provided' });
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

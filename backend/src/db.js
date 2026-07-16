import mongoose from 'mongoose';
import { setDbConnected } from './middleware.js';

export const connectDB = async () => {
  if (process.env.MONGO_URI) {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      setDbConnected(true);
      console.log('Connected to MongoDB');
    } catch (err) {
      console.error('MongoDB connection error:', err);
    }
  } else {
    console.warn('MONGO_URI is not set. Database not connected.');
  }
};

import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/survey_platform';
  
  try {
    const conn = await mongoose.connect(uri);
    console.log(`[MongoDB Connected]: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB Connection Error]:`, error);
    // Don't crash immediately in dev so developers see the warning and can provide their Atlas URI
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    }
  }
};

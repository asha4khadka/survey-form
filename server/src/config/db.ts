import mongoose from 'mongoose';

let isConnected = false;

export const connectDB = async (): Promise<void> => {
  // If already connected, reuse connection (essential for Vercel serverless functions)
  if (isConnected || mongoose.connection.readyState >= 1) {
    return;
  }

  const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/survey_platform';

  try {
    const conn = await mongoose.connect(uri, {
      bufferCommands: false,
    });
    isConnected = true;
    console.log(`[MongoDB Connected]: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[MongoDB Connection Error]:`, error);
    // Don't crash immediately in dev so developers see the warning and can provide their Atlas URI
    if (process.env.NODE_ENV === 'production' && !process.env.VERCEL) {
      process.exit(1);
    }
  }
};

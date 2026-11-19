import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import surveyRoutes from './routes/surveyRoutes.js';
import responseRoutes from './routes/responseRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security and utility middlewares
app.use(helmet());
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Health check endpoint BEFORE any database checks so it responds immediately
app.get(['/api/health', '/health'], (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    hasMongoUri: Boolean(process.env.MONGO_URI),
    serverless: Boolean(process.env.VERCEL),
  });
});

// Middleware to ensure Database is connected before executing API operations
app.use(async (req: Request, res: Response, next: NextFunction) => {
  // Skip DB connection for root or health checks
  if (req.path === '/health' || req.path === '/api/health') {
    return next();
  }

  if (!process.env.MONGO_URI) {
    res.status(500).json({
      success: false,
      message: 'Database configuration missing: MONGO_URI environment variable is not configured on Vercel.',
      hint: 'Please go to Vercel Project Settings > Environment Variables, add MONGO_URI, and redeploy.',
    });
    return;
  }

  try {
    await connectDB();
    next();
  } catch (err: any) {
    console.error('Database connection error:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to connect to MongoDB Atlas database.',
      detail: err.message,
      hint: 'Ensure that MongoDB Atlas > Network Access allows connections from anywhere (0.0.0.0/0).',
    });
  }
});

// Mount API Routes with both /api prefix and bare prefix to handle any Vercel Services rewrite
app.use(['/api/auth', '/auth'], authRoutes);
app.use(['/api/surveys', '/surveys'], surveyRoutes);
app.use(['/api/surveys', '/surveys'], responseRoutes);
app.use(['/api/surveys', '/surveys'], analyticsRoutes);

// 404 handler for API routes
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'API route not found' });
});

// Global error handling middleware
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

// Start listening on assigned port (required for Vercel Services and local execution)
const server = app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// Support both ESM and CommonJS exports
(app as any).default = app;
module.exports = app;
export default app;

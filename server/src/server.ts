import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
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
    origin: true, // Allow all origins or specify Vercel domains
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

// Ensure Database is connected (crucial for Vercel serverless function lifecycle)
app.use(async (_req: Request, _res: Response, next: NextFunction) => {
  try {
    await connectDB();
  } catch (err) {
    console.error('Database connection middleware error:', err);
  }
  next();
});

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    serverless: Boolean(process.env.VERCEL),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/surveys', responseRoutes);
app.use('/api/surveys', analyticsRoutes);

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

// Start listening locally when not running in Vercel serverless environment
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on http://localhost:${PORT}`);
  });
}

export default app;

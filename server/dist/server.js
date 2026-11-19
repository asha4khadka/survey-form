"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const mongoose_1 = __importDefault(require("mongoose"));
const db_js_1 = require("./config/db.js");
const authRoutes_js_1 = __importDefault(require("./routes/authRoutes.js"));
const surveyRoutes_js_1 = __importDefault(require("./routes/surveyRoutes.js"));
const responseRoutes_js_1 = __importDefault(require("./routes/responseRoutes.js"));
const analyticsRoutes_js_1 = __importDefault(require("./routes/analyticsRoutes.js"));
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Security and utility middlewares
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: true,
    credentials: true,
}));
app.use(express_1.default.json({ limit: '1mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'production') {
    app.use((0, morgan_1.default)('dev'));
}
// Health check endpoint BEFORE any database checks so it responds immediately
app.get(['/api/health', '/health'], (_req, res) => {
    res.status(200).json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        database: mongoose_1.default.connection.readyState === 1 ? 'connected' : 'disconnected',
        hasMongoUri: Boolean(process.env.MONGO_URI),
        serverless: Boolean(process.env.VERCEL),
    });
});
// Middleware to ensure Database is connected before executing API operations
app.use(async (req, res, next) => {
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
        await (0, db_js_1.connectDB)();
        next();
    }
    catch (err) {
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
app.use(['/api/auth', '/auth'], authRoutes_js_1.default);
app.use(['/api/surveys', '/surveys'], surveyRoutes_js_1.default);
app.use(['/api/surveys', '/surveys'], responseRoutes_js_1.default);
app.use(['/api/surveys', '/surveys'], analyticsRoutes_js_1.default);
// 404 handler for API routes
app.use((_req, res) => {
    res.status(404).json({ success: false, message: 'API route not found' });
});
// Global error handling middleware
app.use((err, _req, res, _next) => {
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
// Support both ESM and CommonJS exports for Vercel Serverless
app.default = app;
module.exports = app;
exports.default = app;

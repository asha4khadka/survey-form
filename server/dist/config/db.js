"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
let isConnected = false;
const connectDB = async () => {
    // If already connected, reuse connection (essential for Vercel serverless functions)
    if (isConnected || mongoose_1.default.connection.readyState >= 1) {
        return;
    }
    const uri = process.env.MONGO_URI;
    if (!uri) {
        throw new Error('MONGO_URI is not set in environment variables');
    }
    try {
        const conn = await mongoose_1.default.connect(uri, {
            bufferCommands: false,
            serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of hanging 30s
            connectTimeoutMS: 5000,
        });
        isConnected = true;
        console.log(`[MongoDB Connected]: ${conn.connection.host}`);
    }
    catch (error) {
        console.error(`[MongoDB Connection Error]:`, error);
        throw error;
    }
};
exports.connectDB = connectDB;

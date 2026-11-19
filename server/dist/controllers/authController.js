"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMe = exports.login = exports.register = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_js_1 = require("../models/User.js");
const generateToken = (id, email, role) => {
    const secret = process.env.JWT_SECRET || 'survey_default_secret_key_2026';
    return jsonwebtoken_1.default.sign({ id, email, role }, secret, { expiresIn: '7d' });
};
const register = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        if (!name || !email || !password) {
            res.status(400).json({ success: false, message: 'Please provide all required fields.' });
            return;
        }
        const existingUser = await User_js_1.User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            res.status(400).json({ success: false, message: 'An account with this email already exists.' });
            return;
        }
        const user = await User_js_1.User.create({
            name,
            email: email.toLowerCase(),
            password,
            role: 'admin',
        });
        const token = generateToken(user._id.toString(), user.email, user.role);
        res.status(201).json({
            success: true,
            message: 'Admin account created successfully.',
            data: {
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            },
        });
    }
    catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error during registration.' });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ success: false, message: 'Please enter both email and password.' });
            return;
        }
        const user = await User_js_1.User.findOne({ email: email.toLowerCase() });
        if (!user) {
            res.status(401).json({ success: false, message: 'Invalid credentials.' });
            return;
        }
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            res.status(401).json({ success: false, message: 'Invalid credentials.' });
            return;
        }
        const token = generateToken(user._id.toString(), user.email, user.role);
        res.status(200).json({
            success: true,
            message: 'Logged in successfully.',
            data: {
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                },
            },
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: error.message || 'Server error during login.' });
    }
};
exports.login = login;
const getMe = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const user = await User_js_1.User.findById(req.user.id).select('-password');
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }
        res.status(200).json({
            success: true,
            data: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
            },
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Server error.' });
    }
};
exports.getMe = getMe;

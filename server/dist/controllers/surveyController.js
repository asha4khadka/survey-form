"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteSurvey = exports.updateSurveyStatus = exports.updateSurvey = exports.getSurveyById = exports.getSurveys = exports.createSurvey = void 0;
const mongoose_1 = require("mongoose");
const Survey_js_1 = require("../models/Survey.js");
const Response_js_1 = require("../models/Response.js");
// Helper to generate IDs for questions if not provided
const sanitizeQuestions = (questions) => {
    if (!Array.isArray(questions))
        return [];
    return questions.map((q, idx) => ({
        id: q.id || `q_${Date.now()}_${idx}`,
        type: q.type || 'text',
        title: q.title || `Untitled Question ${idx + 1}`,
        description: q.description || '',
        required: !!q.required,
        options: Array.isArray(q.options) ? q.options : [],
        minRating: typeof q.minRating === 'number' ? q.minRating : 1,
        maxRating: typeof q.maxRating === 'number' ? q.maxRating : 5,
        minRatingLabel: q.minRatingLabel || 'Poor',
        maxRatingLabel: q.maxRatingLabel || 'Excellent',
        conditions: Array.isArray(q.conditions) ? q.conditions : [],
    }));
};
/**
 * Create a new survey
 */
const createSurvey = async (req, res) => {
    try {
        const { title, description, questions, status } = req.body;
        if (!title || typeof title !== 'string' || title.trim() === '') {
            res.status(400).json({ success: false, message: 'Survey title is required.' });
            return;
        }
        const sanitizedQuestions = sanitizeQuestions(questions || []);
        const survey = await Survey_js_1.Survey.create({
            title: title.trim(),
            description: (description || '').trim(),
            questions: sanitizedQuestions,
            status: status || 'published',
            version: 1,
            createdBy: req.user?.id ? new mongoose_1.Types.ObjectId(req.user.id) : undefined,
        });
        res.status(201).json({
            success: true,
            message: 'Survey created successfully.',
            data: survey,
        });
    }
    catch (error) {
        console.error('Create survey error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to create survey.' });
    }
};
exports.createSurvey = createSurvey;
/**
 * Get all surveys (Admin view, with response counts)
 */
const getSurveys = async (req, res) => {
    try {
        const { status } = req.query;
        const filter = {};
        if (status && ['draft', 'published', 'archived'].includes(status)) {
            filter.status = status;
        }
        const surveys = await Survey_js_1.Survey.find(filter).sort({ createdAt: -1 });
        // Aggregate response counts per survey
        const surveyIds = surveys.map((s) => s._id);
        const responseCounts = await Response_js_1.SurveyResponse.aggregate([
            { $match: { surveyId: { $in: surveyIds } } },
            { $group: { _id: '$surveyId', count: { $sum: 1 } } },
        ]);
        const countMap = new Map();
        responseCounts.forEach((r) => countMap.set(r._id.toString(), r.count));
        const enrichedSurveys = surveys.map((s) => ({
            ...s.toObject(),
            responseCount: countMap.get(s._id.toString()) || 0,
            questionCount: s.questions.length,
        }));
        res.status(200).json({
            success: true,
            count: enrichedSurveys.length,
            data: enrichedSurveys,
        });
    }
    catch (error) {
        console.error('Get surveys error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to fetch surveys.' });
    }
};
exports.getSurveys = getSurveys;
/**
 * Get single survey by ID
 */
const getSurveyById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            res.status(400).json({ success: false, message: 'Invalid survey ID format.' });
            return;
        }
        const survey = await Survey_js_1.Survey.findById(id);
        if (!survey) {
            res.status(404).json({ success: false, message: 'Survey not found.' });
            return;
        }
        // If request has no user (public view) and survey is not published
        if (!req.user && survey.status !== 'published') {
            res.status(403).json({
                success: false,
                message: 'This survey is not currently accepting responses (status: ' + survey.status + ').',
            });
            return;
        }
        const responseCount = await Response_js_1.SurveyResponse.countDocuments({ surveyId: survey._id });
        res.status(200).json({
            success: true,
            data: {
                ...survey.toObject(),
                responseCount,
            },
        });
    }
    catch (error) {
        console.error('Get survey by ID error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to fetch survey.' });
    }
};
exports.getSurveyById = getSurveyById;
/**
 * Update survey (schema, questions, title, description)
 */
const updateSurvey = async (req, res) => {
    try {
        const { id } = req.params;
        const { title, description, questions, status } = req.body;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            res.status(400).json({ success: false, message: 'Invalid survey ID format.' });
            return;
        }
        const survey = await Survey_js_1.Survey.findById(id);
        if (!survey) {
            res.status(404).json({ success: false, message: 'Survey not found.' });
            return;
        }
        if (title)
            survey.title = title.trim();
        if (description !== undefined)
            survey.description = description.trim();
        if (status && ['draft', 'published', 'archived'].includes(status)) {
            survey.status = status;
        }
        if (questions) {
            survey.questions = sanitizeQuestions(questions);
            // Bump survey version on question schema edit
            survey.version = (survey.version || 1) + 1;
        }
        await survey.save();
        res.status(200).json({
            success: true,
            message: 'Survey updated successfully.',
            data: survey,
        });
    }
    catch (error) {
        console.error('Update survey error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to update survey.' });
    }
};
exports.updateSurvey = updateSurvey;
/**
 * Update survey status only (draft, published, archived)
 */
const updateSurveyStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (!['draft', 'published', 'archived'].includes(status)) {
            res.status(400).json({ success: false, message: 'Invalid status value.' });
            return;
        }
        const survey = await Survey_js_1.Survey.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });
        if (!survey) {
            res.status(404).json({ success: false, message: 'Survey not found.' });
            return;
        }
        res.status(200).json({
            success: true,
            message: `Survey status updated to ${status}.`,
            data: survey,
        });
    }
    catch (error) {
        res.status(500).json({ success: false, message: error.message || 'Failed to update status.' });
    }
};
exports.updateSurveyStatus = updateSurveyStatus;
/**
 * Delete survey and associated responses
 */
const deleteSurvey = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose_1.Types.ObjectId.isValid(id)) {
            res.status(400).json({ success: false, message: 'Invalid survey ID format.' });
            return;
        }
        const survey = await Survey_js_1.Survey.findByIdAndDelete(id);
        if (!survey) {
            res.status(404).json({ success: false, message: 'Survey not found.' });
            return;
        }
        // Cascade delete responses for this survey
        await Response_js_1.SurveyResponse.deleteMany({ surveyId: survey._id });
        res.status(200).json({
            success: true,
            message: 'Survey and its responses deleted successfully.',
        });
    }
    catch (error) {
        console.error('Delete survey error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to delete survey.' });
    }
};
exports.deleteSurvey = deleteSurvey;

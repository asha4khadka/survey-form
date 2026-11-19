"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.Survey = void 0;
const mongoose_1 = __importStar(require("mongoose"));
const ConditionRuleSchema = new mongoose_1.Schema({
    dependsOnQuestionId: { type: String, required: true },
    operator: {
        type: String,
        enum: ['equals', 'not_equals', 'contains', 'greater_than', 'less_than'],
        required: true,
        default: 'equals',
    },
    value: { type: mongoose_1.Schema.Types.Mixed, required: true },
}, { _id: false });
const QuestionSchema = new mongoose_1.Schema({
    id: { type: String, required: true },
    type: {
        type: String,
        enum: ['text', 'multiple_choice', 'checkbox', 'rating'],
        required: true,
    },
    title: { type: String, required: [true, 'Question title is required'], trim: true },
    description: { type: String, default: '' },
    required: { type: Boolean, default: false },
    options: { type: [String], default: [] },
    minRating: { type: Number, default: 1 },
    maxRating: { type: Number, default: 5 },
    minRatingLabel: { type: String, default: 'Poor' },
    maxRatingLabel: { type: String, default: 'Excellent' },
    conditions: { type: [ConditionRuleSchema], default: [] },
}, { _id: false });
const SurveySchema = new mongoose_1.Schema({
    title: {
        type: String,
        required: [true, 'Survey title is required'],
        trim: true,
        maxlength: [150, 'Title cannot exceed 150 characters'],
    },
    description: {
        type: String,
        default: '',
        trim: true,
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'archived'],
        default: 'published',
    },
    version: {
        type: Number,
        default: 1,
    },
    questions: {
        type: [QuestionSchema],
        default: [],
    },
    createdBy: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
    },
}, {
    timestamps: true,
});
// Indexes
SurveySchema.index({ status: 1, createdAt: -1 });
SurveySchema.index({ createdBy: 1 });
exports.Survey = mongoose_1.default.model('Survey', SurveySchema);

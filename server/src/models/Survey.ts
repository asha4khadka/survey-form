import mongoose, { Document, Schema, Types } from 'mongoose';

export type QuestionType = 'text' | 'multiple_choice' | 'checkbox' | 'rating';

export type ConditionOperator =
  | 'equals'
  | 'not_equals'
  | 'contains'
  | 'greater_than'
  | 'less_than';

export interface IConditionRule {
  dependsOnQuestionId: string;
  operator: ConditionOperator;
  value: any;
}

export interface IQuestion {
  id: string; // unique string id (e.g. q_1732000000)
  type: QuestionType;
  title: string;
  description?: string;
  required: boolean;
  options?: string[]; // for multiple_choice and checkbox
  minRating?: number; // default 1
  maxRating?: number; // default 5
  minRatingLabel?: string;
  maxRatingLabel?: string;
  conditions?: IConditionRule[];
}

export interface ISurvey extends Document {
  title: string;
  description?: string;
  status: 'draft' | 'published' | 'archived';
  version: number;
  questions: IQuestion[];
  createdBy?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ConditionRuleSchema = new Schema<IConditionRule>(
  {
    dependsOnQuestionId: { type: String, required: true },
    operator: {
      type: String,
      enum: ['equals', 'not_equals', 'contains', 'greater_than', 'less_than'],
      required: true,
      default: 'equals',
    },
    value: { type: Schema.Types.Mixed, required: true },
  },
  { _id: false }
);

const QuestionSchema = new Schema<IQuestion>(
  {
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
  },
  { _id: false }
);

const SurveySchema = new Schema<ISurvey>(
  {
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
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
SurveySchema.index({ status: 1, createdAt: -1 });
SurveySchema.index({ createdBy: 1 });

export const Survey = mongoose.model<ISurvey>('Survey', SurveySchema);

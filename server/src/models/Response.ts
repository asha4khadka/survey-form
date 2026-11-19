import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IAnswer {
  questionId: string;
  questionType: string;
  value: any; // string | string[] | number
}

export interface IResponse extends Document {
  surveyId: Types.ObjectId;
  surveyVersion: number;
  answers: Map<string, any>; // questionId -> value
  respondentIp?: string;
  userAgent?: string;
  isComplete: boolean;
  submittedAt: Date;
}

const ResponseSchema = new Schema<IResponse>(
  {
    surveyId: {
      type: Schema.Types.ObjectId,
      ref: 'Survey',
      required: [true, 'Survey ID is required'],
      index: true,
    },
    surveyVersion: {
      type: Number,
      required: true,
      default: 1,
    },
    answers: {
      type: Map,
      of: Schema.Types.Mixed,
      required: true,
      default: {},
    },
    respondentIp: {
      type: String,
      default: 'anonymous',
    },
    userAgent: {
      type: String,
      default: '',
    },
    isComplete: {
      type: Boolean,
      default: true,
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

ResponseSchema.index({ surveyId: 1, submittedAt: -1 });

export const SurveyResponse = mongoose.model<IResponse>('SurveyResponse', ResponseSchema);

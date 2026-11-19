import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IDraft extends Document {
  draftToken: string;
  surveyId: Types.ObjectId;
  answers: Map<string, any>;
  lastSavedAt: Date;
}

const DraftSchema = new Schema<IDraft>(
  {
    draftToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    surveyId: {
      type: Schema.Types.ObjectId,
      ref: 'Survey',
      required: true,
      index: true,
    },
    answers: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
    lastSavedAt: {
      type: Date,
      default: Date.now,
      expires: 60 * 60 * 24 * 7, // auto-expire after 7 days
    },
  },
  {
    timestamps: true,
  }
);

export const SurveyDraft = mongoose.model<IDraft>('SurveyDraft', DraftSchema);

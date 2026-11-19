import { Request, Response } from 'express';
import { Types } from 'mongoose';
import crypto from 'crypto';
import { Survey } from '../models/Survey.js';
import { SurveyResponse } from '../models/Response.js';
import { SurveyDraft } from '../models/Draft.js';
import { shouldShowQuestion } from '../utils/conditionEvaluator.js';

/**
 * Submit survey response (Public or Authenticated)
 */
export const submitResponse = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: surveyId } = req.params;
    const { answers, honeypot, draftToken } = req.body;

    // 1. Anti-spam honeypot verification
    if (honeypot && honeypot.trim() !== '') {
      // Return 200 to trick bots, but don't save
      res.status(200).json({ success: true, message: 'Response submitted successfully.' });
      return;
    }

    if (!Types.ObjectId.isValid(surveyId)) {
      res.status(400).json({ success: false, message: 'Invalid survey ID.' });
      return;
    }

    const survey = await Survey.findById(surveyId);
    if (!survey) {
      res.status(404).json({ success: false, message: 'Survey not found.' });
      return;
    }

    if (survey.status !== 'published') {
      res.status(403).json({
        success: false,
        message: 'This survey is not currently accepting submissions.',
      });
      return;
    }

    const sanitizedAnswers: Record<string, any> = answers || {};
    const validationErrors: string[] = [];
    const finalFilteredAnswers = new Map<string, any>();

    // 2. Validate questions based on conditional visibility and schema
    for (const question of survey.questions) {
      const isVisible = shouldShowQuestion(question, sanitizedAnswers);

      if (!isVisible) {
        // Discard answers for questions hidden by logic
        continue;
      }

      const val = sanitizedAnswers[question.id];

      // Check required validation
      const isEmpty =
        val === undefined ||
        val === null ||
        val === '' ||
        (Array.isArray(val) && val.length === 0);

      if (question.required && isEmpty) {
        validationErrors.push(`"${question.title}" is required.`);
        continue;
      }

      if (!isEmpty) {
        // Type validations
        if (question.type === 'rating') {
          const numVal = Number(val);
          const min = question.minRating ?? 1;
          const max = question.maxRating ?? 5;
          if (isNaN(numVal) || numVal < min || numVal > max) {
            validationErrors.push(
              `"${question.title}" must be a rating between ${min} and ${max}.`
            );
            continue;
          }
          finalFilteredAnswers.set(question.id, numVal);
        } else if (question.type === 'multiple_choice') {
          if (question.options && question.options.length > 0 && !question.options.includes(val)) {
            validationErrors.push(`"${val}" is not a valid option for "${question.title}".`);
            continue;
          }
          finalFilteredAnswers.set(question.id, val);
        } else if (question.type === 'checkbox') {
          if (!Array.isArray(val)) {
            validationErrors.push(`"${question.title}" answers must be an array.`);
            continue;
          }
          finalFilteredAnswers.set(question.id, val);
        } else {
          // text input
          finalFilteredAnswers.set(question.id, String(val).trim());
        }
      }
    }

    if (validationErrors.length > 0) {
      res.status(400).json({
        success: false,
        message: 'Validation failed.',
        errors: validationErrors,
      });
      return;
    }

    // 3. Capture respondent IP & User Agent for audit/rate-limiting
    const respondentIp =
      (req.headers['x-forwarded-for'] as string) ||
      req.socket.remoteAddress ||
      'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';

    const newResponse = await SurveyResponse.create({
      surveyId: survey._id,
      surveyVersion: survey.version,
      answers: finalFilteredAnswers,
      respondentIp,
      userAgent,
      isComplete: true,
      submittedAt: new Date(),
    });

    // Clean up draft if one was used
    if (draftToken) {
      await SurveyDraft.deleteOne({ draftToken });
    }

    res.status(201).json({
      success: true,
      message: 'Your response has been submitted successfully!',
      responseId: newResponse._id,
    });
  } catch (error: any) {
    console.error('Submit response error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to submit response.' });
  }
};

/**
 * Save partial response on the backend (Bonus: avoids localStorage)
 */
export const saveDraft = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: surveyId } = req.params;
    let { draftToken, answers } = req.body;

    if (!Types.ObjectId.isValid(surveyId)) {
      res.status(400).json({ success: false, message: 'Invalid survey ID.' });
      return;
    }

    if (!draftToken) {
      draftToken = crypto.randomUUID();
    }

    const draft = await SurveyDraft.findOneAndUpdate(
      { draftToken, surveyId },
      {
        draftToken,
        surveyId: new Types.ObjectId(surveyId),
        answers: answers || {},
        lastSavedAt: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.status(200).json({
      success: true,
      message: 'Draft response saved to cloud.',
      draftToken: draft.draftToken,
      lastSavedAt: draft.lastSavedAt,
    });
  } catch (error: any) {
    console.error('Save draft error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to save draft.' });
  }
};

/**
 * Retrieve saved partial response draft
 */
export const getDraft = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id: surveyId, draftToken } = req.params;

    if (!draftToken) {
      res.status(400).json({ success: false, message: 'Draft token is required.' });
      return;
    }

    const draft = await SurveyDraft.findOne({ surveyId, draftToken });

    if (!draft) {
      res.status(404).json({ success: false, message: 'Draft not found.' });
      return;
    }

    res.status(200).json({
      success: true,
      data: {
        draftToken: draft.draftToken,
        answers: draft.answers,
        lastSavedAt: draft.lastSavedAt,
      },
    });
  } catch (error: any) {
    console.error('Get draft error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to get draft.' });
  }
};

import { Response } from 'express';
import { Types } from 'mongoose';
import { Survey } from '../models/Survey.js';
import { SurveyResponse } from '../models/Response.js';
import { AuthRequest } from '../middlewares/auth.js';

export const getSurveyAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id: surveyId } = req.params;

    if (!Types.ObjectId.isValid(surveyId)) {
      res.status(400).json({ success: false, message: 'Invalid survey ID format.' });
      return;
    }

    const survey = await Survey.findById(surveyId);
    if (!survey) {
      res.status(404).json({ success: false, message: 'Survey not found.' });
      return;
    }

    // Fetch all completed responses for this survey
    const responses = await SurveyResponse.find({ surveyId: survey._id }).sort({ submittedAt: -1 });
    const totalResponses = responses.length;

    // Process analytics per question
    const questionAnalytics = survey.questions.map((question) => {
      const qid = question.id;
      const qType = question.type;

      if (qType === 'multiple_choice') {
        const optionCounts: Record<string, number> = {};
        (question.options || []).forEach((opt) => {
          optionCounts[opt] = 0;
        });

        let answeredCount = 0;
        responses.forEach((resp) => {
          const val = resp.answers.get(qid);
          if (val !== undefined && val !== null && val !== '') {
            answeredCount++;
            optionCounts[val] = (optionCounts[val] || 0) + 1;
          }
        });

        const breakdown = Object.entries(optionCounts).map(([option, count]) => ({
          option,
          count,
          percentage: answeredCount > 0 ? Number(((count / answeredCount) * 100).toFixed(1)) : 0,
        }));

        return {
          id: qid,
          type: qType,
          title: question.title,
          required: question.required,
          totalAnswered: answeredCount,
          responseRate: totalResponses > 0 ? Number(((answeredCount / totalResponses) * 100).toFixed(1)) : 0,
          breakdown,
        };
      }

      if (qType === 'checkbox') {
        const optionCounts: Record<string, number> = {};
        (question.options || []).forEach((opt) => {
          optionCounts[opt] = 0;
        });

        let answeredCount = 0;
        responses.forEach((resp) => {
          const val = resp.answers.get(qid);
          if (Array.isArray(val) && val.length > 0) {
            answeredCount++;
            val.forEach((selectedOpt) => {
              optionCounts[selectedOpt] = (optionCounts[selectedOpt] || 0) + 1;
            });
          }
        });

        const breakdown = Object.entries(optionCounts).map(([option, count]) => ({
          option,
          count,
          percentage: answeredCount > 0 ? Number(((count / answeredCount) * 100).toFixed(1)) : 0,
        }));

        return {
          id: qid,
          type: qType,
          title: question.title,
          required: question.required,
          totalAnswered: answeredCount,
          responseRate: totalResponses > 0 ? Number(((answeredCount / totalResponses) * 100).toFixed(1)) : 0,
          breakdown,
        };
      }

      if (qType === 'rating') {
        const minRating = question.minRating ?? 1;
        const maxRating = question.maxRating ?? 5;
        const ratingDistribution: Record<number, number> = {};
        for (let i = minRating; i <= maxRating; i++) {
          ratingDistribution[i] = 0;
        }

        let answeredCount = 0;
        let sumRatings = 0;

        responses.forEach((resp) => {
          const val = resp.answers.get(qid);
          if (typeof val === 'number') {
            answeredCount++;
            sumRatings += val;
            ratingDistribution[val] = (ratingDistribution[val] || 0) + 1;
          }
        });

        const averageRating =
          answeredCount > 0 ? Number((sumRatings / answeredCount).toFixed(2)) : 0;

        const breakdown = Object.entries(ratingDistribution).map(([rating, count]) => ({
          rating: Number(rating),
          count,
          percentage: answeredCount > 0 ? Number(((count / answeredCount) * 100).toFixed(1)) : 0,
        }));

        return {
          id: qid,
          type: qType,
          title: question.title,
          required: question.required,
          minRating,
          maxRating,
          minRatingLabel: question.minRatingLabel,
          maxRatingLabel: question.maxRatingLabel,
          totalAnswered: answeredCount,
          averageRating,
          breakdown,
        };
      }

      // Default: text question
      const textResponses: Array<{ text: string; submittedAt: Date; responseId: string }> = [];
      responses.forEach((resp) => {
        const val = resp.answers.get(qid);
        if (val !== undefined && val !== null && String(val).trim() !== '') {
          textResponses.push({
            text: String(val).trim(),
            submittedAt: resp.submittedAt,
            responseId: resp._id.toString(),
          });
        }
      });

      return {
        id: qid,
        type: qType,
        title: question.title,
        required: question.required,
        totalAnswered: textResponses.length,
        responseRate:
          totalResponses > 0
            ? Number(((textResponses.length / totalResponses) * 100).toFixed(1))
            : 0,
        responses: textResponses,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        survey: {
          id: survey._id,
          title: survey.title,
          description: survey.description,
          status: survey.status,
          version: survey.version,
          createdAt: survey.createdAt,
          updatedAt: survey.updatedAt,
        },
        overview: {
          totalResponses,
          lastResponseAt: responses.length > 0 ? responses[0].submittedAt : null,
          totalQuestions: survey.questions.length,
        },
        questions: questionAnalytics,
      },
    });
  } catch (error: any) {
    console.error('Analytics error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to fetch analytics.' });
  }
};

/**
 * Export responses as CSV or JSON
 */
export const exportSurveyData = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id: surveyId } = req.params;
    const { format = 'csv' } = req.query;

    if (!Types.ObjectId.isValid(surveyId)) {
      res.status(400).json({ success: false, message: 'Invalid survey ID format.' });
      return;
    }

    const survey = await Survey.findById(surveyId);
    if (!survey) {
      res.status(404).json({ success: false, message: 'Survey not found.' });
      return;
    }

    const responses = await SurveyResponse.find({ surveyId: survey._id }).sort({ submittedAt: -1 });

    if (format === 'json') {
      const formatted = responses.map((r) => {
        const row: Record<string, any> = {
          responseId: r._id,
          submittedAt: r.submittedAt,
          ip: r.respondentIp,
        };
        survey.questions.forEach((q) => {
          row[q.title] = r.answers.get(q.id) ?? null;
        });
        return row;
      });

      res.setHeader('Content-Type', 'application/json');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${survey.title.replace(/[^a-zA-Z0-9]/g, '_')}_responses.json"`
      );
      res.send(JSON.stringify(formatted, null, 2));
      return;
    }

    // Default: CSV format
    const escapeCsv = (str: any): string => {
      if (str === null || str === undefined) return '""';
      const s = Array.isArray(str) ? str.join(', ') : String(str);
      return `"${s.replace(/"/g, '""')}"`;
    };

    const headers = [
      'Response ID',
      'Submitted At',
      'IP Address',
      ...survey.questions.map((q) => q.title),
    ];

    const rows = responses.map((r) => {
      return [
        escapeCsv(r._id.toString()),
        escapeCsv(r.submittedAt.toISOString()),
        escapeCsv(r.respondentIp),
        ...survey.questions.map((q) => escapeCsv(r.answers.get(q.id))),
      ].join(',');
    });

    const csvContent = [headers.map((h) => escapeCsv(h)).join(','), ...rows].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${survey.title.replace(/[^a-zA-Z0-9]/g, '_')}_responses.csv"`
    );
    res.status(200).send(csvContent);
  } catch (error: any) {
    console.error('Export error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to export survey data.' });
  }
};

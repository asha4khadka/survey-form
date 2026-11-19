import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { User } from './models/User.js';
import { Survey } from './models/Survey.js';
import { SurveyResponse } from './models/Response.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/survey_platform';

export const seedDatabase = async () => {
  try {
    console.log('[Seed]: Connecting to database...');
    await mongoose.connect(MONGO_URI);
    console.log('[Seed]: Connected successfully.');

    // 1. Create or update Demo Admin
    const adminEmail = 'admin@survey.dev';
    let admin = await User.findOne({ email: adminEmail });
    if (!admin) {
      admin = await User.create({
        name: 'Alex Mercer (Admin)',
        email: adminEmail,
        password: 'admin123456',
        role: 'admin',
      });
      console.log(`[Seed]: Created default demo admin: ${adminEmail} (password: admin123456)`);
    } else {
      console.log(`[Seed]: Demo admin already exists: ${adminEmail}`);
    }

    // Check if demo survey already exists
    const existingSurvey = await Survey.findOne({ title: 'Customer Experience & Product Feedback 2026' });
    if (existingSurvey) {
      console.log('[Seed]: Demo survey already exists. Skipping survey re-seed.');
      await mongoose.disconnect();
      return;
    }

    // 2. Create Flagship Demo Survey with Conditional Logic
    const q1Id = 'q_experience_used';
    const q2Id = 'q_usage_frequency';
    const q3Id = 'q_features_used';
    const q4Id = 'q_non_user_reasons';
    const q5Id = 'q_satisfaction_rating';
    const q6Id = 'q_feature_suggestions';

    const demoSurvey = await Survey.create({
      title: 'Customer Experience & Product Feedback 2026',
      description:
        'Help us improve our dynamic survey platform by sharing your thoughts. Questions adapt in real-time based on your answers!',
      status: 'published',
      version: 1,
      createdBy: admin._id,
      questions: [
        {
          id: q1Id,
          type: 'multiple_choice',
          title: 'Have you used our product or platform before?',
          description: 'Select your familiarity with our services.',
          required: true,
          options: ['Yes', 'No'],
          conditions: [],
        },
        {
          id: q2Id,
          type: 'multiple_choice',
          title: 'How often do you use our platform?',
          description: 'This question only appears if you selected "Yes" above.',
          required: true,
          options: ['Daily', 'Weekly', 'Monthly', 'Rarely'],
          conditions: [
            {
              dependsOnQuestionId: q1Id,
              operator: 'equals',
              value: 'Yes',
            },
          ],
        },
        {
          id: q3Id,
          type: 'checkbox',
          title: 'Which features do you use most frequently?',
          description: 'Check all that apply.',
          required: false,
          options: [
            'Dynamic Survey Builder',
            'Conditional Logic Engine',
            'Real-Time Analytics',
            'CSV & Data Export',
            'Cloud Draft Save',
          ],
          conditions: [
            {
              dependsOnQuestionId: q1Id,
              operator: 'equals',
              value: 'Yes',
            },
          ],
        },
        {
          id: q4Id,
          type: 'text',
          title: 'What has prevented you from trying our product so far?',
          description: 'This question only appears if you selected "No" above.',
          required: false,
          conditions: [
            {
              dependsOnQuestionId: q1Id,
              operator: 'equals',
              value: 'No',
            },
          ],
        },
        {
          id: q5Id,
          type: 'rating',
          title: 'How would you rate your overall satisfaction with the user interface?',
          description: 'Rate on a scale from 1 (Poor) to 5 (Excellent).',
          required: true,
          minRating: 1,
          maxRating: 5,
          minRatingLabel: 'Poor',
          maxRatingLabel: 'Excellent',
          conditions: [],
        },
        {
          id: q6Id,
          type: 'text',
          title: 'What specific improvement or new capability would you like to see next?',
          description: 'Your open feedback helps our team prioritize the roadmap.',
          required: false,
          conditions: [],
        },
      ],
    });

    console.log(`[Seed]: Created demo survey: "${demoSurvey.title}" (ID: ${demoSurvey._id})`);

    // 3. Seed Realistic Sample Responses for Rich Analytics
    const sampleResponses = [
      {
        q1: 'Yes',
        q2: 'Daily',
        q3: ['Dynamic Survey Builder', 'Real-Time Analytics', 'CSV & Data Export'],
        q5: 5,
        q6: 'Loved how fast the branching condition evaluated on the frontend!',
      },
      {
        q1: 'Yes',
        q2: 'Weekly',
        q3: ['Conditional Logic Engine', 'Real-Time Analytics'],
        q5: 4,
        q6: 'Add more chart styles like donut and pie charts in the analytics.',
      },
      {
        q1: 'No',
        q4: 'Just heard about it through a colleague, currently evaluating tools for our team.',
        q5: 4,
        q6: 'Looking forward to webhooks and Slack integrations.',
      },
      {
        q1: 'Yes',
        q2: 'Daily',
        q3: ['Dynamic Survey Builder', 'Conditional Logic Engine', 'Cloud Draft Save'],
        q5: 5,
        q6: 'Clean and modern UI, very intuitive drag and reorder.',
      },
      {
        q1: 'Yes',
        q2: 'Monthly',
        q3: ['CSV & Data Export'],
        q5: 3,
        q6: 'Would be great to support PDF summary report downloads.',
      },
      {
        q1: 'No',
        q4: 'We were using Google Forms, but need conditional logic and better analytics.',
        q5: 5,
        q6: 'Make it easy to embed on external sites via iframe or widget.',
      },
      {
        q1: 'Yes',
        q2: 'Weekly',
        q3: ['Dynamic Survey Builder', 'Real-Time Analytics'],
        q5: 4,
        q6: 'The auto-save draft to cloud is a great touch for long forms.',
      },
      {
        q1: 'Yes',
        q2: 'Daily',
        q3: ['Dynamic Survey Builder', 'Conditional Logic Engine', 'Real-Time Analytics', 'CSV & Data Export'],
        q5: 5,
        q6: 'Outstanding performance and clean responsive layout on mobile.',
      },
    ];

    for (let i = 0; i < sampleResponses.length; i++) {
      const s = sampleResponses[i];
      const answers = new Map<string, any>();

      answers.set(q1Id, s.q1);
      if (s.q2) answers.set(q2Id, s.q2);
      if (s.q3) answers.set(q3Id, s.q3);
      if (s.q4) answers.set(q4Id, s.q4);
      answers.set(q5Id, s.q5);
      if (s.q6) answers.set(q6Id, s.q6);

      const submittedDate = new Date(Date.now() - (sampleResponses.length - i) * 3600 * 1000 * 4);

      await SurveyResponse.create({
        surveyId: demoSurvey._id,
        surveyVersion: demoSurvey.version,
        answers,
        respondentIp: `192.168.1.${10 + i}`,
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
        isComplete: true,
        submittedAt: submittedDate,
      });
    }

    console.log(`[Seed]: Created ${sampleResponses.length} sample responses with realistic data.`);
    console.log('[Seed]: Seeding complete!');
    await mongoose.disconnect();
  } catch (error) {
    console.error('[Seed Error]:', error);
  }
};

// Run if called directly
seedDatabase();

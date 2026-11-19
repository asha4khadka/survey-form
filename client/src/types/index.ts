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
  id: string;
  type: QuestionType;
  title: string;
  description?: string;
  required: boolean;
  options?: string[];
  minRating?: number;
  maxRating?: number;
  minRatingLabel?: string;
  maxRatingLabel?: string;
  conditions?: IConditionRule[];
}

export interface ISurvey {
  _id: string;
  title: string;
  description?: string;
  status: 'draft' | 'published' | 'archived';
  version: number;
  questions: IQuestion[];
  responseCount?: number;
  questionCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface IUser {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface IQuestionAnalytics {
  id: string;
  type: QuestionType;
  title: string;
  required: boolean;
  totalAnswered: number;
  responseRate: number;
  // Multiple choice & Checkbox
  breakdown?: Array<{
    option?: string;
    rating?: number;
    count: number;
    percentage: number;
  }>;
  // Rating
  averageRating?: number;
  minRating?: number;
  maxRating?: number;
  minRatingLabel?: string;
  maxRatingLabel?: string;
  // Text
  responses?: Array<{
    text: string;
    submittedAt: string;
    responseId: string;
  }>;
}

export interface IAnalyticsData {
  survey: {
    id: string;
    title: string;
    description: string;
    status: string;
    version: number;
    createdAt: string;
    updatedAt: string;
  };
  overview: {
    totalResponses: number;
    lastResponseAt: string | null;
    totalQuestions: number;
  };
  questions: IQuestionAnalytics[];
}

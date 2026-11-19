import { Router } from 'express';
import { submitResponse, saveDraft, getDraft } from '../controllers/responseController.js';
import { surveySubmissionLimiter } from '../middlewares/rateLimiter.js';

const router = Router();

// Public submission with rate limiting and anti-spam
router.post('/:id/responses', surveySubmissionLimiter, submitResponse);

// Backend partial draft saving (avoids localStorage)
router.post('/:id/drafts', saveDraft);
router.get('/:id/drafts/:draftToken', getDraft);

export default router;

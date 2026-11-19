import { Router } from 'express';
import {
  createSurvey,
  getSurveys,
  getSurveyById,
  updateSurvey,
  updateSurveyStatus,
  deleteSurvey,
} from '../controllers/surveyController.js';
import { authenticateJWT, optionalAuth } from '../middlewares/auth.js';

const router = Router();

// Public / optionally authenticated
router.get('/:id', optionalAuth, getSurveyById);

// Admin authenticated routes
router.get('/', authenticateJWT, getSurveys);
router.post('/', authenticateJWT, createSurvey);
router.put('/:id', authenticateJWT, updateSurvey);
router.patch('/:id/status', authenticateJWT, updateSurveyStatus);
router.delete('/:id', authenticateJWT, deleteSurvey);

export default router;

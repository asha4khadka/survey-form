import { Router } from 'express';
import { getSurveyAnalytics, exportSurveyData } from '../controllers/analyticsController.js';
import { authenticateJWT } from '../middlewares/auth.js';

const router = Router();

// Protected analytics endpoints for survey owners/admins
router.get('/:id/analytics', authenticateJWT, getSurveyAnalytics);
router.get('/:id/export', authenticateJWT, exportSurveyData);

export default router;

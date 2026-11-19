"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const surveyController_js_1 = require("../controllers/surveyController.js");
const auth_js_1 = require("../middlewares/auth.js");
const router = (0, express_1.Router)();
// Public / optionally authenticated
router.get('/:id', auth_js_1.optionalAuth, surveyController_js_1.getSurveyById);
// Admin authenticated routes
router.get('/', auth_js_1.authenticateJWT, surveyController_js_1.getSurveys);
router.post('/', auth_js_1.authenticateJWT, surveyController_js_1.createSurvey);
router.put('/:id', auth_js_1.authenticateJWT, surveyController_js_1.updateSurvey);
router.patch('/:id/status', auth_js_1.authenticateJWT, surveyController_js_1.updateSurveyStatus);
router.delete('/:id', auth_js_1.authenticateJWT, surveyController_js_1.deleteSurvey);
exports.default = router;

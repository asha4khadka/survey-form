"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const analyticsController_js_1 = require("../controllers/analyticsController.js");
const auth_js_1 = require("../middlewares/auth.js");
const router = (0, express_1.Router)();
// Protected analytics endpoints for survey owners/admins
router.get('/:id/analytics', auth_js_1.authenticateJWT, analyticsController_js_1.getSurveyAnalytics);
router.get('/:id/export', auth_js_1.authenticateJWT, analyticsController_js_1.exportSurveyData);
exports.default = router;

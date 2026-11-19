"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const responseController_js_1 = require("../controllers/responseController.js");
const rateLimiter_js_1 = require("../middlewares/rateLimiter.js");
const router = (0, express_1.Router)();
// Public submission with rate limiting and anti-spam
router.post('/:id/responses', rateLimiter_js_1.surveySubmissionLimiter, responseController_js_1.submitResponse);
// Backend partial draft saving (avoids localStorage)
router.post('/:id/drafts', responseController_js_1.saveDraft);
router.get('/:id/drafts/:draftToken', responseController_js_1.getDraft);
exports.default = router;

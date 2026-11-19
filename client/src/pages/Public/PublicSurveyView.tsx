import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  CheckCircle2,
  AlertCircle,
  Send,
  Save,
  Clock,
  Sparkles,
  ClipboardList,
  RotateCcw,
  Copy,
  Check
} from 'lucide-react';
import { api } from '../../api/client';
import { ISurvey, IQuestion } from '../../types';
import { shouldShowQuestion } from '../../utils/conditionEvaluator';

export const PublicSurveyView: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const [survey, setSurvey] = useState<ISurvey | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [honeypot, setHoneypot] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [generalError, setGeneralError] = useState<string | null>(null);

  // Cloud Draft state (avoids localStorage)
  const [draftToken, setDraftToken] = useState<string | null>(null);
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);
  const [resumeTokenInput, setResumeTokenInput] = useState('');
  const [showResumeModal, setShowResumeModal] = useState(false);
  const [copiedDraftToken, setCopiedDraftToken] = useState(false);
  const [copiedDraftLink, setCopiedDraftLink] = useState(false);

  // Auto-restore draft if ?draft=<token> query parameter is present in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tokenFromUrl = params.get('draft');
    if (tokenFromUrl && id) {
      const loadDraftFromUrl = async () => {
        try {
          const res = await api.get(`/surveys/${id}/drafts/${tokenFromUrl.trim()}`);
          if (res.data.success) {
            setAnswers(res.data.data.answers || {});
            setDraftToken(res.data.data.draftToken);
            setDraftSavedAt(new Date(res.data.data.lastSavedAt).toLocaleTimeString());
          }
        } catch (err) {
          console.warn('Could not auto-load draft from URL:', err);
        }
      };
      loadDraftFromUrl();
    }
  }, [id]);

  // Fetch survey schema
  useEffect(() => {
    const fetchSurvey = async () => {
      try {
        const res = await api.get(`/surveys/${id}`);
        if (res.data.success) {
          setSurvey(res.data.data);
        }
      } catch (err: any) {
        setGeneralError(
          err.response?.data?.message ||
            'Unable to load survey. It may be closed, draft only, or deleted.'
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchSurvey();
  }, [id]);

  // Form Answer Handlers
  const handleAnswerChange = (questionId: string, value: any) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }));

    // Clear validation error on interaction
    if (errors[questionId]) {
      setErrors((prev) => {
        const updated = { ...prev };
        delete updated[questionId];
        return updated;
      });
    }
  };

  const handleCheckboxToggle = (questionId: string, option: string) => {
    const current: string[] = Array.isArray(answers[questionId]) ? answers[questionId] : [];
    const exists = current.includes(option);
    const updated = exists ? current.filter((x) => x !== option) : [...current, option];
    handleAnswerChange(questionId, updated);
  };

  // Client Validation
  const validateForm = (): boolean => {
    if (!survey) return false;
    const newErrors: Record<string, string> = {};

    survey.questions.forEach((q) => {
      const isVisible = shouldShowQuestion(q, answers);
      if (!isVisible) return; // Do not validate hidden questions

      const val = answers[q.id];
      const isEmpty =
        val === undefined ||
        val === null ||
        val === '' ||
        (Array.isArray(val) && val.length === 0);

      if (q.required && isEmpty) {
        newErrors[q.id] = 'This question is required.';
        return;
      }

      if (!isEmpty && q.type === 'rating') {
        const num = Number(val);
        const min = q.minRating ?? 1;
        const max = q.maxRating ?? 5;
        if (isNaN(num) || num < min || num > max) {
          newErrors[q.id] = `Please select a rating between ${min} and ${max}.`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError(null);

    if (!validateForm()) {
      // Scroll to first error
      const firstErrorElement = document.querySelector('[data-has-error="true"]');
      if (firstErrorElement) {
        firstErrorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post(`/surveys/${id}/responses`, {
        answers,
        honeypot,
        draftToken,
      });

      if (res.data.success) {
        setSubmitSuccess(true);
      }
    } catch (err: any) {
      setGeneralError(err.response?.data?.message || 'Failed to submit response.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Bonus: Cloud Draft Save (Backend stored, no localStorage)
  const handleSaveDraft = async () => {
    setIsSavingDraft(true);
    setGeneralError(null);
    try {
      const res = await api.post(`/surveys/${id}/drafts`, {
        draftToken,
        answers,
      });

      if (res.data.success) {
        setDraftToken(res.data.draftToken);
        setDraftSavedAt(new Date(res.data.lastSavedAt).toLocaleTimeString());
      }
    } catch (err: any) {
      setGeneralError(err.response?.data?.message || 'Failed to save draft to cloud.');
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Bonus: Resume Draft by Token
  const handleResumeDraft = async () => {
    if (!resumeTokenInput.trim()) return;
    try {
      const res = await api.get(`/surveys/${id}/drafts/${resumeTokenInput.trim()}`);
      if (res.data.success) {
        setAnswers(res.data.data.answers || {});
        setDraftToken(res.data.data.draftToken);
        setDraftSavedAt(new Date(res.data.data.lastSavedAt).toLocaleTimeString());
        setShowResumeModal(false);
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Draft not found or expired.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500 font-medium">Preparing survey...</p>
        </div>
      </div>
    );
  }

  if (generalError && !survey) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl border border-slate-200 shadow-md text-center space-y-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Survey Unavailable</h2>
          <p className="text-xs text-slate-500">{generalError}</p>
          <Link
            to="/login"
            className="inline-block mt-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
          >
            Admin Sign In
          </Link>
        </div>
      </div>
    );
  }

  // Submission Complete Screen
  if (submitSuccess) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white p-8 rounded-3xl border border-slate-200 shadow-xl text-center space-y-5 animate-in fade-in zoom-in-95 duration-300">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-md shadow-emerald-500/20">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">Thank You!</h2>
            <p className="text-sm text-slate-500 mt-1">
              Your response for <span className="font-semibold text-slate-700">"{survey?.title}"</span> has been successfully recorded.
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100">
            <button
              onClick={() => {
                setAnswers({});
                setSubmitSuccess(false);
                setDraftToken(null);
                setDraftSavedAt(null);
              }}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 underline"
            >
              Submit another response
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!survey) return null;

  // Calculate visible questions count for clean progress indicator
  const visibleQuestions = survey.questions.filter((q) => shouldShowQuestion(q, answers));
  const answeredCount = visibleQuestions.filter((q) => {
    const v = answers[q.id];
    return v !== undefined && v !== null && v !== '' && (!Array.isArray(v) || v.length > 0);
  }).length;
  const progressPercent =
    visibleQuestions.length > 0 ? Math.round((answeredCount / visibleQuestions.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/40 via-slate-50 to-slate-100 py-10 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Progress & Cloud Save Bar */}
        <div className="sticky top-4 z-40 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200/80 shadow-md flex items-center justify-between gap-4">
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-slate-600">
              <span>Survey Progress</span>
              <span>
                {answeredCount} of {visibleQuestions.length} answered ({progressPercent}%)
              </span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={isSavingDraft}
              title="Save partial responses to cloud"
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 flex items-center gap-1.5 transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5 text-blue-600" />
              <span>{isSavingDraft ? 'Saving...' : 'Save Draft'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowResumeModal(true)}
              title="Resume a previously saved draft"
              className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200 flex items-center gap-1.5 transition"
            >
              <RotateCcw className="w-3.5 h-3.5 text-purple-600" />
              <span>Resume</span>
            </button>
          </div>
        </div>

        {/* Draft Saved Feedback Alert */}
        {draftToken && (
          <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-blue-900">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Draft saved on cloud at {draftSavedAt}. Your resume code is:{' '}
                <strong className="font-mono bg-white px-2 py-0.5 rounded border border-blue-200 select-all">
                  {draftToken}
                </strong>
              </span>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(draftToken);
                  setCopiedDraftToken(true);
                  setTimeout(() => setCopiedDraftToken(false), 2000);
                }}
                className="px-2.5 py-1 bg-white hover:bg-blue-100 border border-blue-200 rounded-lg font-semibold flex items-center gap-1 text-[11px]"
              >
                {copiedDraftToken ? (
                  <Check className="w-3 h-3 text-emerald-600" />
                ) : (
                  <Copy className="w-3 h-3 text-blue-600" />
                )}
                <span>{copiedDraftToken ? 'Copied Code' : 'Copy Code'}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const directUrl = `${window.location.origin}/survey/${id}?draft=${draftToken}`;
                  navigator.clipboard.writeText(directUrl);
                  setCopiedDraftLink(true);
                  setTimeout(() => setCopiedDraftLink(false), 2000);
                }}
                className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold flex items-center gap-1 text-[11px]"
              >
                {copiedDraftLink ? (
                  <Check className="w-3 h-3 text-white" />
                ) : (
                  <Copy className="w-3 h-3 text-white" />
                )}
                <span>{copiedDraftLink ? 'Copied Link' : 'Copy Resume Link'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Survey Header Banner */}
        <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm space-y-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600" />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            {survey.title}
          </h1>
          {survey.description && (
            <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {survey.description}
            </p>
          )}
          <div className="pt-2 text-[11px] text-slate-400 font-medium">
            Fields marked with <span className="text-red-500 font-bold">*</span> are required.
          </div>
        </div>

        {/* Global Error Banner */}
        {generalError && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-sm text-red-700">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{generalError}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Honeypot field (hidden off-screen for anti-bot spam defense) */}
          <div
            style={{
              position: 'absolute',
              left: '-9999px',
              top: '-9999px',
              height: 0,
              width: 0,
              overflow: 'hidden',
            }}
          >
            <label htmlFor="anti_bot_hp">Leave this empty</label>
            <input
              id="anti_bot_hp"
              type="text"
              name="_hp_anti_bot"
              tabIndex={-1}
              autoComplete="off"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
            />
          </div>

          {/* Dynamic Questions List */}
          {survey.questions.map((q, idx) => {
            const isVisible = shouldShowQuestion(q, answers);
            if (!isVisible) return null;

            const error = errors[q.id];

            return (
              <div
                key={q.id}
                data-has-error={Boolean(error)}
                className={`bg-white rounded-3xl border transition-all duration-200 p-6 sm:p-7 space-y-4 shadow-sm ${
                  error
                    ? 'border-red-300 ring-2 ring-red-100'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                {/* Question Title & Description */}
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug flex items-start gap-2">
                    <span className="text-blue-600 font-semibold">{idx + 1}.</span>
                    <span>{q.title}</span>
                    {q.required && <span className="text-red-500 font-bold">*</span>}
                  </h3>
                  {q.description && (
                    <p className="text-xs text-slate-500 mt-1 pl-6">{q.description}</p>
                  )}
                </div>

                {/* Input Controls by Type */}
                <div className="pt-2">
                  {/* 1. Text Input */}
                  {q.type === 'text' && (
                    <textarea
                      rows={3}
                      value={answers[q.id] || ''}
                      onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                      placeholder="Type your response here..."
                      className="w-full text-sm px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
                    />
                  )}

                  {/* 2. Multiple Choice (Single Select) */}
                  {q.type === 'multiple_choice' && (
                    <div className="space-y-2.5">
                      {(q.options || []).map((opt, oIdx) => {
                        const isSelected = answers[q.id] === opt;
                        return (
                          <label
                            key={oIdx}
                            onClick={() => handleAnswerChange(q.id, opt)}
                            className={`flex items-center gap-3.5 p-4 rounded-2xl border cursor-pointer transition select-none ${
                              isSelected
                                ? 'bg-blue-50/70 border-blue-500 ring-1 ring-blue-500 text-blue-950 font-medium'
                                : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/70 text-slate-800'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`question_${q.id}`}
                              checked={isSelected}
                              onChange={() => handleAnswerChange(q.id, opt)}
                              className="w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                            />
                            <span className="text-sm">{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {/* 3. Checkbox (Multi-select) */}
                  {q.type === 'checkbox' && (
                    <div className="space-y-2.5">
                      {(q.options || []).map((opt, oIdx) => {
                        const currentArr = Array.isArray(answers[q.id]) ? answers[q.id] : [];
                        const isChecked = currentArr.includes(opt);

                        return (
                          <label
                            key={oIdx}
                            onClick={() => handleCheckboxToggle(q.id, opt)}
                            className={`flex items-center gap-3.5 p-4 rounded-2xl border cursor-pointer transition select-none ${
                              isChecked
                                ? 'bg-purple-50/70 border-purple-500 ring-1 ring-purple-500 text-purple-950 font-medium'
                                : 'bg-slate-50/60 border-slate-200 hover:bg-slate-100/70 text-slate-800'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handleCheckboxToggle(q.id, opt)}
                              className="w-4 h-4 text-purple-600 rounded border-slate-300 focus:ring-purple-500"
                            />
                            <span className="text-sm">{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  )}

                  {/* 4. Rating (1-5 Scale) */}
                  {q.type === 'rating' && (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3">
                        {[1, 2, 3, 4, 5].map((star) => {
                          const isSelected = answers[q.id] === star;
                          return (
                            <button
                              key={star}
                              type="button"
                              onClick={() => handleAnswerChange(q.id, star)}
                              className={`flex-1 sm:flex-none w-12 sm:w-16 h-12 sm:h-14 rounded-2xl flex flex-col items-center justify-center font-bold text-sm sm:text-base border transition ${
                                isSelected
                                  ? 'bg-amber-400 text-slate-950 border-amber-500 shadow-md scale-105'
                                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-amber-100 hover:border-amber-300'
                              }`}
                            >
                              <span>{star}</span>
                              <span className="text-[10px] opacity-75">★</span>
                            </button>
                          );
                        })}
                      </div>

                      <div className="flex justify-between text-xs text-slate-500 px-1 font-medium">
                        <span>{q.minRatingLabel || '1 - Poor'}</span>
                        <span>{q.maxRatingLabel || '5 - Excellent'}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Question Validation Error Notice */}
                {error && (
                  <div className="flex items-center gap-2 text-xs font-semibold text-red-600 pt-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}
              </div>
            );
          })}

          {/* Submission Bar */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="text-xs text-slate-500">
              Please double-check your answers before submitting.
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-500/25 hover:shadow-blue-500/35 transition disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Submitting Response...</span>
              ) : (
                <>
                  <span>Submit Response</span>
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Resume Draft Modal */}
      {showResumeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white max-w-md w-full rounded-3xl p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <RotateCcw className="w-5 h-5 text-purple-600" />
              <span>Resume Saved Draft</span>
            </h3>
            <p className="text-xs text-slate-500">
              Enter the unique resume code you received when you clicked "Save Draft".
            </p>

            <div>
              <input
                type="text"
                placeholder="Paste your resume code here..."
                value={resumeTokenInput}
                onChange={(e) => setResumeTokenInput(e.target.value)}
                className="w-full text-xs font-mono p-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowResumeModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResumeDraft}
                className="px-5 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-xl shadow-md"
              >
                Restore Progress
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

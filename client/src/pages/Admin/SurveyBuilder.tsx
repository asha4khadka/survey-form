import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  Copy,
  Eye,
  Settings2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Split,
  Star,
  CheckSquare,
  List,
  Type
} from 'lucide-react';
import { api } from '../../api/client';
import { IQuestion, QuestionType, ConditionOperator, IConditionRule } from '../../types';
import { shouldShowQuestion } from '../../utils/conditionEvaluator';

export const SurveyBuilder: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('published');
  const [questions, setQuestions] = useState<IQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSaving, setIsSaving] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Preview Modal state
  const [showPreview, setShowPreview] = useState(false);
  const [previewAnswers, setPreviewAnswers] = useState<Record<string, any>>({});

  useEffect(() => {
    if (isEditing && id) {
      const fetchSurvey = async () => {
        try {
          const res = await api.get(`/surveys/${id}`);
          if (res.data.success) {
            const data = res.data.data;
            setTitle(data.title);
            setDescription(data.description || '');
            setStatus(data.status === 'archived' ? 'published' : data.status);
            setQuestions(data.questions || []);
          }
        } catch (err: any) {
          setNotification({
            type: 'error',
            message: err.response?.data?.message || 'Failed to load survey.',
          });
        } finally {
          setIsLoading(false);
        }
      };
      fetchSurvey();
    }
  }, [id, isEditing]);

  // Question manipulation helpers
  const addQuestion = (type: QuestionType) => {
    const newQ: IQuestion = {
      id: `q_${Date.now()}`,
      type,
      title: type === 'rating' ? 'How would you rate your overall experience?' : 'Untitled Question',
      description: '',
      required: false,
      options: type === 'multiple_choice' || type === 'checkbox' ? ['Option 1', 'Option 2'] : [],
      minRating: 1,
      maxRating: 5,
      minRatingLabel: 'Poor',
      maxRatingLabel: 'Excellent',
      conditions: [],
    };
    setQuestions([...questions, newQ]);
  };

  const updateQuestion = (index: number, updates: Partial<IQuestion>) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], ...updates };
    setQuestions(updated);
  };

  const removeQuestion = (index: number) => {
    const qToRemove = questions[index];
    // Remove references to this question in other conditions
    const updated = questions
      .filter((_, i) => i !== index)
      .map((q) => ({
        ...q,
        conditions: (q.conditions || []).filter((c) => c.dependsOnQuestionId !== qToRemove.id),
      }));
    setQuestions(updated);
  };

  const duplicateQuestion = (index: number) => {
    const original = questions[index];
    const duplicated: IQuestion = {
      ...original,
      id: `q_${Date.now()}`,
      title: `${original.title} (Copy)`,
      conditions: [...(original.conditions || [])],
    };
    const updated = [...questions];
    updated.splice(index + 1, 0, duplicated);
    setQuestions(updated);
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === questions.length - 1)
    ) {
      return;
    }
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const updated = [...questions];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setQuestions(updated);
  };

  // Option management for Choice / Checkbox
  const addOption = (qIndex: number) => {
    const q = questions[qIndex];
    const options = q.options ? [...q.options] : [];
    options.push(`Option ${options.length + 1}`);
    updateQuestion(qIndex, { options });
  };

  const updateOption = (qIndex: number, optIndex: number, val: string) => {
    const q = questions[qIndex];
    const options = [...(q.options || [])];
    options[optIndex] = val;
    updateQuestion(qIndex, { options });
  };

  const removeOption = (qIndex: number, optIndex: number) => {
    const q = questions[qIndex];
    const options = (q.options || []).filter((_, i) => i !== optIndex);
    updateQuestion(qIndex, { options });
  };

  // Condition Management
  const addCondition = (qIndex: number) => {
    // Only preceding questions can be used as dependencies
    const priorQuestions = questions.slice(0, qIndex);
    if (priorQuestions.length === 0) return;

    const firstPrior = priorQuestions[0];
    const defaultVal =
      firstPrior.options && firstPrior.options.length > 0 ? firstPrior.options[0] : 'Yes';

    const newRule: IConditionRule = {
      dependsOnQuestionId: firstPrior.id,
      operator: 'equals',
      value: defaultVal,
    };

    const currentConditions = questions[qIndex].conditions || [];
    updateQuestion(qIndex, { conditions: [...currentConditions, newRule] });
  };

  const updateCondition = (
    qIndex: number,
    condIndex: number,
    field: keyof IConditionRule,
    value: any
  ) => {
    const q = questions[qIndex];
    const conditions = [...(q.conditions || [])];
    conditions[condIndex] = { ...conditions[condIndex], [field]: value };
    updateQuestion(qIndex, { conditions });
  };

  const removeCondition = (qIndex: number, condIndex: number) => {
    const q = questions[qIndex];
    const conditions = (q.conditions || []).filter((_, i) => i !== condIndex);
    updateQuestion(qIndex, { conditions });
  };

  // Save handler
  const handleSave = async () => {
    if (!title.trim()) {
      setNotification({ type: 'error', message: 'Survey title is required.' });
      return;
    }

    if (questions.length === 0) {
      setNotification({ type: 'error', message: 'Please add at least one question.' });
      return;
    }

    setIsSaving(true);
    setNotification(null);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      status,
      questions,
    };

    try {
      if (isEditing) {
        const res = await api.put(`/surveys/${id}`, payload);
        if (res.data.success) {
          setNotification({ type: 'success', message: 'Survey updated successfully!' });
        }
      } else {
        const res = await api.post('/surveys', payload);
        if (res.data.success) {
          setNotification({ type: 'success', message: 'Survey created successfully!' });
          setTimeout(() => navigate('/admin'), 1200);
        }
      }
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.response?.data?.message || 'Failed to save survey.',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500">Loading survey...</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Navigation & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm sticky top-20 z-40">
        <div className="flex items-center gap-3">
          <Link
            to="/admin"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">
              {isEditing ? 'Edit Survey' : 'Build New Survey'}
            </h1>
            <p className="text-xs text-slate-500">
              {questions.length} question{questions.length !== 1 ? 's' : ''} configured
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="text-xs font-semibold py-2 px-3 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 focus:outline-none"
          >
            <option value="published">Status: Published (Active)</option>
            <option value="draft">Status: Draft</option>
          </select>

          <button
            type="button"
            onClick={() => {
              setPreviewAnswers({});
              setShowPreview(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 transition"
          >
            <Eye className="w-4 h-4 text-slate-500" />
            <span>Interactive Preview</span>
          </button>

          <button
            type="button"
            disabled={isSaving}
            onClick={handleSave}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-500/20 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Survey'}</span>
          </button>
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-sm ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          ) : (
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Survey Title & Description Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Survey Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Customer Satisfaction & Feature Feedback"
            className="w-full text-xl font-bold px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
            Description / Instructions
          </label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add a friendly introduction explaining the purpose of this survey..."
            className="w-full text-sm px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 transition"
          />
        </div>
      </div>

      {/* Question List */}
      <div className="space-y-4">
        {questions.map((question, qIndex) => {
          const priorQuestions = questions.slice(0, qIndex);
          const hasPriorQuestions = priorQuestions.length > 0;
          const hasConditions = (question.conditions || []).length > 0;

          return (
            <div
              key={question.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 transition-all hover:border-slate-300"
            >
              {/* Question Header & Order Controls */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 gap-2">
                <div className="flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold flex items-center justify-center">
                    {qIndex + 1}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    {question.type === 'multiple_choice'
                      ? 'Multiple Choice (Single Select)'
                      : question.type === 'checkbox'
                      ? 'Checkbox (Multi-Select)'
                      : question.type === 'rating'
                      ? 'Rating (1-5 Scale)'
                      : 'Text Input'}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => moveQuestion(qIndex, 'up')}
                    disabled={qIndex === 0}
                    title="Move Question Up"
                    className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded-lg hover:bg-slate-100"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => moveQuestion(qIndex, 'down')}
                    disabled={qIndex === questions.length - 1}
                    title="Move Question Down"
                    className="p-1.5 text-slate-400 hover:text-slate-700 disabled:opacity-30 rounded-lg hover:bg-slate-100"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  <div className="h-4 w-px bg-slate-200 mx-1" />

                  <button
                    type="button"
                    onClick={() => duplicateQuestion(qIndex)}
                    title="Duplicate Question"
                    className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-indigo-50"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => removeQuestion(qIndex)}
                    title="Delete Question"
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Title & Help Text Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Question Title *</label>
                  <input
                    type="text"
                    value={question.title}
                    onChange={(e) => updateQuestion(qIndex, { title: e.target.value })}
                    placeholder="Enter question text..."
                    className="w-full text-sm font-medium px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700">Question Type</label>
                  <select
                    value={question.type}
                    onChange={(e) => {
                      const newType = e.target.value as QuestionType;
                      updateQuestion(qIndex, {
                        type: newType,
                        options:
                          newType === 'multiple_choice' || newType === 'checkbox'
                            ? question.options && question.options.length > 0
                              ? question.options
                              : ['Option 1', 'Option 2']
                            : [],
                      });
                    }}
                    className="w-full text-sm font-medium px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  >
                    <option value="text">Text Input</option>
                    <option value="multiple_choice">Multiple Choice (Single)</option>
                    <option value="checkbox">Checkbox (Multiple)</option>
                    <option value="rating">Rating Scale (1-5)</option>
                  </select>
                </div>
              </div>

              <div>
                <input
                  type="text"
                  value={question.description || ''}
                  onChange={(e) => updateQuestion(qIndex, { description: e.target.value })}
                  placeholder="Optional helper text or subtitle..."
                  className="w-full text-xs px-3.5 py-1.5 bg-slate-50/70 border border-slate-200 rounded-lg text-slate-600 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              {/* Type-Specific Options Configuration */}
              {(question.type === 'multiple_choice' || question.type === 'checkbox') && (
                <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-2.5">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Answer Choices
                    </span>
                    <button
                      type="button"
                      onClick={() => addOption(qIndex)}
                      className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Option</span>
                    </button>
                  </div>

                  {(question.options || []).map((opt, optIdx) => (
                    <div key={optIdx} className="flex items-center gap-2">
                      <span className="text-slate-400 text-xs font-mono w-4 text-center">
                        {optIdx + 1}.
                      </span>
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => updateOption(qIndex, optIdx, e.target.value)}
                        placeholder={`Option ${optIdx + 1}`}
                        className="flex-1 text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      {(question.options || []).length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeOption(qIndex, optIdx)}
                          className="p-1 text-slate-400 hover:text-red-500 rounded"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Rating Scale Configuration */}
              {question.type === 'rating' && (
                <div className="bg-slate-50/70 p-4 rounded-xl border border-slate-200/80 space-y-3">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                    Rating Scale (1 to 5)
                  </span>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[11px] text-slate-500 block mb-1">Lowest Score Label (1)</label>
                      <input
                        type="text"
                        value={question.minRatingLabel || ''}
                        onChange={(e) => updateQuestion(qIndex, { minRatingLabel: e.target.value })}
                        placeholder="e.g., Poor, Not Likely"
                        className="w-full text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-500 block mb-1">Highest Score Label (5)</label>
                      <input
                        type="text"
                        value={question.maxRatingLabel || ''}
                        onChange={(e) => updateQuestion(qIndex, { maxRatingLabel: e.target.value })}
                        placeholder="e.g., Excellent, Very Likely"
                        className="w-full text-xs px-3 py-1.5 bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Question Settings Bar (Required toggle & Condition Engine) */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-4 border-t border-slate-100">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={question.required}
                    onChange={(e) => updateQuestion(qIndex, { required: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
                  />
                  <span className="text-xs font-medium text-slate-700">Mark as Required</span>
                </label>

                {/* Conditional Branching Trigger */}
                <div className="flex items-center gap-2">
                  {hasPriorQuestions ? (
                    <button
                      type="button"
                      onClick={() => addCondition(qIndex)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg border flex items-center gap-1.5 transition ${
                        hasConditions
                          ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Split className="w-3.5 h-3.5" />
                      <span>
                        {hasConditions
                          ? `${question.conditions?.length} Condition Rule${
                              (question.conditions?.length || 0) > 1 ? 's' : ''
                            }`
                          : '+ Add Conditional Logic'}
                      </span>
                    </button>
                  ) : (
                    <span className="text-[11px] text-slate-400 italic">
                      (First question cannot depend on others)
                    </span>
                  )}
                </div>
              </div>

              {/* Conditional Logic Rules Editor */}
              {hasConditions && (
                <div className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-3 mt-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Split className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Show this question only when:</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => addCondition(qIndex)}
                      className="text-xs font-semibold text-indigo-700 hover:text-indigo-800 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add AND Rule</span>
                    </button>
                  </div>

                  {(question.conditions || []).map((rule, condIdx) => {
                    const targetQ = questions.find((q) => q.id === rule.dependsOnQuestionId);

                    return (
                      <div
                        key={condIdx}
                        className="bg-white p-3 rounded-lg border border-indigo-200 shadow-xs flex flex-wrap items-center gap-2"
                      >
                        <span className="text-xs font-medium text-slate-500">If Question:</span>

                        {/* Select Preceding Question */}
                        <select
                          value={rule.dependsOnQuestionId}
                          onChange={(e) => {
                            const newQId = e.target.value;
                            const newTargetQ = questions.find((q) => q.id === newQId);
                            const defaultVal =
                              newTargetQ?.options && newTargetQ.options.length > 0
                                ? newTargetQ.options[0]
                                : 'Yes';
                            updateCondition(qIndex, condIdx, 'dependsOnQuestionId', newQId);
                            updateCondition(qIndex, condIdx, 'value', defaultVal);
                          }}
                          className="text-xs font-medium py-1.5 px-2.5 rounded-md bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none"
                        >
                          {priorQuestions.map((pq, pIdx) => (
                            <option key={pq.id} value={pq.id}>
                              #{pIdx + 1}: {pq.title.slice(0, 32)}
                              {pq.title.length > 32 ? '...' : ''}
                            </option>
                          ))}
                        </select>

                        {/* Select Operator */}
                        <select
                          value={rule.operator}
                          onChange={(e) =>
                            updateCondition(
                              qIndex,
                              condIdx,
                              'operator',
                              e.target.value as ConditionOperator
                            )
                          }
                          className="text-xs font-medium py-1.5 px-2.5 rounded-md bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none"
                        >
                          <option value="equals">Equals ( = )</option>
                          <option value="not_equals">Does Not Equal ( ≠ )</option>
                          <option value="contains">Contains</option>
                          <option value="greater_than">Greater than ( &gt; )</option>
                          <option value="less_than">Less than ( &lt; )</option>
                        </select>

                        {/* Target Value Input or Options Dropdown */}
                        {targetQ &&
                        targetQ.options &&
                        targetQ.options.length > 0 &&
                        (rule.operator === 'equals' ||
                          rule.operator === 'not_equals' ||
                          rule.operator === 'contains') ? (
                          <select
                            value={rule.value}
                            onChange={(e) =>
                              updateCondition(qIndex, condIdx, 'value', e.target.value)
                            }
                            className="text-xs font-medium py-1.5 px-2.5 rounded-md bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none"
                          >
                            {targetQ.options.map((opt, oIdx) => (
                              <option key={oIdx} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type="text"
                            value={rule.value}
                            onChange={(e) =>
                              updateCondition(qIndex, condIdx, 'value', e.target.value)
                            }
                            placeholder="Target value..."
                            className="text-xs font-medium py-1.5 px-2.5 rounded-md bg-slate-50 border border-slate-200 text-slate-800 focus:outline-none"
                          />
                        )}

                        <button
                          type="button"
                          onClick={() => removeCondition(qIndex, condIdx)}
                          className="p-1 text-slate-400 hover:text-red-600 rounded ml-auto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Question Button Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm text-center space-y-4">
        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Add New Question Type
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => addQuestion('text')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition"
          >
            <Type className="w-4 h-4 text-blue-600" />
            <span>Text Input</span>
          </button>

          <button
            type="button"
            onClick={() => addQuestion('multiple_choice')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition"
          >
            <List className="w-4 h-4 text-emerald-600" />
            <span>Multiple Choice</span>
          </button>

          <button
            type="button"
            onClick={() => addQuestion('checkbox')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition"
          >
            <CheckSquare className="w-4 h-4 text-purple-600" />
            <span>Checkbox</span>
          </button>

          <button
            type="button"
            onClick={() => addQuestion('rating')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 transition"
          >
            <Star className="w-4 h-4 text-amber-500" />
            <span>Rating (1-5)</span>
          </button>
        </div>
      </div>

      {/* Interactive Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  Interactive Test Preview
                </span>
                <h3 className="font-bold text-slate-900 text-lg mt-1">{title || 'Untitled Survey'}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1.5"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {description && <p className="text-sm text-slate-600">{description}</p>}

              {questions.map((q, idx) => {
                const isVisible = shouldShowQuestion(q, previewAnswers);

                if (!isVisible) {
                  return (
                    <div
                      key={q.id}
                      className="p-3 rounded-xl bg-slate-100/60 border border-dashed border-slate-200 text-xs text-slate-400 italic flex items-center gap-2"
                    >
                      <Split className="w-3.5 h-3.5" />
                      <span>Question #{idx + 1} is hidden by conditional logic.</span>
                    </div>
                  );
                }

                return (
                  <div
                    key={q.id}
                    className="p-5 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3"
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-semibold text-sm text-slate-900">
                        {idx + 1}. {q.title}
                        {q.required && <span className="text-red-500 ml-1">*</span>}
                      </span>
                    </div>

                    {q.description && (
                      <p className="text-xs text-slate-500">{q.description}</p>
                    )}

                    {/* Preview inputs */}
                    {q.type === 'text' && (
                      <input
                        type="text"
                        placeholder="Type answer here..."
                        value={previewAnswers[q.id] || ''}
                        onChange={(e) =>
                          setPreviewAnswers({ ...previewAnswers, [q.id]: e.target.value })
                        }
                        className="w-full text-xs p-2.5 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white"
                      />
                    )}

                    {q.type === 'multiple_choice' && (
                      <div className="space-y-1.5">
                        {(q.options || []).map((opt, oIdx) => (
                          <label
                            key={oIdx}
                            className="flex items-center gap-2 p-2 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer text-xs"
                          >
                            <input
                              type="radio"
                              name={`preview_${q.id}`}
                              checked={previewAnswers[q.id] === opt}
                              onChange={() =>
                                setPreviewAnswers({ ...previewAnswers, [q.id]: opt })
                              }
                              className="text-blue-600"
                            />
                            <span>{opt}</span>
                          </label>
                        ))}
                      </div>
                    )}

                    {q.type === 'checkbox' && (
                      <div className="space-y-1.5">
                        {(q.options || []).map((opt, oIdx) => {
                          const current: string[] = previewAnswers[q.id] || [];
                          const checked = current.includes(opt);

                          return (
                            <label
                              key={oIdx}
                              className="flex items-center gap-2 p-2 rounded-lg border border-slate-100 hover:bg-slate-50 cursor-pointer text-xs"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => {
                                  const updated = e.target.checked
                                    ? [...current, opt]
                                    : current.filter((x) => x !== opt);
                                  setPreviewAnswers({ ...previewAnswers, [q.id]: updated });
                                }}
                                className="text-blue-600 rounded"
                              />
                              <span>{opt}</span>
                            </label>
                          );
                        })}
                      </div>
                    )}

                    {q.type === 'rating' && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() =>
                                setPreviewAnswers({ ...previewAnswers, [q.id]: star })
                              }
                              className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition ${
                                previewAnswers[q.id] === star
                                  ? 'bg-amber-400 text-slate-900 shadow-md'
                                  : 'bg-slate-100 text-slate-600 hover:bg-amber-100'
                              }`}
                            >
                              {star} ★
                            </button>
                          ))}
                        </div>
                        <div className="flex justify-between text-[11px] text-slate-400 px-1">
                          <span>{q.minRatingLabel || '1'}</span>
                          <span>{q.maxRatingLabel || '5'}</span>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold"
              >
                Done Previewing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Download,
  Calendar,
  Users,
  CheckCircle,
  Clock,
  Star,
  Search,
  FileSpreadsheet,
  FileCode,
  Layers,
  AlertCircle
} from 'lucide-react';
import { api } from '../../api/client';
import { IAnalyticsData, IQuestionAnalytics } from '../../types';

export const SurveyAnalytics: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<IAnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [textSearch, setTextSearch] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get(`/surveys/${id}/analytics`);
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to load analytics.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, [id]);

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      const response = await api.get(`/surveys/${id}/export?format=${format}`, {
        responseType: 'blob',
      });

      const blob = new Blob([response.data], {
        type: format === 'csv' ? 'text/csv' : 'application/json',
      });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `${data?.survey.title.replace(/[^a-zA-Z0-9]/g, '_')}_export.${format}`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert('Failed to download export.');
    }
  };

  if (isLoading) {
    return (
      <div className="py-24 text-center">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-slate-500">Calculating survey responses & metrics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <div className="p-6 bg-red-50 border border-red-200 rounded-2xl text-red-700 max-w-md mx-auto">
          <AlertCircle className="w-8 h-8 mx-auto mb-2 text-red-500" />
          <h3 className="font-bold">Unable to load analytics</h3>
          <p className="text-sm mt-1">{error || 'Survey not found.'}</p>
          <Link
            to="/admin"
            className="mt-4 inline-block px-4 py-2 bg-red-600 text-white rounded-xl text-xs font-semibold"
          >
            Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const { survey, overview, questions } = data;

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin"
            className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Analytics & Insights
              </span>
              <span className="text-xs text-slate-400">v{survey.version}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-1 truncate">{survey.title}</h1>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2">
          <button
            onClick={() => handleExport('csv')}
            disabled={overview.totalResponses === 0}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 shadow-xs transition disabled:opacity-40"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => handleExport('json')}
            disabled={overview.totalResponses === 0}
            className="inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-xl bg-white border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 text-slate-700 hover:text-indigo-700 shadow-xs transition disabled:opacity-40"
          >
            <FileCode className="w-4 h-4 text-indigo-600" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Aggregate Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-5">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Responses
            </p>
            <h3 className="text-3xl font-extrabold text-slate-900">{overview.totalResponses}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center shrink-0">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Survey Questions
            </p>
            <h3 className="text-3xl font-extrabold text-slate-900">{overview.totalQuestions}</h3>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Last Response
            </p>
            <h3 className="text-sm font-bold text-slate-900 mt-1">
              {overview.lastResponseAt
                ? new Date(overview.lastResponseAt).toLocaleString()
                : 'No responses yet'}
            </h3>
          </div>
        </div>
      </div>

      {/* Per-Question Breakdown */}
      <div className="space-y-6">
        <h2 className="text-lg font-bold text-slate-900">Per-Question Breakdown</h2>

        {questions.map((q, idx) => {
          return (
            <div
              key={q.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 sm:p-6 space-y-4 sm:space-y-5"
            >
              {/* Question header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-start gap-2.5">
                  <span className="w-6 h-6 rounded-lg bg-blue-50 text-blue-700 text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{q.title}</h3>
                    <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                      <span className="capitalize">{q.type.replace('_', ' ')}</span>
                      <span>•</span>
                      <span>{q.totalAnswered} answered</span>
                      <span>•</span>
                      <span>{q.responseRate}% response rate</span>
                    </div>
                  </div>
                </div>

                {q.type === 'rating' && (
                  <div className="bg-amber-50 px-3.5 py-1.5 rounded-xl border border-amber-200 text-amber-900 flex items-center gap-2 self-start">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-500" />
                    <span className="text-xs font-semibold">Average:</span>
                    <span className="text-lg font-extrabold">{q.averageRating} / 5</span>
                  </div>
                )}
              </div>

              {/* Multiple Choice & Checkbox Visualization */}
              {(q.type === 'multiple_choice' || q.type === 'checkbox') && (
                <div className="space-y-3">
                  {q.breakdown && q.breakdown.length > 0 ? (
                    q.breakdown.map((item, bIdx) => (
                      <div key={bIdx} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                          <span>{item.option}</span>
                          <span className="font-semibold text-slate-900">
                            {item.count} votes ({item.percentage}%)
                          </span>
                        </div>
                        {/* Visual progress bar */}
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600 rounded-full transition-all duration-500"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-400 italic">No choices registered.</p>
                  )}
                </div>
              )}

              {/* Rating Scale Visualization */}
              {q.type === 'rating' && (
                <div className="space-y-3">
                  {q.breakdown &&
                    q.breakdown.map((item) => (
                      <div key={item.rating} className="space-y-1">
                        <div className="flex items-center justify-between text-xs font-medium text-slate-700">
                          <span className="flex items-center gap-1 font-semibold">
                            {item.rating} ★
                            <span className="text-slate-400 font-normal">
                              {item.rating === 1
                                ? `(${q.minRatingLabel || 'Min'})`
                                : item.rating === 5
                                ? `(${q.maxRatingLabel || 'Max'})`
                                : ''}
                            </span>
                          </span>
                          <span className="font-semibold text-slate-900">
                            {item.count} ratings ({item.percentage}%)
                          </span>
                        </div>
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-amber-400 rounded-full transition-all duration-500"
                            style={{ width: `${item.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              )}

              {/* Text Input Responses List View */}
              {q.type === 'text' && (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Filter text responses..."
                      value={textSearch[q.id] || ''}
                      onChange={(e) =>
                        setTextSearch({ ...textSearch, [q.id]: e.target.value })
                      }
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  {(() => {
                    const searchTerm = (textSearch[q.id] || '').toLowerCase();
                    const filtered = (q.responses || []).filter((r) =>
                      r.text.toLowerCase().includes(searchTerm)
                    );

                    if (filtered.length === 0) {
                      return (
                        <p className="text-xs text-slate-400 italic py-3 text-center">
                          {searchTerm ? 'No matching text responses found.' : 'No responses yet.'}
                        </p>
                      );
                    }

                    return (
                      <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                        {filtered.map((item, rIdx) => (
                          <div
                            key={rIdx}
                            className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                          >
                            <p className="text-xs text-slate-800 leading-relaxed font-normal">
                              "{item.text}"
                            </p>
                            <span className="text-[10px] text-slate-400 shrink-0">
                              {new Date(item.submittedAt).toLocaleDateString()}{' '}
                              {new Date(item.submittedAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

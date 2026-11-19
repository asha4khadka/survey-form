import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  PlusCircle,
  BarChart2,
  Edit3,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  ClipboardList,
  MessageSquare,
  Clock,
  Layers,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { api } from '../../api/client';
import { ISurvey } from '../../types';

export const Dashboard: React.FC = () => {
  const [surveys, setSurveys] = useState<ISurvey[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchSurveys = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const url = filter === 'all' ? '/surveys' : `/surveys?status=${filter}`;
      const res = await api.get(url);
      if (res.data.success) {
        setSurveys(res.data.data);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to load surveys.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSurveys();
  }, [filter]);

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this survey and all its responses?')) {
      return;
    }

    setDeletingId(id);
    try {
      const res = await api.delete(`/surveys/${id}`);
      if (res.data.success) {
        setSurveys((prev) => prev.filter((s) => s._id !== id));
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete survey.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      const res = await api.patch(`/surveys/${id}/status`, { status: newStatus });
      if (res.data.success) {
        setSurveys((prev) =>
          prev.map((s) => (s._id === id ? { ...s, status: newStatus as any } : s))
        );
      }
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update status.');
    }
  };

  const copyShareLink = (id: string) => {
    const url = `${window.location.origin}/survey/${id}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const totalSurveys = surveys.length;
  const totalResponses = surveys.reduce((acc, curr) => acc + (curr.responseCount || 0), 0);
  const publishedCount = surveys.filter((s) => s.status === 'published').length;

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
            <span>Survey Management</span>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
              Admin
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Build surveys with conditional branching, publish public forms, and monitor real-time analytics.
          </p>
        </div>

        <Link
          to="/admin/surveys/new"
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-md shadow-blue-500/20 hover:shadow-blue-500/30 transition w-full sm:w-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Create New Survey</span>
        </Link>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <ClipboardList className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Surveys</p>
            <h3 className="text-2xl font-bold text-slate-900">{totalSurveys}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Active Published</p>
            <h3 className="text-2xl font-bold text-slate-900">{publishedCount}</h3>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Responses</p>
            <h3 className="text-2xl font-bold text-slate-900">{totalResponses}</h3>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-3 overflow-x-auto">
        <div className="flex items-center gap-2 min-w-max">
          {(['all', 'published', 'draft', 'archived'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg capitalize transition ${
                filter === tab
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Survey List Table / Cards */}
      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {isLoading ? (
        <div className="py-16 text-center">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-slate-500">Loading your surveys...</p>
        </div>
      ) : surveys.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-lg mx-auto shadow-sm">
          <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Layers className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-slate-900">No surveys found</h3>
          <p className="text-sm text-slate-500 mt-1 mb-6">
            Get started by creating your first survey with custom question types and conditional logic.
          </p>
          <Link
            to="/admin/surveys/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create Survey</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {surveys.map((survey) => (
            <div
              key={survey._id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group"
            >
              <div className="p-5 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                      survey.status === 'published'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : survey.status === 'draft'
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {survey.status}
                  </span>

                  <span className="text-[11px] font-medium text-slate-400">
                    v{survey.version || 1}
                  </span>
                </div>

                <div>
                  <h3 className="font-bold text-slate-900 text-base group-hover:text-blue-600 transition-colors line-clamp-1">
                    {survey.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2 min-h-[32px]">
                    {survey.description || 'No description provided.'}
                  </p>
                </div>

                {/* Question and response stats */}
                <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-100">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-slate-400" />
                    <span>{survey.questionCount || survey.questions?.length || 0} questions</span>
                  </span>
                  <span className="flex items-center gap-1 font-semibold text-slate-700">
                    <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
                    <span>{survey.responseCount || 0} responses</span>
                  </span>
                </div>
              </div>

              {/* Action Bar */}
              <div className="px-4 sm:px-5 py-3 bg-slate-50/80 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1 sm:gap-1.5">
                  <Link
                    to={`/admin/surveys/${survey._id}/analytics`}
                    title="View Analytics"
                    className="p-2 text-slate-600 hover:text-blue-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition"
                  >
                    <BarChart2 className="w-4 h-4" />
                  </Link>

                  <Link
                    to={`/admin/surveys/${survey._id}/edit`}
                    title="Edit Survey"
                    className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition"
                  >
                    <Edit3 className="w-4 h-4" />
                  </Link>

                  <button
                    onClick={() => copyShareLink(survey._id)}
                    title="Copy Public Link"
                    className="p-2 text-slate-600 hover:text-emerald-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition"
                  >
                    {copiedId === survey._id ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>

                  <a
                    href={`/survey/${survey._id}`}
                    target="_blank"
                    rel="noreferrer"
                    title="Open Live Survey"
                    className="p-2 text-slate-600 hover:text-blue-600 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 transition"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>

                <div className="flex items-center gap-2 ml-auto sm:ml-0">
                  <select
                    value={survey.status}
                    onChange={(e) => handleStatusChange(survey._id, e.target.value)}
                    className="text-xs font-medium py-1 px-2 rounded-lg bg-white border border-slate-200 text-slate-700 hover:border-slate-300 focus:outline-none"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="archived">Archived</option>
                  </select>

                  <button
                    onClick={() => handleDelete(survey._id)}
                    disabled={deletingId === survey._id}
                    title="Delete Survey"
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

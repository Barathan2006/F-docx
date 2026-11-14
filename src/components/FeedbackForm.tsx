import React, { useState } from 'react';
import { FeedbackSubmission, WebAppConfig } from '../types';
import { Sparkles, Send, CheckCircle2, Star, RefreshCw, MessageSquareHeart } from 'lucide-react';
import { playSuccessChime } from '../utils/audio';

interface Props {
  onAddFeedback: (sub: FeedbackSubmission) => void;
  webAppConfig: WebAppConfig;
}

export const FeedbackForm: React.FC<Props> = ({ onAddFeedback, webAppConfig }) => {
  const [formData, setFormData] = useState<{
    customerName: string;
    email: string;
    category: 'Feature Request' | 'Bug Report' | 'UI / UX Design' | 'Performance' | 'General Feedback';
    rating: number;
    npsScore: number;
    feedbackMessage: string;
    wouldRecommend: 'Yes' | 'Maybe' | 'No';
    priority: 'Low' | 'Medium' | 'High';
  }>({
    customerName: 'Samira Patel',
    email: 'samira.patel@fdx-project.io',
    category: 'UI / UX Design',
    rating: 5,
    npsScore: 10,
    feedbackMessage: 'The f-docx Google Apps Script connection is super fast! Submissions sync directly from HTML form to Google Sheets without needing a backend server.',
    wouldRecommend: 'Yes',
    priority: 'High',
  });

  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [submittedStatus, setSubmittedStatus] = useState<string | null>(null);

  const fillSampleData = () => {
    const samples = [
      {
        customerName: 'Samira Patel',
        email: 'samira.patel@fdx-project.io',
        category: 'UI / UX Design' as const,
        rating: 5,
        npsScore: 10,
        feedbackMessage: 'The Google Apps Script integration works flawlessly on Netlify without any backend code!',
        wouldRecommend: 'Yes' as const,
        priority: 'High' as const,
      },
      {
        customerName: 'Clara Oswald',
        email: 'clara.o@timelabs.org',
        category: 'Feature Request' as const,
        rating: 4,
        npsScore: 9,
        feedbackMessage: 'Can we add an automated webhook notification to Telegram/Slack when a new row is appended?',
        wouldRecommend: 'Yes' as const,
        priority: 'Medium' as const,
      },
      {
        customerName: 'Marcus Bennett',
        email: 'm.bennett@apexsystems.com',
        category: 'Performance' as const,
        rating: 5,
        npsScore: 10,
        feedbackMessage: 'Tested with 50 submissions. Google Sheet updated in under 800ms. Outstanding simplicity.',
        wouldRecommend: 'Yes' as const,
        priority: 'High' as const,
      },
    ];
    const picked = samples[Math.floor(Math.random() * samples.length)];
    setFormData(picked);
  };

  const executeAndSubmit = async () => {
    if (!formData.email.trim() || !formData.feedbackMessage.trim()) return;

    setLoading(true);
    setSubmittedStatus(null);

    const submission: FeedbackSubmission = {
      id: `fb-${Date.now()}`,
      ...formData,
      submittedAt: new Date().toLocaleString(),
    };

    let realSheetSynced = false;
    let syncError: string | null = null;

    if (webAppConfig.syncToRealSheet && webAppConfig.scriptUrl?.trim()) {
      try {
        await fetch(webAppConfig.scriptUrl.trim(), {
          method: 'POST',
          mode: 'no-cors',
          headers: {
            'Content-Type': 'text/plain;charset=utf-8',
          },
          body: JSON.stringify({
            formType: 'feedback',
            ...formData,
            submittedAt: submission.submittedAt,
          }),
        });
        realSheetSynced = true;
      } catch (err: any) {
        console.error('Real Google Sheet sync error:', err);
        syncError = err.message || 'Network error';
      }
    }

    onAddFeedback(submission);
    playSuccessChime();

    setLoading(false);
    if (webAppConfig.syncToRealSheet && webAppConfig.scriptUrl) {
      setSubmittedStatus(realSheetSynced 
        ? 'Feedback pushed to your live Google Apps Script endpoint & added to simulator!'
        : `Saved to simulator, but live endpoint failed: ${syncError}`
      );
    } else {
      setSubmittedStatus('Success! Feedback saved to "Feedbacks" sheet.');
    }

    setTimeout(() => {
      setSubmittedStatus(null);
    }, 6000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeAndSubmit();
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 mb-2">
            <MessageSquareHeart className="w-3.5 h-3.5" />
            Form 3 of 3 • Feedback Form Menu
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Product & Website Feedback
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Data automatically maps to the <span className="font-semibold text-amber-700">"Feedbacks"</span> tab in Google Sheets.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <button
            type="button"
            onClick={executeAndSubmit}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            {loading ? 'Submitting...' : 'Submit Feedback'}
          </button>

          <button
            type="button"
            onClick={fillSampleData}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            Auto-fill
          </button>
        </div>
      </div>

      {/* Target URL indicator */}
      <div className="mt-4 px-3.5 py-2 bg-slate-50 border border-slate-200/80 rounded-xl flex items-center justify-between text-xs text-slate-600 gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
          <span className="font-medium shrink-0">Connected Target:</span>
          <span className="font-mono truncate text-slate-700">{webAppConfig.scriptUrl || 'No URL configured'}</span>
        </div>
        {webAppConfig.scriptUrl?.endsWith('/dev') && (
          <span className="text-[10px] font-semibold text-amber-800 bg-amber-100 px-2 py-0.5 rounded shrink-0">
            Developer /dev link
          </span>
        )}
        {webAppConfig.scriptUrl?.endsWith('/exec') && (
          <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded shrink-0">
            Public /exec link
          </span>
        )}
      </div>

      {submittedStatus && (
        <div className="my-4 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-amber-600 shrink-0" />
          <span>{submittedStatus}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Customer / User Name
            </label>
            <input
              type="text"
              value={formData.customerName}
              onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
              placeholder="e.g. Alex Morgan"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="alex@company.com"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-slate-800"
            />
          </div>
        </div>

        {/* Rating Stars & Category */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 p-4 rounded-xl bg-slate-50 border border-slate-200/60">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Overall Experience Rating: <span className="text-amber-600 font-bold">{formData.rating} / 5 Stars</span>
            </label>
            <div className="flex items-center gap-1.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onMouseEnter={() => setHoverRating(star)}
                  onMouseLeave={() => setHoverRating(null)}
                  onClick={() => setFormData({ ...formData, rating: star })}
                  className="p-1 rounded-lg hover:scale-110 transition-transform cursor-pointer focus:outline-none"
                >
                  <Star
                    className={`w-7 h-7 ${
                      (hoverRating !== null ? star <= hoverRating : star <= formData.rating)
                        ? 'fill-amber-400 text-amber-500'
                        : 'text-slate-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Feedback Category
            </label>
            <select
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-slate-800"
            >
              <option value="UI / UX Design">UI / UX Design & Polish</option>
              <option value="Feature Request">Feature Request</option>
              <option value="Bug Report">Bug Report / Issue</option>
              <option value="Performance">Speed & Performance</option>
              <option value="General Feedback">General Compliment / Question</option>
            </select>
          </div>
        </div>

        {/* Net Promoter Score (NPS) Scale 0 - 10 */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Likelihood to recommend (NPS Score): <span className="text-amber-600 font-bold">{formData.npsScore} / 10</span>
            </label>
            <span className="text-xs text-slate-500">
              {formData.npsScore >= 9 ? 'Promoter ⭐' : formData.npsScore >= 7 ? 'Passive' : 'Detractor'}
            </span>
          </div>
          <div className="grid grid-cols-11 gap-1">
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((score) => (
              <button
                key={score}
                type="button"
                onClick={() => setFormData({ ...formData, npsScore: score })}
                className={`py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                  formData.npsScore === score
                    ? 'bg-amber-500 border-amber-600 text-white shadow-sm ring-2 ring-amber-400/30'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {score}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-[11px] text-slate-400 mt-1">
            <span>0 = Not likely at all</span>
            <span>10 = Extremely likely</span>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Your Comments & Suggestions <span className="text-rose-500">*</span>
          </label>
          <textarea
            required
            rows={3}
            value={formData.feedbackMessage}
            onChange={(e) => setFormData({ ...formData, feedbackMessage: e.target.value })}
            placeholder="What went well? Any issues or feature ideas you'd like to share?"
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-slate-800 resize-none"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Would you recommend f-docx?
            </label>
            <select
              value={formData.wouldRecommend}
              onChange={(e) => setFormData({ ...formData, wouldRecommend: e.target.value as any })}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-slate-800"
            >
              <option value="Yes">Yes, definitely!</option>
              <option value="Maybe">Maybe / Under consideration</option>
              <option value="No">No</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Follow-up Priority
            </label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-slate-800"
            >
              <option value="Low">Low - Informational</option>
              <option value="Medium">Medium - Regular Review</option>
              <option value="High">High - Urgent Attention</option>
            </select>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white font-semibold text-sm rounded-xl shadow-sm transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Storing in Google Sheet...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit Feedback to Google Sheet</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

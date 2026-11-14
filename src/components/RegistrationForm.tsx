import React, { useState } from 'react';
import { RegistrationSubmission, WebAppConfig } from '../types';
import { Sparkles, Send, CheckCircle2, AlertCircle, RefreshCw, UserCheck } from 'lucide-react';
import { playSuccessChime } from '../utils/audio';

interface Props {
  onAddRegistration: (sub: RegistrationSubmission) => void;
  webAppConfig: WebAppConfig;
}

export const RegistrationForm: React.FC<Props> = ({ onAddRegistration, webAppConfig }) => {
  const [formData, setFormData] = useState<{
    fullName: string;
    email: string;
    phone: string;
    organization: string;
    ticketType: 'Standard' | 'VIP' | 'Student' | 'Speaker';
    track: 'Frontend' | 'Google Apps Script' | 'Cloud & Backend' | 'AI & Automation';
    dietary: string;
    needAccommodation: boolean;
    notes: string;
  }>({
    fullName: '',
    email: '',
    phone: '',
    organization: '',
    ticketType: 'Standard',
    track: 'Google Apps Script',
    dietary: 'None',
    needAccommodation: false,
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [submittedStatus, setSubmittedStatus] = useState<string | null>(null);

  const fillSampleData = () => {
    const samples = [
      {
        fullName: 'Alex Morgan',
        email: 'alex.morgan@fdx-project.io',
        phone: '+91 98765 43210',
        organization: 'f-docx Cloud Labs',
        ticketType: 'VIP' as const,
        track: 'Google Apps Script' as const,
        dietary: 'Vegetarian',
        needAccommodation: true,
        notes: 'Testing automated row append via Google Apps Script POST endpoint.',
      },
      {
        fullName: 'Maya Lin',
        email: 'maya.lin@frontendwave.io',
        phone: '+1 (555) 762-9011',
        organization: 'Wave UI',
        ticketType: 'Standard' as const,
        track: 'Frontend' as const,
        dietary: 'None',
        needAccommodation: false,
        notes: 'Joining the Netlify form to Google Sheets hands-on demo.',
      },
      {
        fullName: 'Alexandre Dubois',
        email: 'a.dubois@datacorp.eu',
        phone: '+33 6 12 34 56 78',
        organization: 'DataCorp Europe',
        ticketType: 'Speaker' as const,
        track: 'Cloud & Backend' as const,
        dietary: 'Vegan',
        needAccommodation: true,
        notes: 'Keynote speaker for spreadsheet automation architecture.',
      },
    ];
    const picked = samples[Math.floor(Math.random() * samples.length)];
    setFormData(picked);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim() || !formData.email.trim()) return;

    setLoading(true);
    setSubmittedStatus(null);

    const submission: RegistrationSubmission = {
      id: `reg-${Date.now()}`,
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
            formType: 'registration',
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

    // Add to interactive spreadsheet simulator
    onAddRegistration(submission);
    playSuccessChime();

    setLoading(false);
    if (webAppConfig.syncToRealSheet && webAppConfig.scriptUrl) {
      setSubmittedStatus(realSheetSynced 
        ? 'Data sent to your live Google Apps Script endpoint & added to simulator!'
        : `Added to simulator, but live endpoint failed: ${syncError}`
      );
    } else {
      setSubmittedStatus('Success! Entry appended to the "Registrations" sheet.');
    }

    // Reset fields
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      organization: '',
      ticketType: 'Standard',
      track: 'Google Apps Script',
      dietary: 'None',
      needAccommodation: false,
      notes: '',
    });

    setTimeout(() => {
      setSubmittedStatus(null);
    }, 6000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 relative overflow-hidden">
      {/* Decorative top accent */}
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-500 to-green-600" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 mb-2">
            <UserCheck className="w-3.5 h-3.5" />
            Form 1 of 3 • Registration Menu
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Event & Conference Registration
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Data automatically maps to the <span className="font-semibold text-emerald-700">"Registrations"</span> tab in Google Sheets.
          </p>
        </div>

        <button
          type="button"
          onClick={fillSampleData}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer self-start sm:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          Auto-fill Sample
        </button>
      </div>

      {submittedStatus && (
        <div className="my-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{submittedStatus}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Full Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="e.g. Alex Morgan"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800"
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
              placeholder="alex.morgan@fdx-project.io"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Phone Number
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="+1 (555) 019-2831"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Company / Organization
            </label>
            <input
              type="text"
              value={formData.organization}
              onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
              placeholder="f-docx Labs"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Ticket Tier
            </label>
            <select
              value={formData.ticketType}
              onChange={(e) => setFormData({ ...formData, ticketType: e.target.value as any })}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800"
            >
              <option value="Standard">Standard Attendee ($199)</option>
              <option value="VIP">VIP All-Access Pass ($499)</option>
              <option value="Student">Student / Academic Pass ($49)</option>
              <option value="Speaker">Invited Speaker (Complimentary)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Workshop / Focus Track
            </label>
            <select
              value={formData.track}
              onChange={(e) => setFormData({ ...formData, track: e.target.value as any })}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800"
            >
              <option value="Google Apps Script">Google Apps Script & Sheet Automation</option>
              <option value="Frontend">Frontend Development (HTML, CSS, JS)</option>
              <option value="Cloud & Backend">Cloud Functions & Serverless API</option>
              <option value="AI & Automation">AI Agents & Workflow Pipelines</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Dietary Preference
            </label>
            <select
              value={formData.dietary}
              onChange={(e) => setFormData({ ...formData, dietary: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800"
            >
              <option value="None">Standard / No restrictions</option>
              <option value="Vegetarian">Vegetarian</option>
              <option value="Vegan">Vegan</option>
              <option value="Gluten-Free">Gluten-Free</option>
              <option value="Halal">Halal</option>
              <option value="Kosher">Kosher</option>
            </select>
          </div>

          <div className="flex items-center gap-3 pt-6">
            <input
              type="checkbox"
              id="accommodationCheck"
              checked={formData.needAccommodation}
              onChange={(e) => setFormData({ ...formData, needAccommodation: e.target.checked })}
              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="accommodationCheck" className="text-sm font-medium text-slate-700 cursor-pointer">
              I need hotel / accommodation booking assistance
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Special Requests / Goals
          </label>
          <textarea
            rows={2}
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Tell us about what you want to achieve or specific setup requirements..."
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800 resize-none"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold text-sm rounded-xl shadow-sm transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Storing in Google Sheet...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Submit & Append to Google Sheet</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

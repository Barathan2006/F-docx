import React, { useState } from 'react';
import { UserDetailsSubmission, WebAppConfig } from '../types';
import { Sparkles, Send, CheckCircle2, ShieldCheck, RefreshCw, KeyRound } from 'lucide-react';
import { playSuccessChime } from '../utils/audio';

interface Props {
  onAddUserDetails: (sub: UserDetailsSubmission) => void;
  webAppConfig: WebAppConfig;
}

export const UserDetailsForm: React.FC<Props> = ({ onAddUserDetails, webAppConfig }) => {
  const [formData, setFormData] = useState<{
    username: string;
    fullName: string;
    workEmail: string;
    department: 'Engineering' | 'Product' | 'Design' | 'Marketing' | 'Operations' | 'Human Resources';
    jobTitle: string;
    accessLevel: 'Administrator' | 'Manager' | 'Standard Member' | 'Read Only';
    region: string;
    twoFactorEnabled: boolean;
    internalNotes: string;
  }>({
    username: '',
    fullName: '',
    workEmail: '',
    department: 'Engineering',
    jobTitle: '',
    accessLevel: 'Standard Member',
    region: 'North America / New York',
    twoFactorEnabled: true,
    internalNotes: '',
  });

  const [loading, setLoading] = useState(false);
  const [submittedStatus, setSubmittedStatus] = useState<string | null>(null);

  const fillSampleData = () => {
    const samples = [
      {
        username: 'alex_admin',
        fullName: 'Alex Morgan',
        workEmail: 'alex@fdx-company.com',
        department: 'Engineering' as const,
        jobTitle: 'Principal Cloud Architect',
        accessLevel: 'Administrator' as const,
        region: 'Asia-Pacific / Tokyo',
        twoFactorEnabled: true,
        internalNotes: 'Granted root IAM permissions for Google Cloud and Apps Script web apps.',
      },
      {
        username: 'kavita_prod',
        fullName: 'Kavita Menon',
        workEmail: 'kavita.m@fdx-systems.io',
        department: 'Product' as const,
        jobTitle: 'Product Operations Lead',
        accessLevel: 'Manager' as const,
        region: 'Europe / Berlin',
        twoFactorEnabled: true,
        internalNotes: 'Manages user registration intake and automated lead qualification.',
      },
      {
        username: 'alex_ux',
        fullName: 'Alexander Wright',
        workEmail: 'a.wright@fdx-systems.io',
        department: 'Design' as const,
        jobTitle: 'Senior UI/UX Designer',
        accessLevel: 'Standard Member' as const,
        region: 'North America / San Francisco',
        twoFactorEnabled: false,
        internalNotes: 'Design sprint lead for f-docx forms and dashboard UI.',
      },
    ];
    const picked = samples[Math.floor(Math.random() * samples.length)];
    setFormData(picked);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.workEmail.trim()) return;

    setLoading(true);
    setSubmittedStatus(null);

    const submission: UserDetailsSubmission = {
      id: `usr-${Date.now()}`,
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
            formType: 'userDetails',
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

    onAddUserDetails(submission);
    playSuccessChime();

    setLoading(false);
    if (webAppConfig.syncToRealSheet && webAppConfig.scriptUrl) {
      setSubmittedStatus(realSheetSynced 
        ? 'User details synced to your live Google Apps Script endpoint & added to simulator!'
        : `Saved to simulator, but live endpoint failed: ${syncError}`
      );
    } else {
      setSubmittedStatus('Success! User details appended to "UserDetails" sheet.');
    }

    setFormData({
      username: '',
      fullName: '',
      workEmail: '',
      department: 'Engineering',
      jobTitle: '',
      accessLevel: 'Standard Member',
      region: 'North America / New York',
      twoFactorEnabled: true,
      internalNotes: '',
    });

    setTimeout(() => {
      setSubmittedStatus(null);
    }, 6000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-sky-600" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mb-2">
            <KeyRound className="w-3.5 h-3.5" />
            Form 2 of 3 • Login / User Details Menu
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            User Account & Onboarding Details
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Data automatically maps to the <span className="font-semibold text-blue-700">"UserDetails"</span> tab in Google Sheets.
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
        <div className="my-4 p-3.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-800 text-sm flex items-center gap-2 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0" />
          <span>{submittedStatus}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Username <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="e.g. alex_admin"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Full Legal Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Alex Morgan"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Corporate / Work Email <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              required
              value={formData.workEmail}
              onChange={(e) => setFormData({ ...formData, workEmail: e.target.value })}
              placeholder="alex@company.com"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Department
            </label>
            <select
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value as any })}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
            >
              <option value="Engineering">Engineering</option>
              <option value="Product">Product</option>
              <option value="Design">Design</option>
              <option value="Marketing">Marketing</option>
              <option value="Operations">Operations</option>
              <option value="Human Resources">Human Resources</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Job Title
            </label>
            <input
              type="text"
              value={formData.jobTitle}
              onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
              placeholder="e.g. Full Stack Developer"
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Role Access Level
            </label>
            <select
              value={formData.accessLevel}
              onChange={(e) => setFormData({ ...formData, accessLevel: e.target.value as any })}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
            >
              <option value="Standard Member">Standard Member</option>
              <option value="Manager">Team Manager</option>
              <option value="Administrator">Administrator (Superuser)</option>
              <option value="Read Only">Read Only Observer</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Operating Region / Timezone
            </label>
            <select
              value={formData.region}
              onChange={(e) => setFormData({ ...formData, region: e.target.value })}
              className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800"
            >
              <option value="Asia-Pacific / Tokyo">Asia-Pacific / Tokyo (JST)</option>
              <option value="Asia-Pacific / India">Asia-Pacific / India (IST)</option>
              <option value="Asia-Pacific / Singapore">Asia-Pacific / Singapore (SGT)</option>
              <option value="Europe / London">Europe / London (GMT/BST)</option>
              <option value="Europe / Berlin">Europe / Berlin (CET)</option>
              <option value="North America / New York">North America / New York (EST)</option>
              <option value="North America / San Francisco">North America / San Francisco (PST)</option>
            </select>
          </div>

          <div className="flex items-center gap-3 pt-6">
            <input
              type="checkbox"
              id="twoFactorCheck"
              checked={formData.twoFactorEnabled}
              onChange={(e) => setFormData({ ...formData, twoFactorEnabled: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="twoFactorCheck" className="text-sm font-medium text-slate-700 cursor-pointer flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              Two-Factor Authentication (2FA) enforced
            </label>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
            Internal Provisioning Notes
          </label>
          <textarea
            rows={2}
            value={formData.internalNotes}
            onChange={(e) => setFormData({ ...formData, internalNotes: e.target.value })}
            placeholder="Hardware assignments, security group tags, or manager approval details..."
            className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-slate-800 resize-none"
          />
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold text-sm rounded-xl shadow-sm transition-all cursor-pointer"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Storing in Google Sheet...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Save User Details to Google Sheet</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

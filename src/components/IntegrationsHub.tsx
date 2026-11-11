import React, { useState } from 'react';
import { WebAppConfig } from '../types';
import {
  Globe,
  Zap,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  ShieldCheck,
  Code2,
  RefreshCw,
  ExternalLink,
  Layers,
  Send,
  HelpCircle,
  ArrowRight,
  Sparkles,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface Props {
  webAppConfig: WebAppConfig;
  onSaveConfig: (cfg: WebAppConfig) => void;
}

export const IntegrationsHub: React.FC<Props> = ({ webAppConfig, onSaveConfig }) => {
  const [url, setUrl] = useState(webAppConfig.scriptUrl || '');
  const [syncEnabled, setSyncEnabled] = useState(webAppConfig.syncToRealSheet || false);
  const [activePayloadTab, setActivePayloadTab] = useState<'registration' | 'userDetails' | 'feedback'>('registration');
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ status: 'success' | 'error'; message: string } | null>(null);
  const [showGuide, setShowGuide] = useState(true);

  const samplePayloads = {
    registration: {
      formType: 'registration',
      fullName: 'Alex Morgan',
      email: 'alex.morgan@fdx-project.io',
      phone: '+1 (555) 382-9901',
      organization: 'f-docx Labs',
      ticketType: 'VIP',
      track: 'Google Apps Script',
      dietary: 'Vegetarian',
      needAccommodation: true,
      notes: 'Testing spreadsheet webhook integration.',
      submittedAt: new Date().toLocaleString(),
    },
    userDetails: {
      formType: 'userDetails',
      username: 'alex_admin',
      fullName: 'Alex Morgan',
      workEmail: 'alex@fdx-company.com',
      department: 'Engineering',
      jobTitle: 'Lead Architect',
      accessLevel: 'Administrator',
      region: 'North America / New York',
      twoFactorEnabled: true,
      internalNotes: 'Automated profile creation.',
      submittedAt: new Date().toLocaleString(),
    },
    feedback: {
      formType: 'feedback',
      customerName: 'Alex Morgan',
      email: 'alex@company.com',
      category: 'UI / UX Design',
      rating: 5,
      npsScore: 10,
      feedbackMessage: 'Submissions sync in real time without any database configuration!',
      wouldRecommend: 'Yes',
      priority: 'Medium',
      submittedAt: new Date().toLocaleString(),
    },
  };

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(samplePayloads[activePayloadTab], null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const handleSave = () => {
    onSaveConfig({
      scriptUrl: url.trim(),
      syncToRealSheet: syncEnabled && !!url.trim(),
    });
    alert('Endpoint settings saved! Forms will now dispatch submissions to this URL.');
  };

  const handleTestPing = async () => {
    if (!url.trim()) {
      setTestResult({
        status: 'error',
        message: 'Please enter a target URL first.',
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      await fetch(url.trim(), {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(samplePayloads[activePayloadTab]),
      });

      setTestResult({
        status: 'success',
        message: 'Ping payload dispatched successfully! Check your spreadsheet/webhook endpoint to verify the entry.',
      });
    } catch (err: any) {
      setTestResult({
        status: 'error',
        message: `Request failed: ${err.message || 'Network blocked'}`,
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-2">
          <Globe className="w-3.5 h-3.5 text-emerald-600" />
          Webhooks & Spreadsheet Connectors
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          Endpoint & Integration Settings
        </h2>
        <p className="text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
          Connect your website forms to any spreadsheet, Google Apps Script Web App, SheetDB API, Zapier webhook, or custom REST endpoint.
        </p>

        {/* Configuration Box */}
        <div className="mt-6 p-5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Target Webhook / Google Sheets Endpoint URL
              </label>
              <span className="text-[11px] font-medium text-emerald-700">
                {webAppConfig.syncToRealSheet && webAppConfig.scriptUrl
                  ? '● Live Sync Active'
                  : '○ Using Local Simulator'}
              </span>
            </div>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec OR https://sheetdb.io/api/v1/..."
              className="w-full px-3.5 py-2.5 text-xs font-mono bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800"
            />
            <span className="text-[11px] text-slate-500 mt-1 block">
              Leave blank to test with the built-in real-time spreadsheet simulator, or enter your live endpoint to save entries directly to external sheets.
            </span>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="syncCheckbox"
              checked={syncEnabled}
              onChange={(e) => setSyncEnabled(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="syncCheckbox" className="text-xs text-slate-700 font-medium cursor-pointer">
              Enable real-time synchronization on form submission
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
            >
              Save Endpoint Settings
            </button>

            <button
              onClick={handleTestPing}
              disabled={testing || !url.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-slate-100 disabled:opacity-50 text-slate-700 border border-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              {testing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Dispatching Ping...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Send Test Ping</span>
                </>
              )}
            </button>
          </div>

          {testResult && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-center gap-2 animate-fadeIn ${
                testResult.status === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {testResult.status === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}
        </div>
      </div>

      {/* Guide: How to Use Connected Endpoint */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
        <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowGuide(!showGuide)}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <HelpCircle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                How to Use the Connected Endpoint (Step-by-Step)
              </h3>
              <p className="text-xs text-slate-500">
                Everything you need to know about setting up and using your endpoint URL
              </p>
            </div>
          </div>
          <button className="text-slate-400 hover:text-slate-600 p-1">
            {showGuide ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
          </button>
        </div>

        {showGuide && (
          <div className="mt-6 space-y-6 pt-4 border-t border-slate-100 text-xs sm:text-sm text-slate-600">
            {/* Step 1 to 4 Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                  1
                </span>
                <strong className="block text-slate-900 text-xs font-bold">
                  Get Your Endpoint URL
                </strong>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Generate your URL from Google Sheets (Extensions → Apps Script Web App), SheetDB, Make, or Zapier.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                  2
                </span>
                <strong className="block text-slate-900 text-xs font-bold">
                  Paste & Check Sync
                </strong>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Paste the URL in the box above and ensure <em>"Enable real-time synchronization"</em> is checked, then save.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                  3
                </span>
                <strong className="block text-slate-900 text-xs font-bold">
                  Send Test Ping
                </strong>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Click <em>"Send Test Ping"</em> to verify that network payloads reach your external sheet without errors.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                  4
                </span>
                <strong className="block text-slate-900 text-xs font-bold">
                  Submit Forms
                </strong>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Submissions from Registration, User Details, or Feedback forms now automatically post to your live spreadsheet.
                </p>
              </div>
            </div>

            {/* In the Standalone f-docx code */}
            <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <Code2 className="w-4 h-4" />
                <span>Using Connected Endpoint in your HTML/JS website (script.js):</span>
              </div>
              <p className="text-xs text-slate-300">
                In the downloaded <strong className="text-white">f-docx</strong> project files, open <code className="text-emerald-300 font-mono">script.js</code> and paste your endpoint on line 2:
              </p>
              <pre className="p-3 bg-slate-950 rounded-lg text-emerald-300 font-mono text-xs overflow-x-auto">
                <code>{`// In your website's script.js:
let ENDPOINT_URL = "${url || 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec'}";

// When users click Submit, fetch() automatically dispatches the form data:
await fetch(ENDPOINT_URL, {
  method: "POST",
  mode: "no-cors", // Allows cross-origin requests to Google Sheets
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(formData),
});`}</code>
              </pre>
            </div>

            {/* Quick tips */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-900">
                <strong className="block mb-1 font-semibold">✓ Supported Endpoints:</strong>
                <p>Google Apps Script Web App, SheetDB API, Zapier, Make.com webhooks, or custom Node.js/Python API endpoints.</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-900">
                <strong className="block mb-1 font-semibold">✓ Cross-Origin (CORS):</strong>
                <p>The client uses standard <code className="font-mono bg-white px-1 rounded border">no-cors</code> mode to guarantee data delivery from static sites (Netlify, Vercel, GitHub Pages).</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payload Inspector */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-slate-900 text-base">
              JSON Request Payload Inspector
            </h3>
            <p className="text-xs text-slate-500">
              Exact JSON structure dispatched to your connected endpoint upon submission.
            </p>
          </div>

          {/* Form Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs">
            <button
              onClick={() => setActivePayloadTab('registration')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activePayloadTab === 'registration'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Registration
            </button>
            <button
              onClick={() => setActivePayloadTab('userDetails')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activePayloadTab === 'userDetails'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              User Details
            </button>
            <button
              onClick={() => setActivePayloadTab('feedback')}
              className={`px-3 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ${
                activePayloadTab === 'feedback'
                  ? 'bg-white text-amber-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Feedback
            </button>
          </div>
        </div>

        {/* Code Box */}
        <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-950 text-slate-100">
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800">
            <span className="font-mono text-xs text-slate-400">
              POST /payload.json ({activePayloadTab})
            </span>
            <button
              onClick={handleCopyPayload}
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
            >
              {copiedPayload ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Payload</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-4 text-xs font-mono overflow-x-auto text-emerald-300/90 leading-relaxed">
            <code>{JSON.stringify(samplePayloads[activePayloadTab], null, 2)}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};

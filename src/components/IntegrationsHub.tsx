import React, { useState } from 'react';
import { WebAppConfig } from '../types';
import { APPS_SCRIPT_CODE_UNIFIED } from '../data/defaultData';
import { useAuth } from '../context/AuthContext';
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
  ChevronUp,
  FileSpreadsheet,
  Link2,
  Unlink,
} from 'lucide-react';

interface Props {
  webAppConfig: WebAppConfig;
  onSaveConfig: (cfg: WebAppConfig) => void;
  onUpdateUrl?: (url: string) => void;
}

export const IntegrationsHub: React.FC<Props> = ({ webAppConfig, onSaveConfig, onUpdateUrl }) => {
  const { googleSheetsStatus, connectGoogleSheets, disconnectGoogleSheets } = useAuth();
  const [oauthMessage, setOauthMessage] = useState<string | null>(null);
  const [url, setUrl] = useState(webAppConfig.scriptUrl || '');
  const [syncEnabled, setSyncEnabled] = useState(webAppConfig.syncToRealSheet ?? true);

  // Keep local input in sync if parent changes
  React.useEffect(() => {
    setUrl(webAppConfig.scriptUrl || '');
  }, [webAppConfig.scriptUrl]);
  const [activePayloadTab, setActivePayloadTab] = useState<'registration' | 'userDetails' | 'feedback'>('registration');
  const [copiedPayload, setCopiedPayload] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ status: 'success' | 'error'; message: string; spreadsheetUrl?: string | null } | null>(null);
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

  const [savedNotification, setSavedNotification] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  const handleCopyScript = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE_UNIFIED);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const handleSave = () => {
    onSaveConfig({
      scriptUrl: url.trim(),
      syncToRealSheet: syncEnabled && !!url.trim(),
    });
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 4000);
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

    const payload = samplePayloads[activePayloadTab];

    try {
      // First try real diagnostic ping through server API to inspect real Google response
      const diagRes = await fetch('/api/ping-endpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), payload }),
      });

      if (diagRes.ok) {
        const diagData = await diagRes.json();
        if (diagData.success) {
          setTestResult({
            status: 'success',
            message: diagData.message || 'Endpoint successfully verified and received test payload!',
            spreadsheetUrl: diagData.spreadsheetUrl || null,
          });
        } else {
          setTestResult({
            status: 'error',
            message: diagData.message || 'Endpoint test failed.',
          });
        }
        return;
      }
    } catch {
      // Fallback to direct client ping
    }

    try {
      await fetch(url.trim(), {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload),
      });

      setTestResult({
        status: 'success',
        message: 'Ping payload dispatched to your endpoint! Check your spreadsheet to confirm the row was added.',
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
      {/* Separate Google Sheets OAuth Connector */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">
                  Google Sheets & Drive OAuth Account
                </h2>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    googleSheetsStatus.connected
                      ? 'bg-emerald-100 text-emerald-800'
                      : googleSheetsStatus.tokenStatus === 'NEEDS_REAUTH'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {googleSheetsStatus.connected ? 'Connected' : googleSheetsStatus.tokenStatus}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 max-w-2xl">
                {googleSheetsStatus.connected
                  ? `Connected to ${googleSheetsStatus.googleEmail}. Your OAuth access token is encrypted at rest on the server and used when creating or appending rows to your Google Spreadsheets.`
                  : 'Authorize Google Sheets & Drive access independently of your login session to automatically create destination spreadsheets and sync form submissions.'}
              </p>
              {oauthMessage && (
                <p className="text-xs font-semibold text-emerald-700 mt-2">{oauthMessage}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {googleSheetsStatus.connected ? (
              <button
                type="button"
                onClick={async () => {
                  await disconnectGoogleSheets();
                  setOauthMessage('Google Sheets account disconnected.');
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer"
              >
                <Unlink className="w-3.5 h-3.5" />
                <span>Disconnect Google Sheets</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={async () => {
                  try {
                    const res = await connectGoogleSheets();
                    setOauthMessage(`Connected Google Sheets for ${res.googleEmail}.`);
                  } catch (err: any) {
                    setOauthMessage(err?.message || 'OAuth authorization failed.');
                  }
                }}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white cursor-pointer"
              >
                <Link2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>
                  {googleSheetsStatus.tokenStatus === 'NEEDS_REAUTH'
                    ? 'Reconnect Google Sheets'
                    : 'Connect Google Sheets Account'}
                </span>
              </button>
            )}
          </div>
        </div>
      </div>

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
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => {
                  const newVal = e.target.value;
                  setUrl(newVal);
                  onUpdateUrl?.(newVal);
                }}
                placeholder="https://script.google.com/macros/s/.../exec OR https://sheetdb.io/api/v1/..."
                className="w-full px-3.5 py-2.5 text-xs font-mono bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800"
              />
              {url.endsWith('/dev') && (
                <button
                  type="button"
                  onClick={() => {
                    const execUrl = url.replace(/\/dev$/, '/exec');
                    setUrl(execUrl);
                    onUpdateUrl?.(execUrl);
                  }}
                  className="shrink-0 px-2.5 py-2 text-xs font-semibold bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-xl border border-amber-300 transition-colors cursor-pointer"
                  title="Switch to public /exec URL"
                >
                  Switch to /exec
                </button>
              )}
              {url.endsWith('/exec') && (
                <button
                  type="button"
                  onClick={() => {
                    const devUrl = url.replace(/\/exec$/, '/dev');
                    setUrl(devUrl);
                    onUpdateUrl?.(devUrl);
                  }}
                  className="shrink-0 px-2.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-300 transition-colors cursor-pointer"
                  title="Switch to developer /dev URL"
                >
                  Switch to /dev
                </button>
              )}
            </div>

            {url.endsWith('/dev') && (
              <div className="mt-2 p-2.5 bg-amber-50/90 border border-amber-200/90 rounded-xl text-xs text-amber-900 leading-relaxed">
                <span className="font-bold">⚠️ Notice on /dev links:</span> In Google Apps Script, URLs ending in <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[11px]">/dev</code> are developer test links that only work when logged into Google in the same browser. To allow website visitors to submit without Google login, deploy via <span className="font-semibold">Deploy → New deployment → Web app → Who has access: Anyone</span>, and use the URL ending in <code className="bg-amber-100 px-1 py-0.5 rounded font-mono text-[11px]">/exec</code>.
              </div>
            )}

            <span className="text-[11px] text-slate-500 mt-1 block">
              Enter any Google Apps Script Web App URL or Webhook. Changes sync dynamically across all forms and export files in real time.
            </span>
          </div>

          <div className="flex items-center gap-3">
            <input
              type="checkbox"
              id="syncCheckbox"
              checked={syncEnabled}
              onChange={(e) => {
                setSyncEnabled(e.target.checked);
                onSaveConfig({
                  scriptUrl: url.trim(),
                  syncToRealSheet: e.target.checked && !!url.trim(),
                });
              }}
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
              onClick={() => {
                const defaultUrl = 'https://script.google.com/macros/s/AKfycbzQFGxzs1ftTpgZKd-MOBciCRvBaYqyM92VLO2qjtrt/dev';
                setUrl(defaultUrl);
                setSyncEnabled(true);
                onUpdateUrl?.(defaultUrl);
                onSaveConfig({
                  scriptUrl: defaultUrl,
                  syncToRealSheet: true,
                });
              }}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 transition-colors cursor-pointer"
            >
              Reset to Default Google Script
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
            <button
              onClick={handleCopyScript}
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedScript ? 'Copied Apps Script!' : 'Copy Apps Script (Code.gs)'}</span>
            </button>
          </div>

          {savedNotification && (
            <div className="p-3 rounded-xl border border-emerald-300 bg-emerald-50 text-emerald-900 text-xs flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">Endpoint configuration saved! Forms will dispatch to this URL.</span>
            </div>
          )}

          {testResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs animate-fadeIn ${
                testResult.status === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              <div className="flex items-start gap-2.5">
                {testResult.status === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <div className="flex-1 space-y-2">
                  <p className="font-medium leading-relaxed">{testResult.message}</p>
                  {testResult.spreadsheetUrl && (
                    <div className="pt-1">
                      <a
                        href={testResult.spreadsheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open Connected Google Sheet</span>
                      </a>
                    </div>
                  )}
                  {(testResult.message.includes('doPost') || testResult.message.includes('Google Sheet')) && testResult.status === 'error' && (
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleCopyScript}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white shadow-xs cursor-pointer"
                      >
                        {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedScript ? 'Copied Apps Script Code!' : 'Copy Working Apps Script Code'}</span>
                      </button>
                      <span className="block text-[11px] text-rose-700 mt-1">
                        Open your Google Sheet → Extensions → Apps Script, paste the code, then Deploy → New deployment → Web app → Who has access: Anyone.
                      </span>
                    </div>
                  )}
                </div>
              </div>
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

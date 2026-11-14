import React, { useState } from 'react';
import { WebAppConfig } from '../types';
import { X, Check, Globe, RefreshCw, AlertCircle, Zap, ExternalLink, HelpCircle, ArrowRight } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  config: WebAppConfig;
  onSaveConfig: (newConfig: WebAppConfig) => void;
}

export const LiveConfigModal: React.FC<Props> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
}) => {
  const [url, setUrl] = useState(config.scriptUrl || '');
  const [syncEnabled, setSyncEnabled] = useState(config.syncToRealSheet || false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ status: 'success' | 'error'; message: string } | null>(null);

  React.useEffect(() => {
    setUrl(config.scriptUrl || '');
    setSyncEnabled(config.syncToRealSheet || false);
  }, [config.scriptUrl, config.syncToRealSheet, isOpen]);

  if (!isOpen) return null;

  const handleTestEndpoint = async () => {
    if (!url.trim()) {
      setTestResult({
        status: 'error',
        message: 'Please paste your endpoint URL first.',
      });
      return;
    }

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      setTestResult({
        status: 'error',
        message: 'URL must start with http:// or https://',
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
        body: JSON.stringify({
          formType: 'registration',
          fullName: 'f-docx Ping Test',
          email: 'test@fdx-demo.internal',
          notes: 'Ping test from f-docx to verify endpoint connectivity.',
          submittedAt: new Date().toLocaleString(),
        }),
      });

      setTestResult({
        status: 'success',
        message: 'Test payload dispatched! Check your spreadsheet/webhook receiver to verify the row.',
      });
    } catch (err: any) {
      setTestResult({
        status: 'error',
        message: `Failed to reach endpoint: ${err.message || 'Network error'}`,
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSave = () => {
    onSaveConfig({
      scriptUrl: url.trim(),
      syncToRealSheet: syncEnabled && !!url.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-slate-200 shadow-2xl overflow-hidden animate-scaleIn">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">Connected Endpoint Settings</h3>
              <p className="text-xs text-slate-500">Sync live submissions to external Google Sheets or Webhooks</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs sm:text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
              Target Webhook / Google Sheets Endpoint URL
            </label>
            <div className="flex items-center gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec OR SheetDB URL"
                className="w-full px-3.5 py-2.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all text-slate-800"
              />
              {url.endsWith('/dev') && (
                <button
                  type="button"
                  onClick={() => setUrl(url.replace(/\/dev$/, '/exec'))}
                  className="shrink-0 px-2.5 py-2 text-xs font-semibold bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-xl border border-amber-300 transition-colors cursor-pointer"
                  title="Switch to public /exec URL"
                >
                  Switch to /exec
                </button>
              )}
              {url.endsWith('/exec') && (
                <button
                  type="button"
                  onClick={() => setUrl(url.replace(/\/exec$/, '/dev'))}
                  className="shrink-0 px-2.5 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-300 transition-colors cursor-pointer"
                  title="Switch to developer /dev URL"
                >
                  Switch to /dev
                </button>
              )}
            </div>
            {url.endsWith('/dev') && (
              <p className="text-[11px] text-amber-800 bg-amber-50 p-2 rounded-lg border border-amber-200 mt-2">
                💡 <strong>Notice:</strong> <code>/dev</code> URLs require Google account authentication in the same browser. For public website visitors, use <code>/exec</code> deployed with access set to &ldquo;Anyone&rdquo;.
              </p>
            )}
            <span className="text-[11px] text-slate-500 mt-1 block">
              Enter your Google Apps Script Web App URL, SheetDB API, Zapier, or custom webhook URL.
            </span>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
            <input
              type="checkbox"
              id="enableLiveSync"
              checked={syncEnabled}
              onChange={(e) => setSyncEnabled(e.target.checked)}
              className="w-4 h-4 mt-0.5 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
            />
            <label htmlFor="enableLiveSync" className="text-xs text-slate-700 cursor-pointer">
              <strong className="block text-slate-900 font-semibold mb-0.5">
                Enable live synchronization
              </strong>
              When enabled, submitting Registration, User Details, or Feedback forms sends an immediate background POST request to your endpoint.
            </label>
          </div>

          {/* Test connection button */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestEndpoint}
              disabled={testing || !url.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
            >
              {testing ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Dispatching Ping...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
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
                <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              )}
              <span>{testResult.message}</span>
            </div>
          )}

          {/* How to use summary box */}
          <div className="p-3.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs text-emerald-950 space-y-1.5">
            <strong className="font-bold flex items-center gap-1.5 text-emerald-900">
              <HelpCircle className="w-4 h-4 text-emerald-600" />
              How it works:
            </strong>
            <p className="text-[11px] leading-relaxed text-emerald-900/90">
              1. Save your URL above and check <strong>Enable live synchronization</strong>.<br />
              2. Go to the <strong>Forms Playground</strong> tab and submit any form.<br />
              3. The form sends the data directly to your endpoint via HTTP POST, and simultaneously adds the row to the on-screen spreadsheet.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-colors cursor-pointer"
          >
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
};

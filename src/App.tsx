import React, { useState, useEffect } from 'react';
import {
  FormType,
  RegistrationSubmission,
  UserDetailsSubmission,
  FeedbackSubmission,
  WebAppConfig,
  CustomFormConfig,
  CustomFormSubmission,
} from './types';
import { initialRegistrations, initialUserDetails, initialFeedbacks } from './data/defaultData';
import {
  createStarterCustomForms,
  getOrderedColumnsForForm,
} from './data/formBuilderCatalog';
import { Navbar, MainNavTab } from './components/Navbar';
import { RegistrationForm } from './components/RegistrationForm';
import { UserDetailsForm } from './components/UserDetailsForm';
import { FeedbackForm } from './components/FeedbackForm';
import { GoogleSheetSimulator } from './components/GoogleSheetSimulator';
import { AnalyticsHub } from './components/AnalyticsHub';
import { IntegrationsHub } from './components/IntegrationsHub';
import { GithubProjectHub } from './components/GithubProjectHub';
import { LiveConfigModal } from './components/LiveConfigModal';
import { FormBuilderWorkspace } from './components/form-builder/FormBuilderWorkspace';
import {
  FileSpreadsheet,
  ArrowRight,
  Database,
  Globe,
  Github,
  Zap,
  CheckCircle,
  ExternalLink,
  Split,
  Eye,
  Sparkles,
  Layers
} from 'lucide-react';
import { playSuccessChime } from './utils/audio';

export const DEFAULT_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbzQFGxzs1ftTpgZKd-MOBciCRvBaYqyM92VLO2qjtrt/dev';

export default function App() {
  const [registrations, setRegistrations] = useState<RegistrationSubmission[]>(() => {
    try {
      const saved = localStorage.getItem('fdx_registrations');
      return saved ? JSON.parse(saved) : initialRegistrations;
    } catch {
      return initialRegistrations;
    }
  });

  const [userDetails, setUserDetails] = useState<UserDetailsSubmission[]>(() => {
    try {
      const saved = localStorage.getItem('fdx_userDetails');
      return saved ? JSON.parse(saved) : initialUserDetails;
    } catch {
      return initialUserDetails;
    }
  });

  const [feedbacks, setFeedbacks] = useState<FeedbackSubmission[]>(() => {
    try {
      const saved = localStorage.getItem('fdx_feedbacks');
      return saved ? JSON.parse(saved) : initialFeedbacks;
    } catch {
      return initialFeedbacks;
    }
  });

  const [webAppConfig, setWebAppConfig] = useState<WebAppConfig>(() => {
    try {
      const saved = localStorage.getItem('fdx_config');
      if (saved) {
        const parsed = JSON.parse(saved);
        // If it was the previous placeholder URL, migrate to the user's latest provided URL
        if (parsed.scriptUrl && !parsed.scriptUrl.includes('AKfycby4b4Vn8X5UVXXhriyus0rOHNUgJRPdW2ZtbTgd13vnfihFP348YHy5LjZTswwomGRaSg')) {
          return {
            ...parsed,
            syncToRealSheet: parsed.syncToRealSheet !== undefined ? parsed.syncToRealSheet : true,
          };
        }
      }
    } catch {}
    return {
      scriptUrl: DEFAULT_SCRIPT_URL,
      syncToRealSheet: true,
    };
  });

  const [customForms, setCustomForms] = useState<CustomFormConfig[]>(() => {
    try {
      const saved = localStorage.getItem('fdx_custom_forms');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return createStarterCustomForms();
  });

  const [customSubmissions, setCustomSubmissions] = useState<CustomFormSubmission[]>(() => {
    try {
      const saved = localStorage.getItem('fdx_custom_submissions');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [activeCustomFormId, setActiveCustomFormId] = useState<string>(
    () => customForms[0]?.id || 'form_onboarding_starter'
  );

  const [activeNavTab, setActiveNavTab] = useState<MainNavTab>('forms');
  const [activeFormTab, setActiveFormTab] = useState<FormType>('feedback');
  const [activeSheetTab, setActiveSheetTab] = useState<string>('feedback');
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
  const [splitViewMode, setSplitViewMode] = useState(true);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem('fdx_registrations', JSON.stringify(registrations));
    } catch {}
  }, [registrations]);

  useEffect(() => {
    try {
      localStorage.setItem('fdx_userDetails', JSON.stringify(userDetails));
    } catch {}
  }, [userDetails]);

  useEffect(() => {
    try {
      localStorage.setItem('fdx_feedbacks', JSON.stringify(feedbacks));
    } catch {}
  }, [feedbacks]);

  useEffect(() => {
    try {
      localStorage.setItem('fdx_config', JSON.stringify(webAppConfig));
    } catch {}
  }, [webAppConfig]);

  useEffect(() => {
    try {
      localStorage.setItem('fdx_custom_forms', JSON.stringify(customForms));
    } catch {}
  }, [customForms]);

  useEffect(() => {
    try {
      localStorage.setItem('fdx_custom_submissions', JSON.stringify(customSubmissions));
    } catch {}
  }, [customSubmissions]);

  const handleAddRegistration = (sub: RegistrationSubmission) => {
    setRegistrations((prev) => [...prev, sub]);
    setActiveSheetTab('registration');
  };

  const handleAddUserDetails = (sub: UserDetailsSubmission) => {
    setUserDetails((prev) => [...prev, sub]);
    setActiveSheetTab('userDetails');
  };

  const handleAddFeedback = (sub: FeedbackSubmission) => {
    setFeedbacks((prev) => [...prev, sub]);
    setActiveSheetTab('feedback');
  };

  const handleAddCustomSubmission = (sub: CustomFormSubmission) => {
    setCustomSubmissions((prev) => [...prev, sub]);
    setActiveSheetTab(sub.formId);
  };

  const handleClearCurrentSheet = (tab: string) => {
    if (tab === 'registration') setRegistrations([]);
    else if (tab === 'userDetails') setUserDetails([]);
    else if (tab === 'feedback') setFeedbacks([]);
    else {
      setCustomSubmissions((prev) => prev.filter((s) => s.formId !== tab));
    }
  };

  const handleAddDummyRow = (tab: string) => {
    const timestamp = new Date().toLocaleString();
    if (tab === 'registration') {
      const names = ['Kiran Varma', 'Tara Simmons', 'Hassan Ali', 'Mei Ling'];
      const pickedName = names[Math.floor(Math.random() * names.length)];
      handleAddRegistration({
        id: `reg-${Date.now()}`,
        fullName: pickedName,
        email: `${pickedName.toLowerCase().replace(' ', '.')}@example.com`,
        phone: '+1 (555) 890-' + Math.floor(1000 + Math.random() * 9000),
        organization: 'Global Innovation Hub',
        ticketType: 'Standard',
        track: 'Frontend',
        dietary: 'None',
        needAccommodation: false,
        notes: 'Quick test entry via Add Row action.',
        submittedAt: timestamp,
      });
    } else if (tab === 'userDetails') {
      const usernames = ['jordan_ops', 'sara_sec', 'leo_qa', 'priya_lead'];
      const pickedUser = usernames[Math.floor(Math.random() * usernames.length)];
      handleAddUserDetails({
        id: `usr-${Date.now()}`,
        username: pickedUser,
        fullName: pickedUser.toUpperCase() + ' Engineer',
        workEmail: `${pickedUser}@fdx-company.com`,
        department: 'Engineering',
        jobTitle: 'Software Engineer',
        accessLevel: 'Standard Member',
        region: 'North America / New York',
        twoFactorEnabled: true,
        internalNotes: 'Automated test row addition.',
        submittedAt: timestamp,
      });
    } else if (tab === 'feedback') {
      const messages = [
        'Really impressed with the speed of this form integration!',
        'Real-time spreadsheet syncing without server maintenance is great.',
        'Clean, responsive form UX.',
      ];
      handleAddFeedback({
        id: `fb-${Date.now()}`,
        customerName: 'Verified Reviewer',
        email: 'reviewer@client.io',
        category: 'UI / UX Design',
        rating: 5,
        npsScore: 10,
        feedbackMessage: messages[Math.floor(Math.random() * messages.length)],
        wouldRecommend: 'Yes',
        priority: 'Medium',
        submittedAt: timestamp,
      });
    } else {
      const cf = customForms.find((f) => f.id === tab);
      if (cf) {
        const colDefs = getOrderedColumnsForForm(cf.fields);
        handleAddCustomSubmission({
          id: `csub_${Date.now()}`,
          formId: cf.id,
          formTitle: cf.settings.title,
          sheetName: cf.settings.sheetName || 'CustomResponses',
          submittedAt: timestamp,
          columns: colDefs.map((col) => ({
            header: col.header,
            type: col.type,
            value:
              col.type === 'NUMBER'
                ? 5
                : col.type === 'BOOLEAN'
                ? true
                : col.type === 'DATE'
                ? new Date().toISOString().slice(0, 10)
                : col.type === 'TIME'
                ? '10:30'
                : col.type === 'DATETIME'
                ? new Date().toISOString().slice(0, 16).replace('T', ' ')
                : col.type === 'FILE URL' || col.type === 'IMAGE URL'
                ? 'https://drive.google.com/file/d/sample_upload/view'
                : 'Sample Entry',
          })),
          rawValues: {},
        });
      }
    }
  };

  const handleExportAllCSV = () => {
    const lines = [
      '--- REGISTRATIONS ---',
      'Timestamp,Full Name,Email,Phone,Organization,Ticket Type,Track,Dietary,Accommodation,Notes',
      ...registrations.map(
        (r) =>
          `"${r.submittedAt}","${r.fullName}","${r.email}","${r.phone || ''}","${r.organization || ''}","${r.ticketType}","${r.track}","${r.dietary}","${r.needAccommodation ? 'Yes' : 'No'}","${(r.notes || '').replace(/"/g, '""')}"`
      ),
      '',
      '--- USER DETAILS ---',
      'Timestamp,Username,Full Name,Work Email,Department,Job Title,Access Level,Region,2FA Enforced,Internal Notes',
      ...userDetails.map(
        (u) =>
          `"${u.submittedAt}","${u.username}","${u.fullName}","${u.workEmail}","${u.department}","${u.jobTitle || ''}","${u.accessLevel}","${u.region}","${u.twoFactorEnabled ? 'Yes' : 'No'}","${(u.internalNotes || '').replace(/"/g, '""')}"`
      ),
      '',
      '--- FEEDBACKS ---',
      'Timestamp,Customer Name,Email,Category,Rating,NPS Score,Feedback Message,Recommend,Priority',
      ...feedbacks.map(
        (f) =>
          `"${f.submittedAt}","${f.customerName || ''}","${f.email}","${f.category}","${f.rating}","${f.npsScore}","${(f.feedbackMessage || '').replace(/"/g, '""')}","${f.wouldRecommend}","${f.priority}"`
      ),
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `f-docx_all_submissions_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const totalSubmissions =
    registrations.length + userDetails.length + feedbacks.length + customSubmissions.length;

  const [pingTesting, setPingTesting] = useState(false);
  const [pingFeedback, setPingFeedback] = useState<{ status: 'success' | 'error'; message: string } | null>(null);

  const handleUpdateEndpoint = (newUrl: string) => {
    setWebAppConfig((prev) => ({
      ...prev,
      scriptUrl: newUrl.trim(),
      syncToRealSheet: !!newUrl.trim(),
    }));
  };

  const handleTestPing = async () => {
    if (!webAppConfig.scriptUrl?.trim()) {
      setPingFeedback({
        status: 'error',
        message: 'No endpoint URL configured. Enter a valid Google Apps Script or Webhook URL.',
      });
      return;
    }

    setPingTesting(true);
    setPingFeedback(null);

    try {
      const diagRes = await fetch('/api/ping-endpoint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webAppConfig.scriptUrl.trim(),
          payload: {
            formType: 'registration',
            fullName: 'Live Sync Ping Test',
            email: 'ping-test@example.com',
            organization: 'f-docx Ping Suite',
            notes: 'Test ping to verify spreadsheet append.',
            submittedAt: new Date().toLocaleString(),
          },
        }),
      });

      if (diagRes.ok) {
        const diagData = await diagRes.json();
        setPingFeedback({
          status: diagData.success ? 'success' : 'error',
          message: diagData.message || (diagData.success ? 'Ping verified!' : 'Ping failed'),
        });
        return;
      }
    } catch {
      // Fallback to client fetch
    }

    try {
      await fetch(webAppConfig.scriptUrl.trim(), {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          formType: 'registration',
          fullName: 'Live Sync Ping Test',
          email: 'ping-test@example.com',
          organization: 'f-docx Ping Suite',
          notes: 'Test ping to verify spreadsheet append.',
          submittedAt: new Date().toLocaleString(),
        }),
      });

      setPingFeedback({
        status: 'success',
        message: 'Ping dispatched! Check your Google Sheet to verify the new row appeared.',
      });
    } catch (err: any) {
      setPingFeedback({
        status: 'error',
        message: `Ping failed: ${err.message || 'Network blocked'}`,
      });
    } finally {
      setPingTesting(false);
      setTimeout(() => setPingFeedback(null), 8000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900 font-sans">
      {/* Top Navbar */}
      <Navbar
        activeNavTab={activeNavTab}
        onSelectNavTab={(tab) => {
          setActiveNavTab(tab);
          if (tab === 'sheet') {
            setActiveSheetTab(activeFormTab);
          }
        }}
        activeFormTab={activeFormTab}
        onSelectFormTab={(tab) => {
          setActiveFormTab(tab);
          setActiveSheetTab(tab);
        }}
        webAppConfig={webAppConfig}
        onOpenConfigModal={() => setIsConfigModalOpen(true)}
        totalSubmissions={totalSubmissions}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Banner: Visual Flow Architecture (Shown in Forms tab) */}
        {activeNavTab === 'forms' && (
          <div className="space-y-4 mb-6">
            <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white rounded-2xl p-5 sm:p-6 shadow-sm border border-emerald-900/40">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 mb-2">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    f-docx Live Form Sync
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight">
                    HTML Form to Google Sheets Automation Engine
                  </h1>
                  <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-2xl leading-relaxed">
                    Submit any of the 3 menu forms below. Every submission instantly maps fields and appends a row to your connected Google Sheet.
                  </p>
                </div>

                {/* Data Flow Diagram + Builder CTA */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 self-start lg:self-auto shrink-0">
                  <div className="flex items-center gap-2 sm:gap-3 text-xs bg-slate-800/80 p-3 rounded-xl border border-slate-700/60 font-medium">
                    <div className="flex items-center gap-1.5 text-emerald-300">
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span>HTML Form</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    <div className="flex items-center gap-1.5 text-amber-300">
                      <Zap className="w-3.5 h-3.5" />
                      <span>Endpoint Sync</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500" />
                    <div className="flex items-center gap-1.5 text-emerald-400">
                      <FileSpreadsheet className="w-3.5 h-3.5" />
                      <span>Google Sheets Row</span>
                    </div>
                  </div>
                  <button
                    onClick={() => setActiveNavTab('builder')}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-sm transition-colors cursor-pointer"
                  >
                    <Layers className="w-3.5 h-3.5" />
                    <span>Open Form Builder</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Dynamic Real-time Connected Endpoint Quick Bar */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Connected Endpoint URL (Dynamically updates in real-time)
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      value={webAppConfig.scriptUrl}
                      onChange={(e) => handleUpdateEndpoint(e.target.value)}
                      placeholder="Paste your Google Apps Script or Webhook URL here..."
                      className="w-full px-3 py-1.5 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
                    />
                    {webAppConfig.scriptUrl?.endsWith('/dev') && (
                      <button
                        type="button"
                        onClick={() => handleUpdateEndpoint(webAppConfig.scriptUrl.replace(/\/dev$/, '/exec'))}
                        className="shrink-0 px-2.5 py-1.5 text-xs font-semibold bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg border border-amber-300 transition-colors cursor-pointer"
                        title="Switch to public /exec URL"
                      >
                        Switch to /exec
                      </button>
                    )}
                    {webAppConfig.scriptUrl?.endsWith('/exec') && (
                      <button
                        type="button"
                        onClick={() => handleUpdateEndpoint(webAppConfig.scriptUrl.replace(/\/exec$/, '/dev'))}
                        className="shrink-0 px-2.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-300 transition-colors cursor-pointer"
                        title="Switch to developer /dev URL"
                      >
                        Switch to /dev
                      </button>
                    )}
                  </div>
                  {webAppConfig.scriptUrl?.endsWith('/dev') && (
                    <p className="text-[11px] text-amber-700 mt-1 flex items-center gap-1">
                      <span>💡 <strong>Tip:</strong> <code className="bg-amber-100 px-1 rounded text-[10px]">/dev</code> URLs require Google login. Click <strong>Switch to /exec</strong> when deploying as a public Web app.</span>
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleTestPing}
                    disabled={pingTesting || !webAppConfig.scriptUrl}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 disabled:opacity-50 text-emerald-800 border border-emerald-200 transition-colors cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{pingTesting ? 'Pinging...' : 'Test Ping'}</span>
                  </button>

                  <button
                    onClick={() => handleUpdateEndpoint(DEFAULT_SCRIPT_URL)}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 border border-slate-200 transition-colors cursor-pointer"
                    title="Restore default Google Apps Script endpoint"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {pingFeedback && (
                <div
                  className={`mt-2.5 p-2.5 rounded-lg text-xs flex items-center gap-2 animate-fadeIn ${
                    pingFeedback.status === 'success'
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border border-rose-200 text-rose-800'
                  }`}
                >
                  {pingFeedback.status === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <Zap className="w-4 h-4 text-rose-600 shrink-0" />
                  )}
                  <span>{pingFeedback.message}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* View 1: Forms Playground */}
        {activeNavTab === 'forms' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Active Form */}
              <div className={splitViewMode ? 'lg:col-span-6' : 'lg:col-span-12'}>
                {activeFormTab === 'registration' && (
                  <RegistrationForm
                    onAddRegistration={handleAddRegistration}
                    webAppConfig={webAppConfig}
                  />
                )}
                {activeFormTab === 'userDetails' && (
                  <UserDetailsForm
                    onAddUserDetails={handleAddUserDetails}
                    webAppConfig={webAppConfig}
                  />
                )}
                {activeFormTab === 'feedback' && (
                  <FeedbackForm
                    onAddFeedback={handleAddFeedback}
                    webAppConfig={webAppConfig}
                  />
                )}
              </div>

              {/* Right Column: Google Sheet Simulator */}
              <div className={splitViewMode ? 'lg:col-span-6' : 'lg:col-span-12'}>
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Live Synchronized Spreadsheet
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                      Real-time
                    </span>
                  </div>
                  <button
                    onClick={() => setSplitViewMode(!splitViewMode)}
                    className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 font-medium cursor-pointer"
                    title="Toggle split view"
                  >
                    <Split className="w-3.5 h-3.5" />
                    <span>{splitViewMode ? 'Expand Form' : 'Show Split View'}</span>
                  </button>
                </div>

                <GoogleSheetSimulator
                  registrations={registrations}
                  userDetails={userDetails}
                  feedbacks={feedbacks}
                  customForms={customForms}
                  customSubmissions={customSubmissions}
                  activeSheetTab={activeSheetTab}
                  onSelectTab={(tab) => {
                    setActiveSheetTab(tab);
                    if (tab === 'registration' || tab === 'userDetails' || tab === 'feedback') {
                      setActiveFormTab(tab);
                    }
                  }}
                  onClearCurrentSheet={handleClearCurrentSheet}
                  onAddDummyRow={handleAddDummyRow}
                />
              </div>
            </div>
          </div>
        )}

        {/* View 1B: Dynamic Form Builder & Customizer */}
        {activeNavTab === 'builder' && (
          <FormBuilderWorkspace
            forms={customForms}
            activeFormId={activeCustomFormId}
            webAppConfig={webAppConfig}
            onSelectFormId={setActiveCustomFormId}
            onSaveForms={setCustomForms}
            onSubmitCustomForm={handleAddCustomSubmission}
            onOpenSheetView={(sheetNameOrId) => {
              const found = customForms.find(
                (f) => f.id === sheetNameOrId || f.settings.sheetName === sheetNameOrId
              );
              setActiveSheetTab(found ? found.id : activeCustomFormId);
              setActiveNavTab('sheet');
            }}
          />
        )}

        {/* View 2: Standalone Full-Width Google Sheet DB */}
        {activeNavTab === 'sheet' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Google Sheet Database Viewer
                </h2>
                <p className="text-xs text-slate-500">
                  Full-screen view of your active Google Sheets database with tabs for built-in and custom forms.
                </p>
              </div>

              <button
                onClick={() => setActiveNavTab('forms')}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer shadow-xs"
              >
                <span>← Back to Forms</span>
              </button>
            </div>

            <GoogleSheetSimulator
              registrations={registrations}
              userDetails={userDetails}
              feedbacks={feedbacks}
              customForms={customForms}
              customSubmissions={customSubmissions}
              activeSheetTab={activeSheetTab}
              onSelectTab={setActiveSheetTab}
              onClearCurrentSheet={handleClearCurrentSheet}
              onAddDummyRow={handleAddDummyRow}
            />
          </div>
        )}

        {/* View 3: Submissions Analytics & Activity Feed */}
        {activeNavTab === 'analytics' && (
          <AnalyticsHub
            registrations={registrations}
            userDetails={userDetails}
            feedbacks={feedbacks}
            onExportAllCSV={handleExportAllCSV}
          />
        )}

        {/* View 4: Webhook & Spreadsheet Integrations */}
        {activeNavTab === 'integrations' && (
          <IntegrationsHub
            webAppConfig={webAppConfig}
            onSaveConfig={setWebAppConfig}
            onUpdateUrl={handleUpdateEndpoint}
          />
        )}

        {/* View 5: GitHub "f-docx" Project Hub & ZIP Exporter */}
        {activeNavTab === 'github' && (
          <GithubProjectHub scriptUrl={webAppConfig.scriptUrl} />
        )}
      </main>

      {/* Live Endpoint Configuration Modal */}
      <LiveConfigModal
        isOpen={isConfigModalOpen}
        onClose={() => setIsConfigModalOpen(false)}
        config={webAppConfig}
        onSaveConfig={setWebAppConfig}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 font-mono">f-docx</span>
            <span>•</span>
            <span>Connect HTML Forms directly to Google Sheets</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-medium text-slate-600">
            <button
              onClick={() => setActiveNavTab('forms')}
              className="hover:text-emerald-700 cursor-pointer"
            >
              Forms
            </button>
            <button
              onClick={() => setActiveNavTab('builder')}
              className="hover:text-emerald-700 cursor-pointer"
            >
              Form Builder
            </button>
            <button
              onClick={() => setActiveNavTab('sheet')}
              className="hover:text-emerald-700 cursor-pointer"
            >
              Google Sheet DB
            </button>
            <button
              onClick={() => setActiveNavTab('analytics')}
              className="hover:text-emerald-700 cursor-pointer"
            >
              Analytics
            </button>
            <button
              onClick={() => setActiveNavTab('integrations')}
              className="hover:text-emerald-700 cursor-pointer"
            >
              Integrations
            </button>
            <button
              onClick={() => setActiveNavTab('github')}
              className="hover:text-emerald-700 cursor-pointer"
            >
              GitHub Project
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

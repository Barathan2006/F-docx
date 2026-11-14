import React, { useEffect, useState } from 'react';
import {
  FormAccessMode,
  FormResponseRecord,
  ManagedFormRecord,
  SpreadsheetSummary,
} from '../../types';
import { apiDownloadFile, apiRequest } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import {
  createBlankCustomForm,
  getOrderedColumnsForForm,
} from '../../data/formBuilderCatalog';
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Eye,
  FileSpreadsheet,
  Globe,
  Link2,
  Lock,
  Pencil,
  Plus,
  RefreshCw,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  Unlink,
  Users,
  X,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from 'lucide-react';

interface Props {
  onEditFormInBuilder: (form: ManagedFormRecord) => void;
  onOpenPublicPreview: (publicToken: string) => void;
}

export const UserFormsDashboard: React.FC<Props> = ({
  onEditFormInBuilder,
  onOpenPublicPreview,
}) => {
  const {
    user,
    googleSheetsStatus,
    connectGoogleSheets,
    disconnectGoogleSheets,
    refreshGoogleSheetsStatus,
  } = useAuth();

  const [forms, setForms] = useState<ManagedFormRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Access & Sheets Settings Modal
  const [settingsForm, setSettingsForm] = useState<ManagedFormRecord | null>(null);
  const [accessMode, setAccessMode] = useState<FormAccessMode>('PUBLIC_ANONYMOUS');
  const [onePerUser, setOnePerUser] = useState(false);
  const [expiresAt, setExpiresAt] = useState('');
  const [maxResponses, setMaxResponses] = useState('');
  const [submissionsEnabled, setSubmissionsEnabled] = useState(true);
  const [appsScriptUrl, setAppsScriptUrl] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

  // Google Sheets Picker
  const [spreadsheets, setSpreadsheets] = useState<SpreadsheetSummary[]>([]);
  const [loadingSheets, setLoadingSheets] = useState(false);
  const [creatingSheet, setCreatingSheet] = useState(false);
  const [newSheetTitle, setNewSheetTitle] = useState('');
  const [sheetsError, setSheetsError] = useState<string | null>(null);

  // Responses Modal
  const [responsesModalForm, setResponsesModalForm] = useState<ManagedFormRecord | null>(null);
  const [responses, setResponses] = useState<FormResponseRecord[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const loadForms = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiRequest<{ forms: ManagedFormRecord[] }>('/api/forms');
      setForms(res.forms);
    } catch (err: any) {
      setError(err?.message || 'Could not load your forms.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadForms();
  }, [user?.id]);

  const handleCreateForm = async () => {
    try {
      const blank = createBlankCustomForm(`Form ${forms.length + 1}`);
      const res = await apiRequest<{ form: ManagedFormRecord }>('/api/forms', {
        method: 'POST',
        body: JSON.stringify({
          settings: blank.settings,
          fields: blank.fields,
          status: 'DRAFT',
        }),
      });
      setForms((prev) => [res.form, ...prev]);
      onEditFormInBuilder(res.form);
    } catch (err: any) {
      setError(err?.message || 'Failed to create form.');
    }
  };

  const handleTogglePublish = async (form: ManagedFormRecord) => {
    try {
      const endpoint =
        form.status === 'PUBLISHED'
          ? `/api/forms/${form.id}/unpublish`
          : `/api/forms/${form.id}/publish`;
      const res = await apiRequest<{ form: ManagedFormRecord }>(endpoint, { method: 'POST' });
      setForms((prev) => prev.map((f) => (f.id === form.id ? res.form : f)));
      showToast(
        res.form.status === 'PUBLISHED'
          ? `"${res.form.title}" is now published and accepting responses.`
          : `"${res.form.title}" moved to Draft.`
      );
    } catch (err: any) {
      setError(err?.message || 'Could not change publication state.');
    }
  };

  const handleDuplicate = async (form: ManagedFormRecord) => {
    try {
      const res = await apiRequest<{ form: ManagedFormRecord }>(
        `/api/forms/${form.id}/duplicate`,
        { method: 'POST' }
      );
      setForms((prev) => [res.form, ...prev]);
      showToast(`Duplicated "${form.title}" as draft.`);
    } catch (err: any) {
      setError(err?.message || 'Failed to duplicate form.');
    }
  };

  const handleDelete = async (formId: string) => {
    try {
      await apiRequest(`/api/forms/${formId}`, { method: 'DELETE' });
      setForms((prev) => prev.filter((f) => f.id !== formId));
      setConfirmDeleteId(null);
      showToast('Form and its responses deleted.');
    } catch (err: any) {
      setError(err?.message || 'Failed to delete form.');
    }
  };

  const getPublicUrl = (token: string) => `${window.location.origin}/forms/${token}`;

  const handleCopyPublicUrl = (form: ManagedFormRecord) => {
    navigator.clipboard.writeText(getPublicUrl(form.publicToken));
    setCopiedId(form.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openSettingsModal = async (form: ManagedFormRecord) => {
    setSettingsForm(form);
    setAccessMode(form.accessMode);
    setOnePerUser(form.oneResponsePerUser);
    setExpiresAt(form.expiresAt ? form.expiresAt.slice(0, 16) : '');
    setMaxResponses(form.maxResponses ? String(form.maxResponses) : '');
    setSubmissionsEnabled(form.submissionsEnabled);
    setAppsScriptUrl(form.appsScriptUrl || '');
    setNewSheetTitle(`${form.title} Responses`);
    setSheetsError(null);

    if (googleSheetsStatus.connected) {
      fetchSpreadsheetsList();
    }
  };

  const fetchSpreadsheetsList = async () => {
    setLoadingSheets(true);
    setSheetsError(null);
    try {
      const res = await apiRequest<{ spreadsheets: SpreadsheetSummary[] }>(
        '/api/integrations/google/spreadsheets'
      );
      setSpreadsheets(res.spreadsheets);
    } catch (err: any) {
      setSheetsError(err?.message || 'Failed to load Google Spreadsheets.');
      if (err?.code === 'NEEDS_REAUTH') {
        await refreshGoogleSheetsStatus();
      }
    } finally {
      setLoadingSheets(false);
    }
  };

  const handleSaveAccessSettings = async () => {
    if (!settingsForm) return;
    setSavingSettings(true);
    try {
      const res = await apiRequest<{ form: ManagedFormRecord }>(
        `/api/forms/${settingsForm.id}/access-settings`,
        {
          method: 'PATCH',
          body: JSON.stringify({
            accessMode,
            oneResponsePerUser: onePerUser,
            expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
            maxResponses: maxResponses ? Number(maxResponses) : null,
            submissionsEnabled,
            appsScriptUrl: appsScriptUrl.trim() || null,
          }),
        }
      );
      setForms((prev) => prev.map((f) => (f.id === res.form.id ? res.form : f)));
      setSettingsForm(null);
      showToast('Form access settings saved.');
    } catch (err: any) {
      setSheetsError(err?.message || 'Could not update access settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCreateAndLinkSpreadsheet = async () => {
    if (!settingsForm) return;
    setCreatingSheet(true);
    setSheetsError(null);
    try {
      const orderedCols = getOrderedColumnsForForm(settingsForm.fields);
      const headers = ['Submission ID', 'Submitted At', 'Respondent', ...orderedCols.map((c) => c.header)];
      const created = await apiRequest<{
        spreadsheetId: string;
        spreadsheetName: string;
        spreadsheetUrl: string;
      }>('/api/integrations/google/spreadsheets/create', {
        method: 'POST',
        body: JSON.stringify({
          title: newSheetTitle || `${settingsForm.title} Responses`,
          sheetName: settingsForm.sheetName || 'Responses',
          headers,
        }),
      });

      const linked = await apiRequest<{ form: ManagedFormRecord }>(
        `/api/forms/${settingsForm.id}/sheets-link`,
        {
          method: 'POST',
          body: JSON.stringify({
            spreadsheetId: created.spreadsheetId,
            spreadsheetName: created.spreadsheetName,
            sheetName: settingsForm.sheetName || 'Responses',
          }),
        }
      );
      setForms((prev) => prev.map((f) => (f.id === linked.form.id ? linked.form : f)));
      setSettingsForm(linked.form);
      await fetchSpreadsheetsList();
      showToast(`Created and linked Google Sheet "${created.spreadsheetName}".`);
    } catch (err: any) {
      setSheetsError(err?.message || 'Failed to create spreadsheet.');
    } finally {
      setCreatingSheet(false);
    }
  };

  const handleLinkExistingSpreadsheet = async (sheet: SpreadsheetSummary | null) => {
    if (!settingsForm) return;
    try {
      const linked = await apiRequest<{ form: ManagedFormRecord }>(
        `/api/forms/${settingsForm.id}/sheets-link`,
        {
          method: 'POST',
          body: JSON.stringify({
            spreadsheetId: sheet ? sheet.id : null,
            spreadsheetName: sheet ? sheet.name : null,
            sheetName: settingsForm.sheetName || 'Responses',
          }),
        }
      );
      setForms((prev) => prev.map((f) => (f.id === linked.form.id ? linked.form : f)));
      setSettingsForm(linked.form);
      showToast(sheet ? `Linked "${sheet.name}".` : 'Unlinked Google Sheet.');
    } catch (err: any) {
      setSheetsError(err?.message || 'Failed to update linked spreadsheet.');
    }
  };

  const openResponsesModal = async (form: ManagedFormRecord) => {
    setResponsesModalForm(form);
    setLoadingResponses(true);
    try {
      const res = await apiRequest<{ responses: FormResponseRecord[] }>(
        `/api/forms/${form.id}/responses`
      );
      setResponses(res.responses);
    } catch (err: any) {
      setError(err?.message || 'Could not load responses.');
    } finally {
      setLoadingResponses(false);
    }
  };

  const publishedCount = forms.filter((f) => f.status === 'PUBLISHED').length;
  const totalResponses = forms.reduce((acc, f) => acc + (f.responseCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Personal Form Workspace ({user?.role})</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            My Forms & Public Sharing
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Create custom forms, publish secure respondent links, connect Google Sheets, and export responses.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs">
            <span className="text-slate-500">Forms:</span>{' '}
            <strong className="text-slate-900">{forms.length}</strong>
            <span className="mx-2 text-slate-300">|</span>
            <span className="text-slate-500">Published:</span>{' '}
            <strong className="text-emerald-700">{publishedCount}</strong>
            <span className="mx-2 text-slate-300">|</span>
            <span className="text-slate-500">Responses:</span>{' '}
            <strong className="text-slate-900">{totalResponses}</strong>
          </div>

          <button
            type="button"
            onClick={handleCreateForm}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Form</span>
          </button>
        </div>
      </div>

      {/* Separate Google Sheets Account Connection Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              googleSheetsStatus.connected
                ? 'bg-emerald-100 text-emerald-700'
                : googleSheetsStatus.tokenStatus === 'NEEDS_REAUTH'
                ? 'bg-amber-100 text-amber-700'
                : 'bg-slate-100 text-slate-500'
            }`}
          >
            <FileSpreadsheet className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900">
                Google Sheets & Drive Integration
              </h3>
              <span
                className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                  googleSheetsStatus.connected
                    ? 'bg-emerald-100 text-emerald-800'
                    : googleSheetsStatus.tokenStatus === 'NEEDS_REAUTH'
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-100 text-slate-600'
                }`}
              >
                {googleSheetsStatus.connected
                  ? 'Connected'
                  : googleSheetsStatus.tokenStatus === 'NEEDS_REAUTH'
                  ? 'Reconnect Required'
                  : 'Not Connected'}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              {googleSheetsStatus.connected
                ? `Authorized for ${googleSheetsStatus.googleEmail}. Tokens are encrypted server-side and can be linked to any form.`
                : 'Connect your Google Sheets account separately from login to create destination spreadsheets and sync responses automatically.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {googleSheetsStatus.connected ? (
            <button
              type="button"
              onClick={disconnectGoogleSheets}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 cursor-pointer"
            >
              <Unlink className="w-3.5 h-3.5" />
              <span>Disconnect Google Sheets</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={async () => {
                try {
                  await connectGoogleSheets();
                  showToast('Google Sheets & Drive account connected.');
                } catch (err: any) {
                  setError(err?.message || 'Google Sheets authorization failed.');
                }
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white cursor-pointer"
            >
              <Link2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>
                {googleSheetsStatus.tokenStatus === 'NEEDS_REAUTH'
                  ? 'Reconnect Google Sheets'
                  : 'Connect Google Sheets'}
              </span>
            </button>
          )}
        </div>
      </div>

      {toast && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-500 hover:text-rose-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Forms Grid */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
          <span>Loading your forms...</span>
        </div>
      ) : forms.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3">
          <FileSpreadsheet className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No saved forms yet</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Click "Create New Form" to launch the 27-component Form Builder, save your form, and generate a shareable public link.
          </p>
          <button
            type="button"
            onClick={handleCreateForm}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Your First Form</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {forms.map((form) => (
            <div
              key={form.id}
              className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-xs flex flex-col justify-between gap-4"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase ${
                          form.status === 'PUBLISHED'
                            ? 'bg-emerald-100 text-emerald-800'
                            : form.status === 'SUSPENDED'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {form.status}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                        {form.accessMode === 'REQUIRE_LOGIN' ? (
                          <>
                            <Lock className="w-2.5 h-2.5" /> Google Login
                          </>
                        ) : (
                          <>
                            <Globe className="w-2.5 h-2.5" /> Public Link
                          </>
                        )}
                      </span>
                      {form.spreadsheetName && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <FileSpreadsheet className="w-2.5 h-2.5" /> {form.spreadsheetName}
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 mt-1.5">{form.title}</h3>
                    {form.description && (
                      <p className="text-xs text-slate-500 line-clamp-2 mt-0.5">
                        {form.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Public URL Box when published */}
                {form.status === 'PUBLISHED' && (
                  <div className="p-2.5 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between gap-2">
                    <code className="text-[11px] font-mono text-emerald-900 truncate">
                      {getPublicUrl(form.publicToken)}
                    </code>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleCopyPublicUrl(form)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-semibold cursor-pointer"
                      >
                        {copiedId === form.id ? (
                          <>
                            <Check className="w-3 h-3" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copy Link
                          </>
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenPublicPreview(form.publicToken)}
                        className="p-1.5 rounded-lg bg-white border border-emerald-200 text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                        title="Open Public Form"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-4 text-[11px] text-slate-500">
                  <span>{form.fields.length} components</span>
                  <span>•</span>
                  <span className="font-semibold text-slate-700">
                    {form.responseCount} responses
                  </span>
                  <span>•</span>
                  <span>Updated {new Date(form.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onEditFormInBuilder(form)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer"
                  >
                    <Pencil className="w-3 h-3" />
                    <span>Edit</span>
                  </button>

                  {form.status !== 'SUSPENDED' && (
                    <button
                      type="button"
                      onClick={() => handleTogglePublish(form)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                        form.status === 'PUBLISHED'
                          ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                      }`}
                    >
                      <Globe className="w-3 h-3" />
                      <span>{form.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => openResponsesModal(form)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 cursor-pointer"
                  >
                    <Users className="w-3 h-3" />
                    <span>Responses ({form.responseCount})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openSettingsModal(form)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 cursor-pointer"
                  >
                    <Settings className="w-3 h-3" />
                    <span>Access & Sheets</span>
                  </button>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleDuplicate(form)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 cursor-pointer"
                    title="Duplicate form"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  {confirmDeleteId === form.id ? (
                    <div className="inline-flex items-center gap-1 bg-rose-50 px-2 py-1 rounded-lg border border-rose-200 text-[11px]">
                      <button
                        type="button"
                        onClick={() => handleDelete(form.id)}
                        className="font-bold text-rose-700 hover:underline cursor-pointer"
                      >
                        Confirm Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="text-slate-500 ml-1 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(form.id)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                      title="Delete form"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Access Settings & Google Sheets Link Modal */}
      {settingsForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Access Control & Google Sheets Destination
                </h3>
                <p className="text-xs text-slate-500">{settingsForm.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setSettingsForm(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              {/* Public Access Settings */}
              <div className="space-y-3">
                <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                  Public Form Access Settings
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      Authentication Requirement
                    </label>
                    <select
                      value={accessMode}
                      onChange={(e) => setAccessMode(e.target.value as FormAccessMode)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-white"
                    >
                      <option value="PUBLIC_ANONYMOUS">Public access without login</option>
                      <option value="REQUIRE_LOGIN">Require Google Login</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      Form Expiration Date & Time
                    </label>
                    <input
                      type="datetime-local"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      Maximum Response Count
                    </label>
                    <input
                      type="number"
                      min={1}
                      placeholder="Unlimited"
                      value={maxResponses}
                      onChange={(e) => setMaxResponses(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-600 mb-1">
                      Optional Apps Script Webhook URL
                    </label>
                    <input
                      type="url"
                      placeholder="https://script.google.com/macros/s/.../exec"
                      value={appsScriptUrl}
                      onChange={(e) => setAppsScriptUrl(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 pt-1">
                  <label className="inline-flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={onePerUser}
                      onChange={(e) => setOnePerUser(e.target.checked)}
                      className="w-4 h-4 accent-emerald-600 rounded"
                    />
                    <span>Limit to 1 response per authenticated user</span>
                  </label>

                  <label className="inline-flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={submissionsEnabled}
                      onChange={(e) => setSubmissionsEnabled(e.target.checked)}
                      className="w-4 h-4 accent-emerald-600 rounded"
                    />
                    <span>Accepting submissions</span>
                  </label>
                </div>
              </div>

              {/* Google Sheets OAuth Destination */}
              <div className="pt-4 border-t border-slate-100 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Google Sheets Destination (OAuth API)
                  </h4>
                  {googleSheetsStatus.connected && (
                    <button
                      type="button"
                      onClick={fetchSpreadsheetsList}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:underline cursor-pointer"
                    >
                      <RefreshCw className={`w-3 h-3 ${loadingSheets ? 'animate-spin' : ''}`} />
                      <span>Refresh Spreadsheets</span>
                    </button>
                  )}
                </div>

                {sheetsError && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900">
                    {sheetsError}
                  </div>
                )}

                {settingsForm.spreadsheetId && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-emerald-900">
                        Linked Sheet: {settingsForm.spreadsheetName}
                      </div>
                      <div className="text-[11px] font-mono text-emerald-700">
                        Tab: {settingsForm.sheetName} • ID: {settingsForm.spreadsheetId}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleLinkExistingSpreadsheet(null)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-emerald-300 text-rose-700 font-semibold cursor-pointer"
                    >
                      Unlink
                    </button>
                  </div>
                )}

                {!googleSheetsStatus.connected ? (
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                    <p className="text-slate-600">
                      Connect your Google Sheets account to pick an existing spreadsheet or create a new one with mapped columns.
                    </p>
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await connectGoogleSheets();
                          await fetchSpreadsheetsList();
                        } catch (err: any) {
                          setSheetsError(err?.message || 'Could not connect.');
                        }
                      }}
                      className="shrink-0 px-3.5 py-2 rounded-xl bg-slate-900 text-white font-semibold cursor-pointer"
                    >
                      Connect Google Sheets
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newSheetTitle}
                        onChange={(e) => setNewSheetTitle(e.target.value)}
                        placeholder="New spreadsheet title..."
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-xl"
                      />
                      <button
                        type="button"
                        disabled={creatingSheet}
                        onClick={handleCreateAndLinkSpreadsheet}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:opacity-60 cursor-pointer"
                      >
                        {creatingSheet ? 'Creating...' : 'Create & Link Sheet'}
                      </button>
                    </div>

                    {spreadsheets.length > 0 && (
                      <div>
                        <label className="block font-semibold text-slate-600 mb-1">
                          Or select an existing Google Spreadsheet:
                        </label>
                        <div className="max-h-40 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100">
                          {spreadsheets.map((s) => (
                            <div
                              key={s.id}
                              className="px-3 py-2 flex items-center justify-between hover:bg-slate-50"
                            >
                              <span className="font-medium text-slate-800 truncate">{s.name}</span>
                              <button
                                type="button"
                                onClick={() => handleLinkExistingSpreadsheet(s)}
                                className="px-2.5 py-1 rounded-lg bg-slate-900 text-white text-[11px] font-semibold cursor-pointer"
                              >
                                {settingsForm.spreadsheetId === s.id ? 'Linked' : 'Select'}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setSettingsForm(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 cursor-pointer"
              >
                Close
              </button>
              <button
                type="button"
                disabled={savingSettings}
                onClick={handleSaveAccessSettings}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
              >
                {savingSettings ? 'Saving...' : 'Save Access Settings'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Responses & Export Modal */}
      {responsesModalForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Responses: {responsesModalForm.title}
                </h3>
                <p className="text-xs text-slate-500">
                  {responses.length} submissions recorded
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    apiDownloadFile(
                      `/api/forms/${responsesModalForm.id}/export?format=csv`,
                      `${responsesModalForm.title.replace(/[^a-z0-9]/gi, '_')}_responses.csv`
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Export CSV</span>
                </button>
                <button
                  type="button"
                  onClick={() =>
                    apiDownloadFile(
                      `/api/forms/${responsesModalForm.id}/export?format=xlsx`,
                      `${responsesModalForm.title.replace(/[^a-z0-9]/gi, '_')}_responses.xlsx`
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Excel (.xlsx)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setResponsesModalForm(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {loadingResponses ? (
                <div className="py-12 text-center text-xs text-slate-500">Loading responses...</div>
              ) : responses.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-500">
                  No submissions received yet. Share your public URL once published.
                </div>
              ) : (
                <div className="space-y-3">
                  {responses.map((resp) => (
                    <div
                      key={resp.id}
                      className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 text-xs"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/70 pb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-700">{resp.id}</span>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              resp.isAnonymous
                                ? 'bg-slate-200 text-slate-700'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {resp.isAnonymous
                              ? 'Anonymous Respondent'
                              : `${resp.respondentName} (${resp.respondentEmail})`}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[11px] text-slate-500">
                          <span
                            className={`px-2 py-0.5 rounded font-semibold ${
                              resp.sheetsSyncStatus === 'SYNCED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : resp.sheetsSyncStatus === 'TOKEN_EXPIRED'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            Sheets: {resp.sheetsSyncStatus}
                          </span>
                          <span>{new Date(resp.submittedAt).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {resp.columns.map((col, idx) => (
                          <div key={idx} className="bg-white p-2 rounded-lg border border-slate-200/70">
                            <span className="block text-[10px] font-bold text-slate-400 uppercase">
                              {col.header}
                            </span>
                            <span className="text-slate-800 font-medium break-words">
                              {String(col.value ?? '') || '—'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

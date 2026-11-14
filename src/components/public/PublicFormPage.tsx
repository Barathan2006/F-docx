import React, { useEffect, useMemo, useState } from 'react';
import {
  FormAccessMode,
  FormFieldConfig,
  FormSettingsConfig,
  UploadedFilePayload,
} from '../../types';
import {
  getComponentCapabilities,
  mapSubmissionToSheetRow,
} from '../../data/formBuilderCatalog';
import { FormFieldRenderer } from '../form-builder/FormFieldRenderer';
import { apiRequest } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Flag,
  Lock,
  Send,
  ShieldCheck,
  UserCheck,
  Loader2,
  FileSpreadsheet,
} from 'lucide-react';
import { playSuccessChime } from '../../utils/audio';

interface PublicFormPayload {
  available: boolean;
  reason?: string;
  error?: string;
  title?: string;
  form?: {
    publicToken: string;
    title: string;
    description: string;
    accessMode: FormAccessMode;
    oneResponsePerUser: boolean;
    expiresAt: string | null;
    maxResponses: number | null;
    responseCount: number;
    settings: FormSettingsConfig;
    fields: FormFieldConfig[];
  };
  viewer?: {
    fullName: string;
    email: string;
    profilePictureUrl: string | null;
  } | null;
  alreadySubmitted?: boolean;
}

const WIDTH_CLASS: Record<string, string> = {
  narrow: 'max-w-lg',
  medium: 'max-w-2xl',
  wide: 'max-w-4xl',
  full: 'max-w-5xl',
};

const FONT_CSS: Record<string, string> = {
  'Plus Jakarta Sans': "'Plus Jakarta Sans', system-ui, sans-serif",
  Inter: "'Inter', system-ui, sans-serif",
  'System UI': "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  Georgia: "Georgia, 'Times New Roman', serif",
  'JetBrains Mono': "'JetBrains Mono', ui-monospace, monospace",
};

export const PublicFormPage: React.FC<{ publicToken: string }> = ({ publicToken }) => {
  const { user, loginWithGoogle } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PublicFormPayload | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  const [values, setValues] = useState<Record<string, any>>({});
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, UploadedFilePayload>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedReceipt, setSubmittedReceipt] = useState<{
    submissionId: string;
    submittedAt: string;
  } | null>(null);

  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [reportSent, setReportSent] = useState(false);

  const loadPublicForm = async () => {
    setLoading(true);
    setFetchError(null);
    try {
      const res = await apiRequest<PublicFormPayload>(
        `/api/public/forms/${encodeURIComponent(publicToken)}`
      );
      setData(res);
    } catch (err: any) {
      setFetchError(err?.message || 'This form is currently unavailable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPublicForm();
  }, [publicToken, user?.id]);

  const sortedFields = useMemo(() => {
    const raw = data?.form?.fields || [];
    return [...raw].filter((f) => f.visible !== false).sort((a, b) => a.order - b.order);
  }, [data]);

  // Apply defaults when form loads
  useEffect(() => {
    if (!sortedFields.length) return;
    setValues((prev) => {
      const next = { ...prev };
      sortedFields.forEach((f) => {
        if (next[f.id] === undefined && f.defaultValue !== undefined && f.defaultValue !== '') {
          next[f.id] = f.defaultValue;
        } else if (
          next[f.id] === undefined &&
          f.choiceConfig?.defaultSelected &&
          f.choiceConfig.defaultSelected.length > 0
        ) {
          const isMulti =
            f.type === 'checkboxes' ||
            f.type === 'multi_select' ||
            !!f.choiceConfig.allowMultiple;
          next[f.id] = isMulti
            ? f.choiceConfig.defaultSelected
            : f.choiceConfig.defaultSelected[0];
        }
      });
      return next;
    });
  }, [sortedFields]);

  const pages = useMemo(() => {
    const result: { fields: FormFieldConfig[]; breakField?: FormFieldConfig }[] = [];
    let current: FormFieldConfig[] = [];
    sortedFields.forEach((field) => {
      if (field.type === 'page_break') {
        result.push({ fields: current, breakField: field });
        current = [];
      } else {
        current.push(field);
      }
    });
    result.push({ fields: current });
    return result;
  }, [sortedFields]);

  const validateField = (field: FormFieldConfig): string | null => {
    const caps = getComponentCapabilities(field.type);
    if (!caps.isDataField || !field.visible) return null;
    const val = values[field.id];
    const customMsg = field.validation?.customErrorMessage?.trim();

    const isEmpty =
      val === undefined ||
      val === null ||
      val === '' ||
      (Array.isArray(val) && val.length === 0) ||
      (typeof val === 'object' && !Array.isArray(val) && Object.keys(val).length === 0);

    if (field.required && field.type !== 'toggle' && isEmpty) {
      return customMsg || `${field.label} is required.`;
    }
    if (isEmpty) return null;

    const strVal = String(val);
    if (field.validation?.minLength && strVal.length < field.validation.minLength) {
      return customMsg || `Minimum ${field.validation.minLength} characters required.`;
    }
    if (field.validation?.maxLength && strVal.length > field.validation.maxLength) {
      return customMsg || `Maximum ${field.validation.maxLength} characters allowed.`;
    }
    if (field.type === 'number') {
      const num = Number(val);
      if (
        field.validation?.minValue !== undefined &&
        field.validation.minValue !== '' &&
        num < Number(field.validation.minValue)
      ) {
        return customMsg || `Value must be at least ${field.validation.minValue}.`;
      }
      if (
        field.validation?.maxValue !== undefined &&
        field.validation.maxValue !== '' &&
        num > Number(field.validation.maxValue)
      ) {
        return customMsg || `Value must be at most ${field.validation.maxValue}.`;
      }
    }
    if (field.type === 'email' && field.validation?.validateEmail !== false) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strVal)) {
        return customMsg || 'Please enter a valid email address.';
      }
    }
    if (field.type === 'phone' && field.validation?.validatePhone !== false) {
      if (!/^[+\d\s().-]{7,20}$/.test(strVal)) {
        return customMsg || 'Please enter a valid phone number.';
      }
    }
    if (field.type === 'url' && field.validation?.validateUrl !== false) {
      try {
        const parsed = new URL(strVal);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          return customMsg || 'URL must start with http:// or https://';
        }
      } catch {
        return customMsg || 'Please enter a valid URL.';
      }
    }
    return null;
  };

  const validateFieldsList = (list: FormFieldConfig[]) => {
    const newErrors: Record<string, string> = {};
    list.forEach((f) => {
      const err = validateField(f);
      if (err) newErrors[f.id] = err;
    });
    setErrors((prev) => ({ ...prev, ...newErrors }));
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!data?.form) return;
    if (!validateFieldsList(sortedFields)) return;

    setSubmitting(true);
    setSubmitError(null);
    try {
      const mapped = mapSubmissionToSheetRow(
        {
          id: publicToken,
          updatedAt: new Date().toISOString(),
          settings: data.form.settings,
          fields: data.form.fields,
        },
        values,
        uploadedFiles
      );

      const res = await apiRequest<{
        success: boolean;
        submissionId: string;
        submittedAt: string;
      }>(`/api/public/forms/${encodeURIComponent(publicToken)}/submit`, {
        method: 'POST',
        body: JSON.stringify({
          columns: mapped.columns,
          rawValues: mapped.rawValues,
        }),
      });

      playSuccessChime();
      setSubmittedReceipt({
        submissionId: res.submissionId,
        submittedAt: res.submittedAt,
      });
    } catch (err: any) {
      setSubmitError(err?.message || 'Could not submit form.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest(`/api/public/forms/${encodeURIComponent(publicToken)}/report`, {
        method: 'POST',
        body: JSON.stringify({ reason: reportReason || 'Inappropriate content' }),
      });
      setReportSent(true);
      setTimeout(() => {
        setReportModalOpen(false);
        setReportSent(false);
        setReportReason('');
      }, 1500);
    } catch {}
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-600">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
          <span>Loading public form...</span>
        </div>
      </div>
    );
  }

  if (fetchError || !data?.available || !data.form) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl border border-slate-200 p-8 text-center shadow-sm space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h1 className="text-lg font-bold text-slate-900">Form Unavailable</h1>
          <p className="text-xs text-slate-600 leading-relaxed">
            {fetchError || data?.error || 'This form is no longer accepting responses.'}
          </p>
        </div>
      </div>
    );
  }

  const form = data.form;
  const settings = form.settings;
  const requiresLogin = form.accessMode === 'REQUIRE_LOGIN' || form.oneResponsePerUser;
  const needsSignIn = requiresLogin && !data.viewer;

  const getFieldWidthStyle = (field: FormFieldConfig): React.CSSProperties => {
    if (settings.sectionLayout === 'two-column' && field.width === 'full') {
      const caps = getComponentCapabilities(field.type);
      if (caps.isDataField) return { width: 'calc(50% - 0.5rem)' };
    }
    if (field.width === 'half') return { width: 'calc(50% - 0.5rem)' };
    if (field.width === 'custom') {
      const pct = Math.min(100, Math.max(25, field.customWidthPercent || 100));
      return { width: pct === 100 ? '100%' : `calc(${pct}% - 0.5rem)` };
    }
    return { width: '100%' };
  };

  const layoutCardClass =
    settings.sectionLayout === 'card'
      ? 'p-4 rounded-xl bg-white/90 shadow-xs border border-slate-200/80'
      : settings.sectionLayout === 'bordered'
      ? 'p-3.5 rounded-xl border border-slate-200'
      : '';

  const currentFields = pages[currentPage]?.fields || [];
  const isLastPage = currentPage >= pages.length - 1;

  return (
    <div className="min-h-screen bg-slate-100/80 py-8 sm:py-12 px-4 flex flex-col items-center">
      {/* Read-only top attribution bar */}
      <div className="w-full max-w-4xl mb-4 flex items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-2 font-semibold text-slate-700">
          <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
          <span className="font-mono">f-docx</span>
          <span className="text-slate-300">|</span>
          <span>Public Form</span>
        </div>
        <button
          type="button"
          onClick={() => setReportModalOpen(true)}
          className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-rose-600 cursor-pointer"
        >
          <Flag className="w-3 h-3" />
          <span>Report Form</span>
        </button>
      </div>

      {/* Form Card */}
      <div
        style={{
          backgroundColor: settings.backgroundColor || '#ffffff',
          fontFamily: FONT_CSS[settings.fontFamily] || FONT_CSS['Plus Jakarta Sans'],
        }}
        className={`w-full ${WIDTH_CLASS[settings.formWidth] || 'max-w-2xl'} rounded-2xl border border-slate-200 shadow-lg overflow-hidden`}
      >
        <div
          className="h-2 w-full"
          style={{
            background: `linear-gradient(90deg, ${settings.primaryColor || '#059669'}, ${settings.secondaryColor || '#0f172a'})`,
          }}
        />

        <div className="p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="border-b border-slate-200/70 pb-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                {form.accessMode === 'REQUIRE_LOGIN'
                  ? 'Google Sign-In Required'
                  : 'Public Access Form'}
              </span>
              {pages.length > 1 && (
                <span className="text-xs font-semibold text-slate-500">
                  Page {currentPage + 1} of {pages.length}
                </span>
              )}
            </div>
            <h1
              className="text-2xl sm:text-3xl font-extrabold tracking-tight"
              style={{ color: settings.secondaryColor || '#0f172a' }}
            >
              {form.title}
            </h1>
            {form.description && (
              <p className="text-sm text-slate-600 mt-1.5 leading-relaxed">{form.description}</p>
            )}
          </div>

          {/* Authenticated Respondent Identity Banner (automatic, non-editable) */}
          {data.viewer && (
            <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                {data.viewer.profilePictureUrl ? (
                  <img
                    src={data.viewer.profilePictureUrl}
                    alt={data.viewer.fullName}
                    className="w-7 h-7 rounded-full border border-emerald-300"
                  />
                ) : (
                  <UserCheck className="w-4 h-4 text-emerald-700" />
                )}
                <div className="truncate">
                  <span className="text-emerald-800 font-semibold">Submitting as: </span>
                  <span className="font-bold text-slate-900">{data.viewer.fullName}</span>
                  <span className="text-slate-600 ml-1">({data.viewer.email})</span>
                </div>
              </div>
              <span className="text-[10px] font-semibold text-emerald-700 shrink-0">
                Verified Google ID
              </span>
            </div>
          )}

          {/* Gate 1: Sign-In Required */}
          {needsSignIn ? (
            <div className="py-10 px-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-4">
              <div className="w-11 h-11 rounded-2xl bg-slate-900 text-white flex items-center justify-center mx-auto">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">Google Sign-In Required</h2>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  The creator of this form requires respondents to authenticate with Google before filling out or submitting responses.
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await loginWithGoogle();
                  } catch {}
                }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm cursor-pointer"
              >
                <span>Sign in with Google to Continue</span>
              </button>
            </div>
          ) : data.alreadySubmitted ? (
            <div className="py-10 px-6 rounded-2xl bg-amber-50 border border-amber-200 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-amber-600 mx-auto" />
              <h2 className="text-base font-bold text-slate-900">Response Already Recorded</h2>
              <p className="text-xs text-slate-600">
                This form allows only one response per authenticated user account.
              </p>
            </div>
          ) : submittedReceipt ? (
            <div className="py-10 px-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h2 className="text-lg font-extrabold text-slate-900">Response Submitted</h2>
              <p className="text-xs text-emerald-900 max-w-md mx-auto">
                {settings.successMessage || 'Thank you! Your response has been securely recorded.'}
              </p>
              <div className="text-[11px] font-mono text-slate-500 pt-2">
                Receipt ID: {submittedReceipt.submissionId} •{' '}
                {new Date(submittedReceipt.submittedAt).toLocaleString()}
              </div>
              {!form.oneResponsePerUser && (
                <button
                  type="button"
                  onClick={() => {
                    setSubmittedReceipt(null);
                    setValues({});
                    setUploadedFiles({});
                    setErrors({});
                    setCurrentPage(0);
                  }}
                  className="mt-2 px-4 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 cursor-pointer"
                >
                  Submit Another Response
                </button>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {submitError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium">
                  {submitError}
                </div>
              )}

              <div className="flex flex-wrap gap-4 items-start">
                {currentFields.map((field) => (
                  <div
                    key={field.id}
                    style={getFieldWidthStyle(field)}
                    className={`min-w-[200px] ${layoutCardClass}`}
                  >
                    <FormFieldRenderer
                      field={field}
                      formSettings={settings}
                      value={values[field.id]}
                      uploadedFile={uploadedFiles[field.id]}
                      error={errors[field.id]}
                      isPreviewMode={true}
                      onChange={(val) => {
                        setValues((prev) => ({ ...prev, [field.id]: val }));
                        if (errors[field.id]) {
                          setErrors((prev) => {
                            const next = { ...prev };
                            delete next[field.id];
                            return next;
                          });
                        }
                      }}
                      onFileUpload={(payload) => {
                        setUploadedFiles((prev) => {
                          const next = { ...prev };
                          if (payload) next[field.id] = payload;
                          else delete next[field.id];
                          return next;
                        });
                      }}
                      onFileValidationError={(msg) =>
                        setErrors((prev) => ({ ...prev, [field.id]: msg }))
                      }
                    />
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-slate-200/70 flex items-center justify-between gap-3">
                {currentPage > 0 ? (
                  <button
                    type="button"
                    onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>{pages[currentPage - 1]?.breakField?.layoutConfig?.prevButtonText || 'Previous'}</span>
                  </button>
                ) : (
                  <span className="text-[11px] text-slate-400">
                    Read-only respondent view
                  </span>
                )}

                {!isLastPage ? (
                  <button
                    type="button"
                    onClick={() => {
                      if (validateFieldsList(currentFields)) {
                        setCurrentPage((p) => p + 1);
                      }
                    }}
                    style={{ backgroundColor: settings.primaryColor || '#059669' }}
                    className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm cursor-pointer"
                  >
                    <span>{pages[currentPage]?.breakField?.layoutConfig?.nextButtonText || 'Next'}</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{ backgroundColor: settings.primaryColor || '#059669' }}
                    className={`inline-flex items-center gap-2 px-6 py-2.5 text-sm font-bold text-white shadow-sm disabled:opacity-60 cursor-pointer ${
                      settings.buttonStyle === 'pill' ? 'rounded-full' : 'rounded-xl'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                    <span>{submitting ? 'Submitting...' : settings.submitButtonText || 'Submit'}</span>
                  </button>
                )}
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <form
            onSubmit={handleReportSubmit}
            className="bg-white rounded-2xl border border-slate-200 max-w-md w-full p-6 space-y-4 shadow-xl"
          >
            <h3 className="text-base font-bold text-slate-900">Report Public Form</h3>
            <p className="text-xs text-slate-500">
              Flag this form for administrator review if it contains phishing, spam, or policy violations.
            </p>
            <textarea
              rows={3}
              required
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Describe the issue..."
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20"
            />
            {reportSent && (
              <p className="text-xs font-semibold text-emerald-700">
                Report submitted for administrator review.
              </p>
            )}
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setReportModalOpen(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-100 text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white cursor-pointer"
              >
                Submit Report
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

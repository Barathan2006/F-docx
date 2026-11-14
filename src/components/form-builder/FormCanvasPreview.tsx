import React, { useState, useEffect, useMemo } from 'react';
import {
  CustomFormConfig,
  CustomFormSubmission,
  FormComponentType,
  FormFieldConfig,
  UploadedFilePayload,
  WebAppConfig,
} from '../../types';
import {
  getComponentCapabilities,
  getSheetDataType,
  mapSubmissionToSheetRow,
} from '../../data/formBuilderCatalog';
import { FormFieldRenderer } from './FormFieldRenderer';
import {
  ArrowUp,
  ArrowDown,
  Copy,
  Trash2,
  GripVertical,
  EyeOff,
  CheckCircle2,
  Send,
  PlusCircle,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
} from 'lucide-react';
import { playSuccessChime } from '../../utils/audio';

interface Props {
  form: CustomFormConfig;
  selectedFieldId: string | null;
  isPreviewMode: boolean;
  webAppConfig: WebAppConfig;
  onSelectField: (fieldId: string) => void;
  onAddComponentAtEnd: (type: FormComponentType) => void;
  onDuplicateField: (fieldId: string) => void;
  onDeleteField: (fieldId: string) => void;
  onMoveField: (fieldId: string, dir: -1 | 1) => void;
  onReorderFields: (sourceId: string, targetId: string) => void;
  onSubmitCustomForm: (submission: CustomFormSubmission) => void;
}

const WIDTH_CLASS: Record<string, string> = {
  narrow: 'max-w-lg',
  medium: 'max-w-2xl',
  wide: 'max-w-4xl',
  full: 'max-w-full',
};

const FONT_CSS: Record<string, string> = {
  'Plus Jakarta Sans': "'Plus Jakarta Sans', system-ui, sans-serif",
  Inter: "'Inter', system-ui, sans-serif",
  'System UI': "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  Georgia: "Georgia, 'Times New Roman', serif",
  'JetBrains Mono': "'JetBrains Mono', ui-monospace, monospace",
};

export const FormCanvasPreview: React.FC<Props> = ({
  form,
  selectedFieldId,
  isPreviewMode,
  webAppConfig,
  onSelectField,
  onAddComponentAtEnd,
  onDuplicateField,
  onDeleteField,
  onMoveField,
  onReorderFields,
  onSubmitCustomForm,
}) => {
  const [values, setValues] = useState<Record<string, any>>({});
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, UploadedFilePayload>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [currentPage, setCurrentPage] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [draggedFieldId, setDraggedFieldId] = useState<string | null>(null);
  const [isCanvasDropTarget, setIsCanvasDropTarget] = useState(false);

  const sortedFields = useMemo(
    () => [...form.fields].sort((a, b) => a.order - b.order),
    [form.fields]
  );

  // Initialize default values whenever fields change
  useEffect(() => {
    setValues((prev) => {
      const next = { ...prev };
      sortedFields.forEach((f) => {
        if (next[f.id] === undefined && f.defaultValue !== undefined && f.defaultValue !== '') {
          next[f.id] = f.defaultValue;
        } else if (
          next[f.id] === undefined &&
          f.choiceConfig.defaultSelected &&
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

  // Split fields into pages for Preview Mode based on page_break components
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

  useEffect(() => {
    if (currentPage >= pages.length) {
      setCurrentPage(0);
    }
  }, [pages.length, currentPage]);

  const validateField = (field: FormFieldConfig): string | null => {
    const caps = getComponentCapabilities(field.type);
    if (!caps.isDataField || !field.visible) return null;

    const val = values[field.id];
    const customMsg = field.validation.customErrorMessage?.trim();

    const isEmpty =
      val === undefined ||
      val === null ||
      val === '' ||
      (Array.isArray(val) && val.length === 0) ||
      (typeof val === 'object' && !Array.isArray(val) && Object.keys(val).length === 0);

    if (field.required) {
      if (field.type === 'toggle') {
        // toggle always has boolean state
      } else if (isEmpty) {
        return customMsg || `${field.label} is required.`;
      }
    }

    if (isEmpty) return null;

    const strVal = String(val);

    if (field.validation.minLength && strVal.length < field.validation.minLength) {
      return customMsg || `Minimum ${field.validation.minLength} characters required.`;
    }
    if (field.validation.maxLength && strVal.length > field.validation.maxLength) {
      return customMsg || `Maximum ${field.validation.maxLength} characters allowed.`;
    }

    if (field.type === 'number') {
      const num = Number(val);
      if (field.validation.minValue !== undefined && field.validation.minValue !== '' && num < Number(field.validation.minValue)) {
        return customMsg || `Value must be at least ${field.validation.minValue}.`;
      }
      if (field.validation.maxValue !== undefined && field.validation.maxValue !== '' && num > Number(field.validation.maxValue)) {
        return customMsg || `Value must be at most ${field.validation.maxValue}.`;
      }
    }

    if (field.type === 'email' && field.validation.validateEmail !== false) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(strVal)) {
        return customMsg || 'Please enter a valid email address.';
      }
    }

    if (field.type === 'phone' && field.validation.validatePhone !== false) {
      if (!/^[+\d\s().-]{7,20}$/.test(strVal)) {
        return customMsg || 'Please enter a valid phone number.';
      }
    }

    if (field.type === 'url' && field.validation.validateUrl !== false) {
      try {
        const parsed = new URL(strVal);
        if (!['http:', 'https:'].includes(parsed.protocol)) {
          return customMsg || 'URL must start with http:// or https://';
        }
      } catch {
        return customMsg || 'Please enter a valid URL (e.g. https://example.com).';
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
    const visibleDataFields = sortedFields.filter((f) => f.visible);
    const valid = validateFieldsList(visibleDataFields);
    if (!valid) return;

    setSubmitting(true);
    setSubmitMessage(null);

    const mappedSubmission = mapSubmissionToSheetRow(form, values, uploadedFiles);

    if (webAppConfig.syncToRealSheet && webAppConfig.scriptUrl?.trim()) {
      try {
        await fetch(webAppConfig.scriptUrl.trim(), {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            formType: 'customForm',
            formId: form.id,
            formTitle: form.settings.title,
            sheetName: form.settings.sheetName || 'CustomResponses',
            submittedAt: mappedSubmission.submittedAt,
            headers: ['Timestamp', ...mappedSubmission.columns.map((c) => c.header)],
            rowValues: [mappedSubmission.submittedAt, ...mappedSubmission.columns.map((c) => c.value)],
            uploadedFiles: Object.values(uploadedFiles).map((uf) => ({
              columnHeader: uf.columnHeader,
              fileName: uf.fileName,
              mimeType: uf.mimeType,
              base64Data: uf.base64Data,
            })),
          }),
        });
      } catch (err) {
        console.error('Custom form real Google Sheet sync error:', err);
      }
    }

    onSubmitCustomForm(mappedSubmission);
    playSuccessChime();
    setSubmitting(false);
    setSubmitMessage(form.settings.successMessage);
    setValues({});
    setUploadedFiles({});
    setErrors({});
    setCurrentPage(0);

    setTimeout(() => setSubmitMessage(null), 7000);
  };

  const getButtonStyleProps = (variant: 'primary' | 'secondary' = 'primary'): {
    className: string;
    style: React.CSSProperties;
  } => {
    const color =
      variant === 'primary' ? form.settings.primaryColor : form.settings.secondaryColor;
    const styleType = form.settings.buttonStyle;
    const radiusCls = styleType === 'pill' ? 'rounded-full' : 'rounded-xl';

    if (styleType === 'outline') {
      return {
        className: `px-5 py-2.5 text-sm font-bold border-2 transition-all cursor-pointer ${radiusCls}`,
        style: {
          borderColor: color,
          color: color,
          backgroundColor: 'transparent',
        },
      };
    }
    if (styleType === 'soft') {
      return {
        className: `px-5 py-2.5 text-sm font-bold transition-all cursor-pointer ${radiusCls}`,
        style: {
          backgroundColor: `${color}18`,
          color: color,
        },
      };
    }
    return {
      className: `px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:opacity-95 transition-all cursor-pointer ${radiusCls}`,
      style: {
        backgroundColor: color,
      },
    };
  };

  const getFieldWidthStyle = (field: FormFieldConfig): React.CSSProperties => {
    if (form.settings.sectionLayout === 'two-column' && field.width === 'full') {
      // Allow two-column layout if user explicitly selects that form layout
      const caps = getComponentCapabilities(field.type);
      if (caps.isDataField) {
        return { width: 'calc(50% - 0.5rem)' };
      }
    }
    if (field.width === 'half') {
      return { width: 'calc(50% - 0.5rem)' };
    }
    if (field.width === 'custom') {
      const pct = Math.min(100, Math.max(25, field.customWidthPercent || 100));
      return { width: pct === 100 ? '100%' : `calc(${pct}% - 0.5rem)` };
    }
    return { width: '100%' };
  };

  const containerStyle: React.CSSProperties = {
    backgroundColor: form.settings.backgroundColor || '#ffffff',
    fontFamily: FONT_CSS[form.settings.fontFamily] || FONT_CSS['Plus Jakarta Sans'],
  };

  const layoutCardClass =
    form.settings.sectionLayout === 'card'
      ? 'p-4 rounded-xl bg-white/90 shadow-xs border border-slate-200/80'
      : form.settings.sectionLayout === 'bordered'
      ? 'p-3.5 rounded-xl border border-slate-200'
      : '';

  const fieldsToDisplay = isPreviewMode
    ? (pages[currentPage]?.fields || []).filter((f) => f.visible)
    : sortedFields;

  const isLastPage = currentPage >= pages.length - 1;
  const primaryBtn = getButtonStyleProps('primary');

  return (
    <div
      className="bg-slate-100/80 rounded-2xl border border-slate-200/90 p-3 sm:p-6 min-h-[680px] flex flex-col items-center overflow-y-auto max-h-[750px]"
      onDragOver={(e) => {
        if (!isPreviewMode) {
          e.preventDefault();
          setIsCanvasDropTarget(true);
        }
      }}
      onDragLeave={() => setIsCanvasDropTarget(false)}
      onDrop={(e) => {
        setIsCanvasDropTarget(false);
        if (isPreviewMode) return;
        const componentType = e.dataTransfer.getData('application/x-fdx-component') as FormComponentType;
        if (componentType) {
          onAddComponentAtEnd(componentType);
        }
      }}
    >
      <div
        style={containerStyle}
        className={`w-full ${WIDTH_CLASS[form.settings.formWidth] || 'max-w-2xl'} rounded-2xl border shadow-sm transition-all overflow-hidden ${
          isCanvasDropTarget ? 'ring-2 ring-emerald-500 border-emerald-400' : 'border-slate-200'
        }`}
      >
        {/* Top Accent Strip */}
        <div
          className="h-2 w-full"
          style={{
            background: `linear-gradient(90deg, ${form.settings.primaryColor}, ${form.settings.secondaryColor})`,
          }}
        />

        <form onSubmit={handleSubmit} className="p-5 sm:p-8 space-y-5">
          {/* Form Header */}
          <div className="border-b border-slate-200/70 pb-4">
            <div className="flex items-center justify-between gap-2 mb-1.5">
              <span
                className="inline-flex items-center gap-1.5 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded"
                style={{
                  backgroundColor: `${form.settings.primaryColor}15`,
                  color: form.settings.primaryColor,
                }}
              >
                <FileSpreadsheet className="w-3 h-3" />
                Sheet Tab: {form.settings.sheetName}
              </span>
              {isPreviewMode && pages.length > 1 && (
                <span className="text-xs font-semibold text-slate-500">
                  Page {currentPage + 1} of {pages.length}
                </span>
              )}
            </div>

            <h2
              className="text-xl sm:text-2xl font-extrabold tracking-tight"
              style={{ color: form.settings.secondaryColor }}
            >
              {form.settings.title || 'Untitled Form'}
            </h2>
            {form.settings.description && (
              <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                {form.settings.description}
              </p>
            )}
          </div>

          {/* Success Notification */}
          {submitMessage && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-sm flex items-start gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">Submission Recorded</div>
                <div className="text-xs text-emerald-800 mt-0.5">{submitMessage}</div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {sortedFields.length === 0 ? (
            <div className="py-14 px-6 border-2 border-dashed border-slate-200 rounded-2xl text-center bg-slate-50/60">
              <PlusCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">Your form canvas is empty</p>
              <p className="text-xs text-slate-500 mt-1">
                Click or drag any component from the left panel to start building.
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-4 items-start">
              {fieldsToDisplay.map((field) => {
                const indexInAll = sortedFields.findIndex((f) => f.id === field.id);
                const isSelected = !isPreviewMode && selectedFieldId === field.id;
                const caps = getComponentCapabilities(field.type);

                return (
                  <div
                    key={field.id}
                    style={getFieldWidthStyle(field)}
                    draggable={!isPreviewMode}
                    onDragStart={(e) => {
                      if (isPreviewMode) return;
                      setDraggedFieldId(field.id);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragOver={(e) => {
                      if (!isPreviewMode && draggedFieldId && draggedFieldId !== field.id) {
                        e.preventDefault();
                      }
                    }}
                    onDrop={(e) => {
                      if (isPreviewMode) return;
                      e.stopPropagation();
                      if (draggedFieldId && draggedFieldId !== field.id) {
                        onReorderFields(draggedFieldId, field.id);
                      }
                      setDraggedFieldId(null);
                    }}
                    onClick={() => {
                      if (!isPreviewMode) onSelectField(field.id);
                    }}
                    className={`relative group transition-all min-w-[200px] ${layoutCardClass} ${
                      !isPreviewMode
                        ? `rounded-xl p-3 border cursor-pointer ${
                            isSelected
                              ? 'ring-2 ring-emerald-500 border-emerald-400 bg-emerald-50/20'
                              : 'border-transparent hover:border-slate-300 hover:bg-slate-50/40'
                          } ${!field.visible ? 'opacity-55' : ''}`
                        : ''
                    }`}
                  >
                    {/* Editor Quick Controls */}
                    {!isPreviewMode && (
                      <div
                        className={`flex items-center justify-between gap-2 mb-1.5 pb-1 border-b border-slate-100 transition-opacity ${
                          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-500 min-w-0">
                          <GripVertical className="w-3.5 h-3.5 text-slate-400 cursor-grab shrink-0" />
                          {caps.isDataField ? (
                            <span className="truncate bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-semibold">
                              Col: {field.columnHeader} ({getSheetDataType(field.type)})
                            </span>
                          ) : (
                            <span className="truncate bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                              Layout Component
                            </span>
                          )}
                          {!field.visible && (
                            <span className="inline-flex items-center gap-0.5 text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">
                              <EyeOff className="w-2.5 h-2.5" /> Hidden
                            </span>
                          )}
                        </div>

                        <div
                          className="flex items-center gap-0.5 shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={() => onMoveField(field.id, -1)}
                            disabled={indexInAll === 0}
                            className="p-1 rounded hover:bg-slate-200/70 text-slate-500 disabled:opacity-30 cursor-pointer"
                            title="Move Up"
                          >
                            <ArrowUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onMoveField(field.id, 1)}
                            disabled={indexInAll === sortedFields.length - 1}
                            className="p-1 rounded hover:bg-slate-200/70 text-slate-500 disabled:opacity-30 cursor-pointer"
                            title="Move Down"
                          >
                            <ArrowDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDuplicateField(field.id)}
                            className="p-1 rounded hover:bg-slate-200/70 text-slate-600 cursor-pointer"
                            title="Duplicate Component"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteField(field.id)}
                            className="p-1 rounded hover:bg-rose-100 text-rose-500 cursor-pointer"
                            title="Delete Component"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    )}

                    <FormFieldRenderer
                      field={field}
                      formSettings={form.settings}
                      value={values[field.id]}
                      uploadedFile={uploadedFiles[field.id]}
                      error={errors[field.id]}
                      isPreviewMode={isPreviewMode}
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
                      onFileValidationError={(msg) => {
                        setErrors((prev) => ({ ...prev, [field.id]: msg }));
                      }}
                    />
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer Buttons */}
          {sortedFields.length > 0 && (
            <div className="pt-4 border-t border-slate-200/70 flex items-center justify-between gap-3 flex-wrap">
              {isPreviewMode && currentPage > 0 ? (
                <button
                  type="button"
                  onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>{pages[currentPage - 1]?.breakField?.layoutConfig.prevButtonText || 'Previous'}</span>
                </button>
              ) : (
                <div className="text-[11px] text-slate-400">
                  {webAppConfig.syncToRealSheet && webAppConfig.scriptUrl
                    ? 'Syncs to live Google Sheet & Simulator'
                    : 'Saves to local Google Sheet Simulator'}
                </div>
              )}

              {isPreviewMode && !isLastPage ? (
                <button
                  type="button"
                  onClick={() => {
                    const currentFields = pages[currentPage]?.fields.filter((f) => f.visible) || [];
                    if (validateFieldsList(currentFields)) {
                      setCurrentPage((p) => p + 1);
                    }
                  }}
                  className={`inline-flex items-center gap-1.5 ${primaryBtn.className}`}
                  style={primaryBtn.style}
                >
                  <span>{pages[currentPage]?.breakField?.layoutConfig.nextButtonText || 'Next'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={submitting}
                  className={`inline-flex items-center gap-2 ${primaryBtn.className}`}
                  style={primaryBtn.style}
                >
                  <Send className="w-4 h-4" />
                  <span>
                    {submitting
                      ? 'Submitting to Sheets...'
                      : form.settings.submitButtonText || 'Submit'}
                  </span>
                </button>
              )}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

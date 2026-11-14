import React, { useState, useMemo } from 'react';
import {
  CustomFormConfig,
  CustomFormSubmission,
  FormComponentType,
  FormFieldConfig,
  FormSettingsConfig,
  WebAppConfig,
} from '../../types';
import {
  createBlankCustomForm,
  createDefaultField,
  createStarterCustomForms,
  ensureUniqueColumnHeader,
  generateFieldId,
  getComponentCapabilities,
  getOrderedColumnsForForm,
} from '../../data/formBuilderCatalog';
import { ComponentPanel } from './ComponentPanel';
import { FormCanvasPreview } from './FormCanvasPreview';
import { PropertiesPanel } from './PropertiesPanel';
import {
  Eye,
  Pencil,
  Save,
  RotateCcw,
  Plus,
  Check,
  FileSpreadsheet,
  Code2,
  Trash2,
  Copy,
  X,
} from 'lucide-react';
import { APPS_SCRIPT_CODE_UNIFIED } from '../../data/defaultData';

interface Props {
  forms: CustomFormConfig[];
  activeFormId: string;
  webAppConfig: WebAppConfig;
  onSelectFormId: (formId: string) => void;
  onSaveForms: (forms: CustomFormConfig[]) => void;
  onSubmitCustomForm: (submission: CustomFormSubmission) => void;
  onOpenSheetView: (sheetName: string) => void;
}

export const FormBuilderWorkspace: React.FC<Props> = ({
  forms,
  activeFormId,
  webAppConfig,
  onSelectFormId,
  onSaveForms,
  onSubmitCustomForm,
  onOpenSheetView,
}) => {
  const activeForm = useMemo(
    () => forms.find((f) => f.id === activeFormId) || forms[0] || createStarterCustomForms()[0],
    [forms, activeFormId]
  );

  // Local draft state so user can edit and explicitly Save Form or Reset Form,
  // while keeping preview reactive immediately!
  const [draftForm, setDraftForm] = useState<CustomFormConfig>(activeForm);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(
    activeForm.fields[0]?.id || null
  );
  const [propertiesTab, setPropertiesTab] = useState<'field' | 'form'>('field');
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [saveToast, setSaveToast] = useState<string | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);
  const [isScriptModalOpen, setIsScriptModalOpen] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  // Sync draft when switching active form
  React.useEffect(() => {
    setDraftForm(activeForm);
    setSelectedFieldId(activeForm.fields[0]?.id || null);
    setConfirmResetOpen(false);
  }, [activeFormId]);

  const updateDraft = (updater: (prev: CustomFormConfig) => CustomFormConfig) => {
    setDraftForm((prev) => {
      const next = {
        ...updater(prev),
        updatedAt: new Date().toLocaleString(),
      };
      return next;
    });
  };

  const handleAddComponent = (type: FormComponentType) => {
    const newField = createDefaultField(type, draftForm.fields);
    updateDraft((prev) => ({
      ...prev,
      fields: [...prev.fields, newField],
    }));
    setSelectedFieldId(newField.id);
    setPropertiesTab('field');
    if (isPreviewMode) setIsPreviewMode(false);
  };

  const handleUpdateField = (
    fieldId: string,
    updater: (field: FormFieldConfig) => FormFieldConfig
  ) => {
    updateDraft((prev) => ({
      ...prev,
      fields: prev.fields.map((f) => (f.id === fieldId ? updater(f) : f)),
    }));
  };

  const handleDuplicateField = (fieldId: string) => {
    const source = draftForm.fields.find((f) => f.id === fieldId);
    if (!source) return;
    const newId = generateFieldId();
    const caps = getComponentCapabilities(source.type);
    const cloned: FormFieldConfig = {
      ...JSON.parse(JSON.stringify(source)),
      id: newId,
      label: `${source.label} (Copy)`,
      columnHeader: caps.isDataField
        ? ensureUniqueColumnHeader(`${source.columnHeader} Copy`, newId, draftForm.fields)
        : source.columnHeader,
    };

    const sorted = [...draftForm.fields].sort((a, b) => a.order - b.order);
    const sourceIndex = sorted.findIndex((f) => f.id === fieldId);
    sorted.splice(sourceIndex + 1, 0, cloned);
    const reindexed = sorted.map((f, idx) => ({ ...f, order: idx }));

    updateDraft((prev) => ({ ...prev, fields: reindexed }));
    setSelectedFieldId(newId);
    setPropertiesTab('field');
  };

  const handleDeleteField = (fieldId: string) => {
    const remaining = draftForm.fields
      .filter((f) => f.id !== fieldId)
      .sort((a, b) => a.order - b.order)
      .map((f, idx) => ({ ...f, order: idx }));

    updateDraft((prev) => ({ ...prev, fields: remaining }));
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(remaining[0]?.id || null);
    }
  };

  const handleMoveField = (fieldId: string, dir: -1 | 1) => {
    const sorted = [...draftForm.fields].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((f) => f.id === fieldId);
    const target = idx + dir;
    if (idx === -1 || target < 0 || target >= sorted.length) return;
    const [moved] = sorted.splice(idx, 1);
    sorted.splice(target, 0, moved);
    const reindexed = sorted.map((f, i) => ({ ...f, order: i }));
    updateDraft((prev) => ({ ...prev, fields: reindexed }));
  };

  const handleMoveFieldToOrder = (fieldId: string, targetIndex: number) => {
    const sorted = [...draftForm.fields].sort((a, b) => a.order - b.order);
    const idx = sorted.findIndex((f) => f.id === fieldId);
    if (idx === -1 || targetIndex < 0 || targetIndex >= sorted.length) return;
    const [moved] = sorted.splice(idx, 1);
    sorted.splice(targetIndex, 0, moved);
    const reindexed = sorted.map((f, i) => ({ ...f, order: i }));
    updateDraft((prev) => ({ ...prev, fields: reindexed }));
  };

  const handleReorderFields = (sourceId: string, targetId: string) => {
    const sorted = [...draftForm.fields].sort((a, b) => a.order - b.order);
    const fromIdx = sorted.findIndex((f) => f.id === sourceId);
    const toIdx = sorted.findIndex((f) => f.id === targetId);
    if (fromIdx === -1 || toIdx === -1) return;
    const [moved] = sorted.splice(fromIdx, 1);
    sorted.splice(toIdx, 0, moved);
    const reindexed = sorted.map((f, i) => ({ ...f, order: i }));
    updateDraft((prev) => ({ ...prev, fields: reindexed }));
  };

  const handleUpdateFormSettings = (
    updater: (settings: FormSettingsConfig) => FormSettingsConfig
  ) => {
    updateDraft((prev) => ({
      ...prev,
      settings: updater(prev.settings),
    }));
  };

  const handleSaveForm = () => {
    // Ensure unique column headers before saving
    const sanitizedFields: FormFieldConfig[] = [];
    [...draftForm.fields]
      .sort((a, b) => a.order - b.order)
      .forEach((f, idx) => {
        const caps = getComponentCapabilities(f.type);
        sanitizedFields.push({
          ...f,
          order: idx,
          columnHeader: caps.isDataField
            ? ensureUniqueColumnHeader(f.columnHeader || f.label, f.id, sanitizedFields)
            : f.columnHeader,
        });
      });

    const savedForm: CustomFormConfig = {
      ...draftForm,
      fields: sanitizedFields,
      updatedAt: new Date().toLocaleString(),
    };

    const exists = forms.some((f) => f.id === savedForm.id);
    const nextForms = exists
      ? forms.map((f) => (f.id === savedForm.id ? savedForm : f))
      : [...forms, savedForm];

    setDraftForm(savedForm);
    onSaveForms(nextForms);
    setSaveToast(`Saved "${savedForm.settings.title}" (${sanitizedFields.length} components)`);
    setTimeout(() => setSaveToast(null), 3500);
  };

  const handleCreateNewForm = () => {
    const created = createBlankCustomForm(`Custom Form ${forms.length + 1}`);
    const nextForms = [...forms, created];
    onSaveForms(nextForms);
    onSelectFormId(created.id);
    setDraftForm(created);
    setSelectedFieldId(null);
    setPropertiesTab('form');
    setIsPreviewMode(false);
  };

  const handleDeleteCurrentForm = () => {
    if (forms.length <= 1) return;
    const remaining = forms.filter((f) => f.id !== draftForm.id);
    onSaveForms(remaining);
    onSelectFormId(remaining[0].id);
  };

  const handleResetForm = () => {
    const starter = createStarterCustomForms()[0];
    const resetCopy: CustomFormConfig =
      draftForm.id === 'form_onboarding_starter'
        ? starter
        : createBlankCustomForm(draftForm.settings.title);
    resetCopy.id = draftForm.id;
    setDraftForm(resetCopy);
    setSelectedFieldId(resetCopy.fields[0]?.id || null);
    setConfirmResetOpen(false);
    setSaveToast('Form draft reset. Click "Save Form" to persist.');
    setTimeout(() => setSaveToast(null), 3500);
  };

  const selectedField = useMemo(
    () => draftForm.fields.find((f) => f.id === selectedFieldId) || null,
    [draftForm.fields, selectedFieldId]
  );

  const sheetColumns = useMemo(
    () => getOrderedColumnsForForm(draftForm.fields),
    [draftForm.fields]
  );

  return (
    <div className="space-y-4">
      {/* Top Action & Form Switcher Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-sm">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          {/* Left: Form Selector & Create New */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Editing Form:
            </span>
            <select
              value={draftForm.id}
              onChange={(e) => onSelectFormId(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl text-slate-800 max-w-[240px]"
            >
              {forms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.settings.title} ({f.fields.length} fields)
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleCreateNewForm}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Form</span>
            </button>

            {forms.length > 1 && (
              <button
                type="button"
                onClick={handleDeleteCurrentForm}
                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl border border-transparent hover:border-rose-200 transition-colors cursor-pointer"
                title="Delete current custom form"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right: Required Editor Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsPreviewMode(!isPreviewMode)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isPreviewMode
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
            >
              {isPreviewMode ? (
                <>
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Back to Editor</span>
                </>
              ) : (
                <>
                  <Eye className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Preview Form</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleSaveForm}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save Form</span>
            </button>

            {confirmResetOpen ? (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-xs">
                <span className="text-rose-800 font-semibold">Reset fields?</span>
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="px-2 py-0.5 rounded bg-rose-600 text-white font-semibold cursor-pointer"
                >
                  Confirm
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmResetOpen(false)}
                  className="px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600 cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmResetOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5 text-slate-500" />
                <span>Reset Form</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsScriptModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer"
            >
              <Code2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Sheets & Drive Script</span>
            </button>

            <button
              type="button"
              onClick={() => {
                handleSaveForm();
                onOpenSheetView(draftForm.settings.sheetName || 'CustomResponses');
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>View Sheet ({sheetColumns.length + 1} Cols)</span>
            </button>
          </div>
        </div>

        {saveToast && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-2 animate-fadeIn">
            <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{saveToast}</span>
          </div>
        )}
      </div>

      {/* Three-Pane Form Editor Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* 1. Component Panel */}
        {!isPreviewMode && (
          <div className="lg:col-span-3">
            <ComponentPanel onAddComponent={handleAddComponent} />
          </div>
        )}

        {/* 2. Form Preview / Canvas */}
        <div className={isPreviewMode ? 'lg:col-span-12' : 'lg:col-span-5 xl:col-span-6'}>
          <FormCanvasPreview
            form={draftForm}
            selectedFieldId={selectedFieldId}
            isPreviewMode={isPreviewMode}
            webAppConfig={webAppConfig}
            onSelectField={(id) => {
              setSelectedFieldId(id);
              setPropertiesTab('field');
            }}
            onAddComponentAtEnd={handleAddComponent}
            onDuplicateField={handleDuplicateField}
            onDeleteField={handleDeleteField}
            onMoveField={handleMoveField}
            onReorderFields={handleReorderFields}
            onSubmitCustomForm={(submission) => {
              // Ensure form exists in saved forms before recording submission
              handleSaveForm();
              onSubmitCustomForm(submission);
            }}
          />
        </div>

        {/* 3. Properties Panel */}
        {!isPreviewMode && (
          <div className="lg:col-span-4 xl:col-span-3">
            <PropertiesPanel
              selectedField={selectedField}
              allFields={draftForm.fields}
              formSettings={draftForm.settings}
              activeTab={propertiesTab}
              onChangeTab={setPropertiesTab}
              onUpdateField={handleUpdateField}
              onMoveFieldToOrder={handleMoveFieldToOrder}
              onUpdateFormSettings={handleUpdateFormSettings}
            />
          </div>
        )}
      </div>

      {/* Apps Script & Google Drive Compatibility Modal */}
      {isScriptModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Google Sheets + Drive Apps Script Endpoint
                </h3>
                <p className="text-xs text-slate-500">
                  Supports all 27 dynamic form components, column ordering, and saving uploaded files to Google Drive.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsScriptModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-slate-700">
                  Active Target Sheet Tab:{' '}
                  <code className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-mono">
                    {draftForm.settings.sheetName}
                  </code>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(APPS_SCRIPT_CODE_UNIFIED);
                    setCopiedScript(true);
                    setTimeout(() => setCopiedScript(false), 2000);
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
                >
                  {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedScript ? 'Copied Script!' : 'Copy doPost(e) Script'}</span>
                </button>
              </div>

              <pre className="p-4 rounded-xl bg-slate-900 text-slate-100 text-[11px] font-mono overflow-x-auto leading-relaxed max-h-[420px]">
                {APPS_SCRIPT_CODE_UNIFIED}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

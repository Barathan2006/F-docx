import React, { useState } from 'react';
import {
  FormFieldChoiceOption,
  FormFieldConfig,
  FormSettingsConfig,
} from '../../types';
import {
  COMPONENT_CATALOG,
  ensureUniqueColumnHeader,
  getComponentCapabilities,
  getDuplicateColumnHeaders,
  getOrderedColumnsForForm,
  getSheetDataType,
} from '../../data/formBuilderCatalog';
import {
  Sliders,
  Palette,
  FileSpreadsheet,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  AlertTriangle,
  ShieldCheck,
  ListChecks,
  Eye,
  EyeOff,
  Check,
  Sparkles,
} from 'lucide-react';

interface Props {
  selectedField: FormFieldConfig | null;
  allFields: FormFieldConfig[];
  formSettings: FormSettingsConfig;
  activeTab: 'field' | 'form';
  onChangeTab: (tab: 'field' | 'form') => void;
  onUpdateField: (fieldId: string, updater: (field: FormFieldConfig) => FormFieldConfig) => void;
  onMoveFieldToOrder: (fieldId: string, targetIndex: number) => void;
  onUpdateFormSettings: (updater: (settings: FormSettingsConfig) => FormSettingsConfig) => void;
}

export const PropertiesPanel: React.FC<Props> = ({
  selectedField,
  allFields,
  formSettings,
  activeTab,
  onChangeTab,
  onUpdateField,
  onMoveFieldToOrder,
  onUpdateFormSettings,
}) => {
  const [newOptionText, setNewOptionText] = useState('');
  const [newRowText, setNewRowText] = useState('');
  const [newColText, setNewColText] = useState('');

  const duplicateHeaders = getDuplicateColumnHeaders(allFields);
  const sheetColumns = getOrderedColumnsForForm(allFields);

  const renderFieldProperties = () => {
    if (!selectedField) {
      return (
        <div className="p-8 text-center text-slate-400">
          <Sliders className="w-8 h-8 mx-auto text-slate-300 mb-2" />
          <p className="text-xs font-semibold text-slate-600">No component selected</p>
          <p className="text-[11px] text-slate-400 mt-1">
            Click any component in the Form Preview to customize its properties, validation, choices, or design.
          </p>
        </div>
      );
    }

    const caps = getComponentCapabilities(selectedField.type);
    const catalogMeta = COMPONENT_CATALOG.find((c) => c.type === selectedField.type);
    const sheetType = getSheetDataType(selectedField.type);
    const isDuplicateCol =
      caps.isDataField &&
      duplicateHeaders.has(selectedField.columnHeader.trim().toLowerCase());

    const update = (patch: Partial<FormFieldConfig>) => {
      onUpdateField(selectedField.id, (f) => ({ ...f, ...patch }));
    };

    const updateValidation = (patch: Partial<FormFieldConfig['validation']>) => {
      onUpdateField(selectedField.id, (f) => ({
        ...f,
        validation: { ...f.validation, ...patch },
      }));
    };

    const updateChoice = (patch: Partial<FormFieldConfig['choiceConfig']>) => {
      onUpdateField(selectedField.id, (f) => ({
        ...f,
        choiceConfig: { ...f.choiceConfig, ...patch },
      }));
    };

    const updateLayout = (patch: Partial<FormFieldConfig['layoutConfig']>) => {
      onUpdateField(selectedField.id, (f) => ({
        ...f,
        layoutConfig: { ...f.layoutConfig, ...patch },
      }));
    };

    const updateDesign = (patch: Partial<FormFieldConfig['design']>) => {
      onUpdateField(selectedField.id, (f) => ({
        ...f,
        design: { ...f.design, ...patch },
      }));
    };

    const options = selectedField.choiceConfig.options || [];
    const defaultSelected = selectedField.choiceConfig.defaultSelected || [];

    const handleAddOption = () => {
      const label = newOptionText.trim();
      if (!label) return;
      const nextOpt: FormFieldChoiceOption = {
        id: `opt_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        label,
        value: label,
      };
      updateChoice({ options: [...options, nextOpt] });
      setNewOptionText('');
    };

    const handleMoveOption = (index: number, dir: -1 | 1) => {
      const target = index + dir;
      if (target < 0 || target >= options.length) return;
      const copy = [...options];
      const [item] = copy.splice(index, 1);
      copy.splice(target, 0, item);
      updateChoice({ options: copy });
    };

    const gridRows = selectedField.choiceConfig.gridRows || [];
    const gridColumns = selectedField.choiceConfig.gridColumns || [];

    const handleMoveGridItem = (key: 'gridRows' | 'gridColumns', index: number, dir: -1 | 1) => {
      const arr = [...(selectedField.choiceConfig[key] || [])];
      const target = index + dir;
      if (target < 0 || target >= arr.length) return;
      const [item] = arr.splice(index, 1);
      arr.splice(target, 0, item);
      updateChoice({ [key]: arr });
    };

    return (
      <div className="p-4 space-y-5 overflow-y-auto max-h-[680px]">
        {/* Selected Badge */}
        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-900">{catalogMeta?.label}</span>
            <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
              Sheet: {sheetType}
            </span>
          </div>
          <div className="text-[10px] font-mono text-slate-500">
            Field ID: <span className="text-slate-700 font-semibold">{selectedField.id}</span>
          </div>
        </div>

        {/* 1. Common Properties */}
        <section className="space-y-3">
          <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-1">
            Common Properties
          </h4>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Field Label
            </label>
            <input
              type="text"
              value={selectedField.label}
              onChange={(e) => {
                const nextLabel = e.target.value;
                // Sync columnHeader if it previously matched the old label
                const shouldSyncHeader =
                  caps.isDataField &&
                  (selectedField.columnHeader === selectedField.label || !selectedField.columnHeader);
                update({
                  label: nextLabel,
                  columnHeader: shouldSyncHeader
                    ? ensureUniqueColumnHeader(nextLabel, selectedField.id, allFields)
                    : selectedField.columnHeader,
                });
              }}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {caps.isDataField && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[11px] font-semibold text-slate-600">
                  Google Sheet Column Header
                </label>
                {isDuplicateCol && (
                  <button
                    type="button"
                    onClick={() =>
                      update({
                        columnHeader: ensureUniqueColumnHeader(
                          selectedField.columnHeader,
                          selectedField.id,
                          allFields
                        ),
                      })
                    }
                    className="text-[10px] font-semibold text-amber-700 underline cursor-pointer"
                  >
                    Auto-fix duplicate
                  </button>
                )}
              </div>
              <input
                type="text"
                value={selectedField.columnHeader}
                onChange={(e) => update({ columnHeader: e.target.value })}
                onBlur={() =>
                  update({
                    columnHeader: ensureUniqueColumnHeader(
                      selectedField.columnHeader,
                      selectedField.id,
                      allFields
                    ),
                  })
                }
                className={`w-full px-2.5 py-1.5 text-xs font-mono border rounded-lg focus:outline-none focus:ring-2 ${
                  isDuplicateCol
                    ? 'border-amber-400 bg-amber-50 focus:ring-amber-500/20'
                    : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'
                }`}
              />
              {isDuplicateCol && (
                <p className="text-[10px] text-amber-700 mt-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Duplicate column names are automatically prevented on blur/save.
                </p>
              )}
            </div>
          )}

          {selectedField.type !== 'divider' && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Field Description
              </label>
              <textarea
                rows={2}
                value={selectedField.description || ''}
                onChange={(e) => update({ description: e.target.value })}
                placeholder="Helper text or description..."
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          )}

          {caps.hasPlaceholder && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Placeholder
              </label>
              <input
                type="text"
                value={selectedField.placeholder || ''}
                onChange={(e) => update({ placeholder: e.target.value })}
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          )}

          {caps.hasDefaultValue && (
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Default Value
              </label>
              {selectedField.type === 'toggle' ? (
                <select
                  value={selectedField.defaultValue ? 'true' : 'false'}
                  onChange={(e) => update({ defaultValue: e.target.value === 'true' })}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                >
                  <option value="true">Yes (TRUE)</option>
                  <option value="false">No (FALSE)</option>
                </select>
              ) : (
                <input
                  type={
                    selectedField.type === 'number' ||
                    selectedField.type === 'linear_scale' ||
                    selectedField.type === 'star_rating'
                      ? 'number'
                      : selectedField.type === 'date'
                      ? 'date'
                      : selectedField.type === 'time'
                      ? 'time'
                      : selectedField.type === 'datetime'
                      ? 'datetime-local'
                      : 'text'
                  }
                  value={selectedField.defaultValue ?? ''}
                  onChange={(e) => update({ defaultValue: e.target.value })}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                />
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Field Width
              </label>
              <select
                value={selectedField.width}
                onChange={(e) =>
                  update({ width: e.target.value as 'full' | 'half' | 'custom' })
                }
                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
              >
                <option value="full">Full (100%)</option>
                <option value="half">Half (50%)</option>
                <option value="custom">Custom %</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Field Order
              </label>
              <select
                value={selectedField.order}
                onChange={(e) =>
                  onMoveFieldToOrder(selectedField.id, Number(e.target.value))
                }
                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
              >
                {allFields.map((_, idx) => (
                  <option key={idx} value={idx}>
                    Position #{idx + 1}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedField.width === 'custom' && (
            <div>
              <div className="flex items-center justify-between text-[11px] text-slate-600 mb-1">
                <span>Custom Width</span>
                <span className="font-mono font-bold">{selectedField.customWidthPercent || 100}%</span>
              </div>
              <input
                type="range"
                min={25}
                max={100}
                step={5}
                value={selectedField.customWidthPercent || 100}
                onChange={(e) => update({ customWidthPercent: Number(e.target.value) })}
                className="w-full accent-emerald-600"
              />
            </div>
          )}

          <div className="flex items-center justify-between gap-2 pt-1">
            {caps.isDataField && (
              <label className="inline-flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!selectedField.required}
                  onChange={(e) => update({ required: e.target.checked })}
                  className="w-4 h-4 rounded accent-emerald-600 cursor-pointer"
                />
                <span>Required Field</span>
              </label>
            )}

            <button
              type="button"
              onClick={() => update({ visible: !selectedField.visible })}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border cursor-pointer ${
                selectedField.visible
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
              }`}
            >
              {selectedField.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{selectedField.visible ? 'Visible' : 'Hidden'}</span>
            </button>
          </div>
        </section>

        {/* 2. Content & Layout Specific Properties */}
        {(caps.hasHeadingLevel || caps.hasMediaUrl || caps.hasPageBreakLabels) && (
          <section className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              Layout & Media Settings
            </h4>

            {caps.hasHeadingLevel && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Heading Level
                </label>
                <select
                  value={selectedField.layoutConfig.headingLevel || 'h2'}
                  onChange={(e) =>
                    updateLayout({ headingLevel: e.target.value as 'h1' | 'h2' | 'h3' })
                  }
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                >
                  <option value="h1">H1 (Large Title)</option>
                  <option value="h2">H2 (Section Heading)</option>
                  <option value="h3">H3 (Subheading)</option>
                </select>
              </div>
            )}

            {caps.hasMediaUrl && (
              <>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    {selectedField.type === 'video'
                      ? 'Video URL (YouTube, Vimeo, or MP4)'
                      : 'Image URL'}
                  </label>
                  <input
                    type="url"
                    value={selectedField.layoutConfig.mediaUrl || ''}
                    onChange={(e) => updateLayout({ mediaUrl: e.target.value })}
                    placeholder="https://..."
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-lg"
                  />
                </div>
                {selectedField.type === 'image' && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Alt Text
                    </label>
                    <input
                      type="text"
                      value={selectedField.layoutConfig.altText || ''}
                      onChange={(e) => updateLayout({ altText: e.target.value })}
                      className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                    />
                  </div>
                )}
              </>
            )}

            {caps.hasPageBreakLabels && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Next Button Text
                  </label>
                  <input
                    type="text"
                    value={selectedField.layoutConfig.nextButtonText || 'Next'}
                    onChange={(e) => updateLayout({ nextButtonText: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Previous Button Text
                  </label>
                  <input
                    type="text"
                    value={selectedField.layoutConfig.prevButtonText || 'Back'}
                    onChange={(e) => updateLayout({ prevButtonText: e.target.value })}
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            )}
          </section>
        )}

        {/* 3. Choice-Specific Properties */}
        {(caps.hasOptions || caps.hasLinearScale || caps.hasStarRating || caps.hasGrid) && (
          <section className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <ListChecks className="w-3.5 h-3.5 text-emerald-600" />
              <span>Choice Configuration</span>
            </h4>

            {caps.hasAllowMultiple && (
              <label className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={
                    selectedField.type === 'checkboxes' || selectedField.type === 'multi_select'
                      ? selectedField.choiceConfig.allowMultiple !== false
                      : !!selectedField.choiceConfig.allowMultiple
                  }
                  onChange={(e) => updateChoice({ allowMultiple: e.target.checked })}
                  className="w-4 h-4 rounded accent-emerald-600 cursor-pointer"
                />
                <span>Allow Multiple Selections</span>
              </label>
            )}

            {caps.hasOptions && (
              <div className="space-y-2">
                <label className="block text-[11px] font-semibold text-slate-600">
                  Options (Edit, Reorder, Default Select)
                </label>
                <div className="space-y-1.5">
                  {options.map((opt, idx) => {
                    const isDefault = defaultSelected.includes(opt.value);
                    return (
                      <div key={opt.id} className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            const allowMulti =
                              selectedField.type === 'checkboxes' ||
                              selectedField.type === 'multi_select' ||
                              !!selectedField.choiceConfig.allowMultiple;
                            const nextDef = isDefault
                              ? defaultSelected.filter((v) => v !== opt.value)
                              : allowMulti
                              ? [...defaultSelected, opt.value]
                              : [opt.value];
                            updateChoice({ defaultSelected: nextDef });
                            update({ defaultValue: allowMulti ? nextDef : nextDef[0] || '' });
                          }}
                          className={`p-1 rounded border cursor-pointer ${
                            isDefault
                              ? 'bg-emerald-100 border-emerald-400 text-emerald-700'
                              : 'bg-white border-slate-200 text-slate-300 hover:text-slate-500'
                          }`}
                          title="Set as Default Selected Option"
                        >
                          <Check className="w-3 h-3" />
                        </button>

                        <input
                          type="text"
                          value={opt.label}
                          onChange={(e) => {
                            const val = e.target.value;
                            const nextOpts = options.map((o) =>
                              o.id === opt.id ? { ...o, label: val, value: val } : o
                            );
                            updateChoice({ options: nextOpts });
                          }}
                          className="flex-1 px-2 py-1 text-xs border border-slate-200 rounded-md"
                        />

                        <button
                          type="button"
                          onClick={() => handleMoveOption(idx, -1)}
                          disabled={idx === 0}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                          title="Move Up"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveOption(idx, 1)}
                          disabled={idx === options.length - 1}
                          className="p-1 text-slate-400 hover:text-slate-700 disabled:opacity-30 cursor-pointer"
                          title="Move Down"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (options.length <= 1) return;
                            updateChoice({ options: options.filter((o) => o.id !== opt.id) });
                          }}
                          className="p-1 text-rose-400 hover:text-rose-600 cursor-pointer"
                          title="Delete Option"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                <div className="flex items-center gap-1.5 pt-1">
                  <input
                    type="text"
                    value={newOptionText}
                    onChange={(e) => setNewOptionText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddOption();
                      }
                    }}
                    placeholder="Add new option..."
                    className="flex-1 px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer inline-flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </button>
                </div>
              </div>
            )}

            {caps.hasLinearScale && (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Scale Start
                    </label>
                    <select
                      value={selectedField.choiceConfig.scaleMin ?? 1}
                      onChange={(e) => updateChoice({ scaleMin: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                    >
                      <option value={0}>0</option>
                      <option value={1}>1</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Scale End
                    </label>
                    <select
                      value={selectedField.choiceConfig.scaleMax ?? 5}
                      onChange={(e) => updateChoice({ scaleMax: Number(e.target.value) })}
                      className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                    >
                      {[3, 4, 5, 7, 10].map((n) => (
                        <option key={n} value={n}>
                          {n}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={selectedField.choiceConfig.scaleMinLabel || ''}
                    onChange={(e) => updateChoice({ scaleMinLabel: e.target.value })}
                    placeholder="Min label (e.g. Low)"
                    className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg"
                  />
                  <input
                    type="text"
                    value={selectedField.choiceConfig.scaleMaxLabel || ''}
                    onChange={(e) => updateChoice({ scaleMaxLabel: e.target.value })}
                    placeholder="Max label (e.g. High)"
                    className="px-2 py-1.5 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            )}

            {caps.hasStarRating && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Maximum Stars
                </label>
                <select
                  value={selectedField.choiceConfig.starMax || 5}
                  onChange={(e) => updateChoice({ starMax: Number(e.target.value) })}
                  className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                >
                  {[3, 4, 5, 7, 10].map((n) => (
                    <option key={n} value={n}>
                      {n} Stars
                    </option>
                  ))}
                </select>
              </div>
            )}

            {caps.hasGrid && (
              <div className="space-y-3">
                {/* Grid Rows */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Grid Rows
                  </label>
                  <div className="space-y-1">
                    {gridRows.map((rowVal, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <input
                          type="text"
                          value={rowVal}
                          onChange={(e) => {
                            const next = [...gridRows];
                            next[idx] = e.target.value;
                            updateChoice({ gridRows: next });
                          }}
                          className="flex-1 px-2 py-1 text-xs border border-slate-200 rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => handleMoveGridItem('gridRows', idx, -1)}
                          className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveGridItem('gridRows', idx, 1)}
                          className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (gridRows.length <= 1) return;
                            updateChoice({ gridRows: gridRows.filter((_, i) => i !== idx) });
                          }}
                          className="p-1 text-rose-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <input
                      type="text"
                      value={newRowText}
                      onChange={(e) => setNewRowText(e.target.value)}
                      placeholder="Add row..."
                      className="flex-1 px-2 py-1 text-xs border border-slate-200 rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newRowText.trim()) return;
                        updateChoice({ gridRows: [...gridRows, newRowText.trim()] });
                        setNewRowText('');
                      }}
                      className="px-2 py-1 bg-slate-800 text-white rounded-md text-xs cursor-pointer"
                    >
                      + Row
                    </button>
                  </div>
                </div>

                {/* Grid Columns */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Grid Columns
                  </label>
                  <div className="space-y-1">
                    {gridColumns.map((colVal, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <input
                          type="text"
                          value={colVal}
                          onChange={(e) => {
                            const next = [...gridColumns];
                            next[idx] = e.target.value;
                            updateChoice({ gridColumns: next });
                          }}
                          className="flex-1 px-2 py-1 text-xs border border-slate-200 rounded-md"
                        />
                        <button
                          type="button"
                          onClick={() => handleMoveGridItem('gridColumns', idx, -1)}
                          className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleMoveGridItem('gridColumns', idx, 1)}
                          className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (gridColumns.length <= 1) return;
                            updateChoice({ gridColumns: gridColumns.filter((_, i) => i !== idx) });
                          }}
                          className="p-1 text-rose-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1.5">
                    <input
                      type="text"
                      value={newColText}
                      onChange={(e) => setNewColText(e.target.value)}
                      placeholder="Add column..."
                      className="flex-1 px-2 py-1 text-xs border border-slate-200 rounded-md"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!newColText.trim()) return;
                        updateChoice({ gridColumns: [...gridColumns, newColText.trim()] });
                        setNewColText('');
                      }}
                      className="px-2 py-1 bg-slate-800 text-white rounded-md text-xs cursor-pointer"
                    >
                      + Col
                    </button>
                  </div>
                </div>

                {caps.hasCheckboxGridMode && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Google Sheets Output Format
                    </label>
                    <select
                      value={selectedField.choiceConfig.gridOutputMode || 'separate_columns'}
                      onChange={(e) =>
                        updateChoice({
                          gridOutputMode: e.target.value as 'separate_columns' | 'combined_text',
                        })
                      }
                      className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                    >
                      <option value="separate_columns">Separate Column Per Row</option>
                      <option value="combined_text">Single Combined Text Column</option>
                    </select>
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* 4. Validation Properties (Contextual) */}
        {caps.isDataField && (
          <section className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Validation Rules</span>
            </h4>

            {caps.hasLengthValidation && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Min Length
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={selectedField.validation.minLength ?? ''}
                    onChange={(e) =>
                      updateValidation({
                        minLength: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Max Length
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={selectedField.validation.maxLength ?? ''}
                    onChange={(e) =>
                      updateValidation({
                        maxLength: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            )}

            {(caps.hasNumericRange || caps.hasDateRange) && (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Minimum Value
                  </label>
                  <input
                    type={
                      selectedField.type === 'number'
                        ? 'number'
                        : selectedField.type === 'date'
                        ? 'date'
                        : selectedField.type === 'time'
                        ? 'time'
                        : 'datetime-local'
                    }
                    value={selectedField.validation.minValue ?? ''}
                    onChange={(e) => updateValidation({ minValue: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Maximum Value
                  </label>
                  <input
                    type={
                      selectedField.type === 'number'
                        ? 'number'
                        : selectedField.type === 'date'
                        ? 'date'
                        : selectedField.type === 'time'
                        ? 'time'
                        : 'datetime-local'
                    }
                    value={selectedField.validation.maxValue ?? ''}
                    onChange={(e) => updateValidation({ maxValue: e.target.value })}
                    className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            )}

            {caps.hasEmailValidation && (
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedField.validation.validateEmail !== false}
                  onChange={(e) => updateValidation({ validateEmail: e.target.checked })}
                  className="w-4 h-4 rounded accent-emerald-600"
                />
                <span>Enforce Email Format Validation</span>
              </label>
            )}

            {caps.hasPhoneValidation && (
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedField.validation.validatePhone !== false}
                  onChange={(e) => updateValidation({ validatePhone: e.target.checked })}
                  className="w-4 h-4 rounded accent-emerald-600"
                />
                <span>Enforce Phone Number Validation</span>
              </label>
            )}

            {caps.hasUrlValidation && (
              <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedField.validation.validateUrl !== false}
                  onChange={(e) => updateValidation({ validateUrl: e.target.checked })}
                  className="w-4 h-4 rounded accent-emerald-600"
                />
                <span>Enforce Valid HTTP/HTTPS URL</span>
              </label>
            )}

            {caps.hasFileValidation && (
              <div className="space-y-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Allowed File Types (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={selectedField.validation.allowedFileTypes || ''}
                    onChange={(e) => updateValidation({ allowedFileTypes: e.target.value })}
                    placeholder=".pdf,.docx,.png"
                    className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Maximum File Size (MB)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={selectedField.validation.maxFileSizeMB ?? 5}
                    onChange={(e) =>
                      updateValidation({ maxFileSizeMB: Number(e.target.value) || 5 })
                    }
                    className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Custom Error Message
              </label>
              <input
                type="text"
                value={selectedField.validation.customErrorMessage || ''}
                onChange={(e) => updateValidation({ customErrorMessage: e.target.value })}
                placeholder="Displayed if validation fails..."
                className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
              />
            </div>
          </section>
        )}

        {/* 5. Component Design Properties */}
        <section className="space-y-3 pt-2 border-t border-slate-100">
          <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-emerald-600" />
            <span>Design Properties</span>
          </h4>

          <div className="grid grid-cols-2 gap-2.5">
            {caps.hasInputDesign && (
              <>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Label Color
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={selectedField.design.labelColor || '#1e293b'}
                      onChange={(e) => updateDesign({ labelColor: e.target.value })}
                      className="w-7 h-7 rounded border border-slate-200 cursor-pointer"
                    />
                    <span className="text-[10px] font-mono text-slate-500">
                      {selectedField.design.labelColor || '#1e293b'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Input Background
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={selectedField.design.inputBackground || '#ffffff'}
                      onChange={(e) => updateDesign({ inputBackground: e.target.value })}
                      className="w-7 h-7 rounded border border-slate-200 cursor-pointer"
                    />
                    <span className="text-[10px] font-mono text-slate-500">
                      {selectedField.design.inputBackground || '#ffffff'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Text Color
                  </label>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="color"
                      value={selectedField.design.textColor || '#0f172a'}
                      onChange={(e) => updateDesign({ textColor: e.target.value })}
                      className="w-7 h-7 rounded border border-slate-200 cursor-pointer"
                    />
                    <span className="text-[10px] font-mono text-slate-500">
                      {selectedField.design.textColor || '#0f172a'}
                    </span>
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Border Color
              </label>
              <div className="flex items-center gap-1.5">
                <input
                  type="color"
                  value={selectedField.design.borderColor || '#cbd5e1'}
                  onChange={(e) => updateDesign({ borderColor: e.target.value })}
                  className="w-7 h-7 rounded border border-slate-200 cursor-pointer"
                />
                <span className="text-[10px] font-mono text-slate-500">
                  {selectedField.design.borderColor || '#cbd5e1'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Border Radius
              </label>
              <select
                value={selectedField.design.borderRadius || 'lg'}
                onChange={(e) => updateDesign({ borderRadius: e.target.value as any })}
                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
              >
                <option value="none">None (0px)</option>
                <option value="sm">Small</option>
                <option value="md">Medium</option>
                <option value="lg">Large</option>
                <option value="xl">Extra Large</option>
                <option value="full">Pill / Full</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Font Size
              </label>
              <select
                value={selectedField.design.fontSize || 'sm'}
                onChange={(e) => updateDesign({ fontSize: e.target.value as any })}
                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
              >
                <option value="xs">XS (12px)</option>
                <option value="sm">SM (14px)</option>
                <option value="base">Base (16px)</option>
                <option value="lg">LG (18px)</option>
                <option value="xl">XL (20px)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Spacing
              </label>
              <select
                value={selectedField.design.spacing || 'normal'}
                onChange={(e) => updateDesign({ spacing: e.target.value as any })}
                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
              >
                <option value="compact">Compact</option>
                <option value="normal">Normal</option>
                <option value="relaxed">Relaxed</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                Alignment
              </label>
              <select
                value={selectedField.design.alignment || 'left'}
                onChange={(e) => updateDesign({ alignment: e.target.value as any })}
                className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </select>
            </div>
          </div>
        </section>
      </div>
    );
  };

  const renderFormSettings = () => (
    <div className="p-4 space-y-5 overflow-y-auto max-h-[680px]">
      <section className="space-y-3">
        <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-1">
          Form Identity & Target Sheet
        </h4>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Form Title
          </label>
          <input
            type="text"
            value={formSettings.title}
            onChange={(e) => onUpdateFormSettings((s) => ({ ...s, title: e.target.value }))}
            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Form Description
          </label>
          <textarea
            rows={2}
            value={formSettings.description}
            onChange={(e) =>
              onUpdateFormSettings((s) => ({ ...s, description: e.target.value }))
            }
            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Google Sheet Tab Name
          </label>
          <input
            type="text"
            value={formSettings.sheetName}
            onChange={(e) =>
              onUpdateFormSettings((s) => ({ ...s, sheetName: e.target.value }))
            }
            className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-200 rounded-lg"
          />
        </div>
      </section>

      <section className="space-y-3 pt-2 border-t border-slate-100">
        <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-1">
          Colors & Typography
        </h4>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-[10px] font-semibold text-slate-600 mb-1">
              Background
            </label>
            <input
              type="color"
              value={formSettings.backgroundColor}
              onChange={(e) =>
                onUpdateFormSettings((s) => ({ ...s, backgroundColor: e.target.value }))
              }
              className="w-full h-8 rounded border border-slate-200 cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-600 mb-1">
              Primary Color
            </label>
            <input
              type="color"
              value={formSettings.primaryColor}
              onChange={(e) =>
                onUpdateFormSettings((s) => ({ ...s, primaryColor: e.target.value }))
              }
              className="w-full h-8 rounded border border-slate-200 cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-[10px] font-semibold text-slate-600 mb-1">
              Secondary
            </label>
            <input
              type="color"
              value={formSettings.secondaryColor}
              onChange={(e) =>
                onUpdateFormSettings((s) => ({ ...s, secondaryColor: e.target.value }))
              }
              className="w-full h-8 rounded border border-slate-200 cursor-pointer"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Font Family
            </label>
            <select
              value={formSettings.fontFamily}
              onChange={(e) =>
                onUpdateFormSettings((s) => ({ ...s, fontFamily: e.target.value as any }))
              }
              className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="Plus Jakarta Sans">Plus Jakarta Sans</option>
              <option value="Inter">Inter</option>
              <option value="System UI">System UI</option>
              <option value="Georgia">Georgia (Serif)</option>
              <option value="JetBrains Mono">JetBrains Mono</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Form Width
            </label>
            <select
              value={formSettings.formWidth}
              onChange={(e) =>
                onUpdateFormSettings((s) => ({ ...s, formWidth: e.target.value as any }))
              }
              className="w-full px-2 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="narrow">Narrow (480px)</option>
              <option value="medium">Medium (680px)</option>
              <option value="wide">Wide (880px)</option>
              <option value="full">Full (100%)</option>
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-3 pt-2 border-t border-slate-100">
        <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-1">
          Layout & Component Styles
        </h4>

        <div className="grid grid-cols-3 gap-2">
          <div>
            <label className="block text-[10px] font-semibold text-slate-600 mb-1">
              Input Style
            </label>
            <select
              value={formSettings.inputStyle}
              onChange={(e) =>
                onUpdateFormSettings((s) => ({ ...s, inputStyle: e.target.value as any }))
              }
              className="w-full px-1.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="outlined">Outlined</option>
              <option value="filled">Filled</option>
              <option value="underlined">Underlined</option>
              <option value="minimal">Minimal</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-600 mb-1">
              Button Style
            </label>
            <select
              value={formSettings.buttonStyle}
              onChange={(e) =>
                onUpdateFormSettings((s) => ({ ...s, buttonStyle: e.target.value as any }))
              }
              className="w-full px-1.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="solid">Solid</option>
              <option value="outline">Outline</option>
              <option value="pill">Pill</option>
              <option value="soft">Soft</option>
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-semibold text-slate-600 mb-1">
              Section Layout
            </label>
            <select
              value={formSettings.sectionLayout}
              onChange={(e) =>
                onUpdateFormSettings((s) => ({ ...s, sectionLayout: e.target.value as any }))
              }
              className="w-full px-1.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
            >
              <option value="stacked">Stacked</option>
              <option value="card">Carded</option>
              <option value="bordered">Bordered</option>
              <option value="two-column">2-Column</option>
            </select>
          </div>
        </div>
      </section>

      <section className="space-y-3 pt-2 border-t border-slate-100">
        <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider border-b border-slate-100 pb-1">
          Submission & Feedback
        </h4>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Submit Button Text
          </label>
          <input
            type="text"
            value={formSettings.submitButtonText}
            onChange={(e) =>
              onUpdateFormSettings((s) => ({ ...s, submitButtonText: e.target.value }))
            }
            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
          />
        </div>

        <div>
          <label className="block text-[11px] font-semibold text-slate-600 mb-1">
            Success Message
          </label>
          <textarea
            rows={2}
            value={formSettings.successMessage}
            onChange={(e) =>
              onUpdateFormSettings((s) => ({ ...s, successMessage: e.target.value }))
            }
            className="w-full px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg"
          />
        </div>
      </section>

      {/* Google Sheets Column Schema Mapping */}
      <section className="space-y-2 pt-2 border-t border-slate-100">
        <div className="flex items-center justify-between">
          <h4 className="text-[11px] font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Google Sheets Columns ({sheetColumns.length + 1})</span>
          </h4>
        </div>

        <div className="bg-slate-50 border border-slate-200 rounded-xl p-2 space-y-1 text-[11px]">
          <div className="flex items-center justify-between px-2 py-1 rounded bg-white border border-slate-200/70">
            <span className="font-mono font-semibold text-slate-700">A: Timestamp</span>
            <span className="font-mono text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              DATETIME
            </span>
          </div>
          {sheetColumns.map((col, idx) => (
            <div
              key={col.key}
              className="flex items-center justify-between px-2 py-1 rounded bg-white border border-slate-200/70 gap-2"
            >
              <span className="font-mono text-slate-700 truncate">
                {String.fromCharCode(66 + (idx % 25))}: {col.header}
              </span>
              <span className="font-mono text-[10px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded shrink-0">
                {col.type}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );

  return (
    <aside className="bg-white rounded-2xl border border-slate-200/90 shadow-sm flex flex-col overflow-hidden h-full">
      {/* Tabs */}
      <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50/70 p-1.5 gap-1">
        <button
          type="button"
          onClick={() => onChangeTab('field')}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'field'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sliders className="w-3.5 h-3.5 text-emerald-600" />
          <span>Component Props</span>
        </button>

        <button
          type="button"
          onClick={() => onChangeTab('form')}
          className={`flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            activeTab === 'form'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
          <span>Form Design</span>
        </button>
      </div>

      {activeTab === 'field' ? renderFieldProperties() : renderFormSettings()}
    </aside>
  );
};

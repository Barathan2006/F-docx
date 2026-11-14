import React, { useState } from 'react';
import { FormFieldConfig, FormSettingsConfig, UploadedFilePayload } from '../../types';
import {
  Star,
  Upload,
  Image as ImageIcon,
  FileText,
  X,
  Check,
  ChevronDown,
  SplitSquareHorizontal,
  Video as VideoIcon,
  AlertCircle,
} from 'lucide-react';

interface Props {
  field: FormFieldConfig;
  formSettings: FormSettingsConfig;
  value: any;
  uploadedFile?: UploadedFilePayload;
  error?: string;
  isPreviewMode: boolean;
  onChange: (value: any) => void;
  onFileUpload: (filePayload: UploadedFilePayload | null) => void;
  onFileValidationError?: (msg: string) => void;
}

const RADIUS_CLASS: Record<string, string> = {
  none: 'rounded-none',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  full: 'rounded-full',
};

const FONT_SIZE_CLASS: Record<string, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
};

const SPACING_CLASS: Record<string, string> = {
  compact: 'py-1',
  normal: 'py-2',
  relaxed: 'py-3.5',
};

const ALIGNMENT_CLASS: Record<string, string> = {
  left: 'text-left',
  center: 'text-center',
  right: 'text-right',
};

function convertToEmbedVideoUrl(rawUrl?: string): { type: 'iframe' | 'video' | 'none'; src: string } {
  if (!rawUrl || !rawUrl.trim()) return { type: 'none', src: '' };
  const url = rawUrl.trim();
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{6,})/);
  if (ytMatch) {
    return { type: 'iframe', src: `https://www.youtube.com/embed/${ytMatch[1]}` };
  }
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return { type: 'iframe', src: `https://player.vimeo.com/video/${vimeoMatch[1]}` };
  }
  if (/\.(mp4|webm|ogg)(\?.*)?$/i.test(url)) {
    return { type: 'video', src: url };
  }
  return { type: 'iframe', src: url };
}

export const FormFieldRenderer: React.FC<Props> = ({
  field,
  formSettings,
  value,
  uploadedFile,
  error,
  isPreviewMode,
  onChange,
  onFileUpload,
  onFileValidationError,
}) => {
  const [multiDropdownOpen, setMultiDropdownOpen] = useState(false);

  const radius = RADIUS_CLASS[field.design.borderRadius || 'lg'] || 'rounded-lg';
  const fontSize = FONT_SIZE_CLASS[field.design.fontSize || 'sm'] || 'text-sm';
  const spacing = SPACING_CLASS[field.design.spacing || 'normal'] || 'py-2';
  const alignment = ALIGNMENT_CLASS[field.design.alignment || 'left'] || 'text-left';

  const labelStyle: React.CSSProperties = {
    color: field.design.labelColor || '#1e293b',
  };

  const getInputStyleProps = (): React.CSSProperties => {
    const borderColor = error ? '#e11d48' : field.design.borderColor || '#cbd5e1';
    const baseBg = field.design.inputBackground || '#ffffff';
    const textColor = field.design.textColor || '#0f172a';

    if (formSettings.inputStyle === 'filled') {
      return {
        backgroundColor: baseBg === '#ffffff' ? '#f1f5f9' : baseBg,
        color: textColor,
        borderColor: error ? '#e11d48' : 'transparent',
        borderWidth: '1px',
        borderStyle: 'solid',
      };
    }
    if (formSettings.inputStyle === 'underlined') {
      return {
        backgroundColor: 'transparent',
        color: textColor,
        borderTopWidth: 0,
        borderLeftWidth: 0,
        borderRightWidth: 0,
        borderBottomWidth: '2px',
        borderBottomColor: borderColor,
        borderStyle: 'solid',
        borderRadius: 0,
      };
    }
    if (formSettings.inputStyle === 'minimal') {
      return {
        backgroundColor: baseBg,
        color: textColor,
        borderColor: error ? '#e11d48' : '#e2e8f0',
        borderWidth: '1px',
        borderStyle: 'solid',
      };
    }
    return {
      backgroundColor: baseBg,
      color: textColor,
      borderColor,
      borderWidth: '1px',
      borderStyle: 'solid',
    };
  };

  const inputClass = `w-full px-3.5 py-2.5 ${fontSize} ${radius} focus:outline-none focus:ring-2 transition-all`;
  const inputStyleProps = getInputStyleProps();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, isImageOnly: boolean) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxMB = field.validation.maxFileSizeMB || 5;
    if (file.size > maxMB * 1024 * 1024) {
      onFileValidationError?.(`File exceeds max allowed size of ${maxMB} MB.`);
      return;
    }

    if (field.validation.allowedFileTypes && field.validation.allowedFileTypes.trim()) {
      const allowed = field.validation.allowedFileTypes
        .split(',')
        .map((s) => s.trim().toLowerCase())
        .filter(Boolean);
      const ext = '.' + (file.name.split('.').pop()?.toLowerCase() || '');
      const matchesExt = allowed.some((a) => a === ext || (a.endsWith('/*') && file.type.startsWith(a.replace('/*', '/'))));
      if (allowed.length > 0 && !matchesExt) {
        onFileValidationError?.(`Invalid file type. Allowed: ${field.validation.allowedFileTypes}`);
        return;
      }
    } else if (isImageOnly && !file.type.startsWith('image/')) {
      onFileValidationError?.('Please select a valid image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = typeof reader.result === 'string' ? reader.result : '';
      const base64Data = dataUrl.includes(',') ? dataUrl.split(',')[1] : dataUrl;
      const simulatedDriveUrl = `https://drive.google.com/file/d/drive_${Date.now().toString(36)}/view?name=${encodeURIComponent(file.name)}`;

      onFileUpload({
        fieldId: field.id,
        columnHeader: field.columnHeader,
        fileName: file.name,
        mimeType: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        base64Data: base64Data.length < 400_000 ? base64Data : undefined,
        previewUrl: isImageOnly && dataUrl.length < 150_000 ? dataUrl : simulatedDriveUrl,
      });
      onChange(simulatedDriveUrl);
    };
    reader.readAsDataURL(file);
  };

  // Layout-only components
  if (field.type === 'heading') {
    const level = field.layoutConfig.headingLevel || 'h2';
    const sizeCls =
      level === 'h1' ? 'text-2xl font-extrabold' : level === 'h3' ? 'text-base font-bold' : 'text-xl font-bold';
    return (
      <div className={`${spacing} ${alignment}`}>
        <div className={sizeCls} style={labelStyle}>
          {field.label || 'Heading'}
        </div>
        {field.description && (
          <p className="text-sm text-slate-500 mt-1">{field.description}</p>
        )}
      </div>
    );
  }

  if (field.type === 'description') {
    return (
      <div className={`${spacing} ${alignment}`}>
        {field.label && (
          <div className="text-xs font-bold uppercase tracking-wider mb-1" style={labelStyle}>
            {field.label}
          </div>
        )}
        <p className={`${fontSize} leading-relaxed`} style={{ color: field.design.textColor || '#475569' }}>
          {field.description || 'Informational text block.'}
        </p>
      </div>
    );
  }

  if (field.type === 'section') {
    return (
      <div
        className={`${spacing} ${alignment} border-l-4 pl-4 py-2 rounded-r-lg bg-slate-50/80`}
        style={{ borderLeftColor: formSettings.primaryColor }}
      >
        <h3 className="text-base font-bold" style={labelStyle}>
          {field.label || 'Section'}
        </h3>
        {field.description && <p className="text-xs text-slate-500 mt-0.5">{field.description}</p>}
      </div>
    );
  }

  if (field.type === 'divider') {
    return (
      <div className="py-3">
        <hr style={{ borderColor: field.design.borderColor || '#e2e8f0' }} />
      </div>
    );
  }

  if (field.type === 'image') {
    const alignFlex =
      field.design.alignment === 'center'
        ? 'items-center text-center'
        : field.design.alignment === 'right'
        ? 'items-end text-right'
        : 'items-start text-left';
    return (
      <div className={`${spacing} flex flex-col ${alignFlex}`}>
        {field.layoutConfig.mediaUrl ? (
          <img
            src={field.layoutConfig.mediaUrl}
            alt={field.layoutConfig.altText || field.label}
            className={`max-h-64 object-cover border border-slate-200 shadow-xs ${radius}`}
          />
        ) : (
          <div className={`w-full h-36 bg-slate-100 border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 ${radius}`}>
            <ImageIcon className="w-6 h-6 mb-1" />
            <span className="text-xs">Add an Image URL in Properties</span>
          </div>
        )}
        {field.description && <p className="text-xs text-slate-500 mt-1.5">{field.description}</p>}
      </div>
    );
  }

  if (field.type === 'video') {
    const videoInfo = convertToEmbedVideoUrl(field.layoutConfig.mediaUrl);
    return (
      <div className={`${spacing} ${alignment}`}>
        {field.label && (
          <div className="text-sm font-semibold mb-1.5" style={labelStyle}>
            {field.label}
          </div>
        )}
        {videoInfo.type === 'iframe' && (
          <div className={`aspect-video w-full overflow-hidden border border-slate-200 bg-slate-900 ${radius}`}>
            <iframe
              src={videoInfo.src}
              title={field.label || 'Embedded Video'}
              className="w-full h-full"
              allowFullScreen
            />
          </div>
        )}
        {videoInfo.type === 'video' && (
          <video controls src={videoInfo.src} className={`w-full max-h-72 bg-black ${radius}`} />
        )}
        {videoInfo.type === 'none' && (
          <div className={`w-full h-36 bg-slate-100 border border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 ${radius}`}>
            <VideoIcon className="w-6 h-6 mb-1" />
            <span className="text-xs">Paste a YouTube, Vimeo, or MP4 URL in Properties</span>
          </div>
        )}
        {field.description && <p className="text-xs text-slate-500 mt-1.5">{field.description}</p>}
      </div>
    );
  }

  if (field.type === 'page_break') {
    return (
      <div className="py-2">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-amber-50 border border-dashed border-amber-300 text-amber-800 text-xs font-semibold">
          <SplitSquareHorizontal className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Page Break: {field.label || 'Next Page'}</span>
          {field.description && <span className="text-amber-600 font-normal truncate">• {field.description}</span>}
        </div>
      </div>
    );
  }

  // Data fields render label + description + input + error
  const renderInputControl = () => {
    switch (field.type) {
      case 'short_text':
      case 'email':
      case 'phone':
      case 'url': {
        const htmlType =
          field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : field.type === 'url' ? 'url' : 'text';
        return (
          <input
            type={htmlType}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || ''}
            style={inputStyleProps}
            className={inputClass}
          />
        );
      }

      case 'number':
        return (
          <input
            type="number"
            value={value ?? ''}
            min={field.validation.minValue !== '' ? field.validation.minValue : undefined}
            max={field.validation.maxValue !== '' ? field.validation.maxValue : undefined}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || '0'}
            style={inputStyleProps}
            className={inputClass}
          />
        );

      case 'long_text':
        return (
          <textarea
            rows={3}
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            placeholder={field.placeholder || ''}
            style={inputStyleProps}
            className={`${inputClass} resize-y`}
          />
        );

      case 'date':
        return (
          <input
            type="date"
            value={value ?? ''}
            min={field.validation.minValue || undefined}
            max={field.validation.maxValue || undefined}
            onChange={(e) => onChange(e.target.value)}
            style={inputStyleProps}
            className={inputClass}
          />
        );

      case 'time':
        return (
          <input
            type="time"
            value={value ?? ''}
            min={field.validation.minValue || undefined}
            max={field.validation.maxValue || undefined}
            onChange={(e) => onChange(e.target.value)}
            style={inputStyleProps}
            className={inputClass}
          />
        );

      case 'datetime':
        return (
          <input
            type="datetime-local"
            value={value ?? ''}
            min={field.validation.minValue || undefined}
            max={field.validation.maxValue || undefined}
            onChange={(e) => onChange(e.target.value)}
            style={inputStyleProps}
            className={inputClass}
          />
        );

      case 'file_upload':
      case 'image_upload': {
        const isImg = field.type === 'image_upload';
        return (
          <div className="space-y-2">
            <label
              className={`flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed cursor-pointer transition-colors hover:bg-slate-50 ${radius}`}
              style={{
                borderColor: error ? '#e11d48' : field.design.borderColor || '#cbd5e1',
                backgroundColor: field.design.inputBackground || '#f8fafc',
              }}
            >
              <Upload className="w-5 h-5 text-slate-500" />
              <div className="text-center">
                <span className="text-xs font-semibold" style={{ color: formSettings.primaryColor }}>
                  {isImg ? 'Choose an image' : 'Choose a file'}
                </span>
                <span className="text-xs text-slate-500"> or drag and drop</span>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {field.validation.allowedFileTypes || (isImg ? '.png, .jpg, .webp' : '.pdf, .docx, .csv')} • Max{' '}
                  {field.validation.maxFileSizeMB || 5} MB • Saved to Google Drive
                </p>
              </div>
              <input
                type="file"
                accept={field.validation.allowedFileTypes || (isImg ? 'image/*' : undefined)}
                onChange={(e) => handleFileChange(e, isImg)}
                className="hidden"
              />
            </label>

            {uploadedFile && (
              <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs">
                <div className="flex items-center gap-2.5 min-w-0">
                  {isImg && uploadedFile.previewUrl.startsWith('data:image') ? (
                    <img
                      src={uploadedFile.previewUrl}
                      alt={uploadedFile.fileName}
                      className="w-10 h-10 rounded-lg object-cover border border-emerald-200 shrink-0"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="font-semibold text-emerald-950 truncate">{uploadedFile.fileName}</div>
                    <div className="text-[10px] text-emerald-700 font-mono truncate">
                      {(uploadedFile.sizeBytes / 1024).toFixed(1)} KB • Drive URL Ready
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onFileUpload(null);
                    onChange('');
                  }}
                  className="p-1 text-emerald-700 hover:bg-emerald-200/60 rounded-lg cursor-pointer"
                  title="Remove file"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        );
      }

      case 'radio': {
        const allowMulti = !!field.choiceConfig.allowMultiple;
        const opts = field.choiceConfig.options || [];
        return (
          <div className="space-y-2">
            {opts.map((opt) => {
              const checked = allowMulti
                ? Array.isArray(value) && value.includes(opt.value)
                : value === opt.value;
              return (
                <label
                  key={opt.id}
                  className={`flex items-center gap-2.5 px-3 py-2 border cursor-pointer transition-all ${radius}`}
                  style={{
                    borderColor: checked ? formSettings.primaryColor : field.design.borderColor || '#e2e8f0',
                    backgroundColor: checked ? `${formSettings.primaryColor}10` : field.design.inputBackground || '#ffffff',
                    color: field.design.textColor || '#1e293b',
                  }}
                >
                  <input
                    type={allowMulti ? 'checkbox' : 'radio'}
                    name={field.id}
                    checked={checked}
                    onChange={() => {
                      if (allowMulti) {
                        const prevArr = Array.isArray(value) ? value : [];
                        onChange(
                          prevArr.includes(opt.value)
                            ? prevArr.filter((v) => v !== opt.value)
                            : [...prevArr, opt.value]
                        );
                      } else {
                        onChange(opt.value);
                      }
                    }}
                    className="w-4 h-4 cursor-pointer"
                    style={{ accentColor: formSettings.primaryColor }}
                  />
                  <span className={fontSize}>{opt.label}</span>
                </label>
              );
            })}
          </div>
        );
      }

      case 'checkboxes': {
        const allowMulti = field.choiceConfig.allowMultiple !== false;
        const opts = field.choiceConfig.options || [];
        const selectedArr = Array.isArray(value) ? value : value ? [value] : [];
        return (
          <div className="space-y-2">
            {opts.map((opt) => {
              const checked = selectedArr.includes(opt.value);
              return (
                <label
                  key={opt.id}
                  className={`flex items-center gap-2.5 px-3 py-2 border cursor-pointer transition-all ${radius}`}
                  style={{
                    borderColor: checked ? formSettings.primaryColor : field.design.borderColor || '#e2e8f0',
                    backgroundColor: checked ? `${formSettings.primaryColor}10` : field.design.inputBackground || '#ffffff',
                    color: field.design.textColor || '#1e293b',
                  }}
                >
                  <input
                    type={allowMulti ? 'checkbox' : 'radio'}
                    name={field.id}
                    checked={checked}
                    onChange={() => {
                      if (allowMulti) {
                        onChange(
                          checked
                            ? selectedArr.filter((v) => v !== opt.value)
                            : [...selectedArr, opt.value]
                        );
                      } else {
                        onChange([opt.value]);
                      }
                    }}
                    className="w-4 h-4 cursor-pointer"
                    style={{ accentColor: formSettings.primaryColor }}
                  />
                  <span className={fontSize}>{opt.label}</span>
                </label>
              );
            })}
          </div>
        );
      }

      case 'dropdown': {
        const allowMulti = !!field.choiceConfig.allowMultiple;
        const opts = field.choiceConfig.options || [];
        if (allowMulti) {
          const selectedArr = Array.isArray(value) ? value : [];
          return (
            <div className="relative">
              <div
                onClick={() => setMultiDropdownOpen(!multiDropdownOpen)}
                style={inputStyleProps}
                className={`${inputClass} flex items-center justify-between gap-2 cursor-pointer min-h-[42px]`}
              >
                <div className="flex flex-wrap gap-1">
                  {selectedArr.length === 0 ? (
                    <span className="text-slate-400">{field.placeholder || 'Select options...'}</span>
                  ) : (
                    selectedArr.map((val) => (
                      <span
                        key={val}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium text-white"
                        style={{ backgroundColor: formSettings.primaryColor }}
                      >
                        {val}
                      </span>
                    ))
                  )}
                </div>
                <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
              </div>
              {multiDropdownOpen && (
                <div className="mt-1 p-1.5 bg-white border border-slate-200 rounded-xl shadow-lg space-y-1 z-20 relative">
                  {opts.map((opt) => {
                    const checked = selectedArr.includes(opt.value);
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          onChange(
                            checked
                              ? selectedArr.filter((v) => v !== opt.value)
                              : [...selectedArr, opt.value]
                          );
                        }}
                        className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-left hover:bg-slate-50 cursor-pointer"
                      >
                        <span>{opt.label}</span>
                        {checked && <Check className="w-3.5 h-3.5" style={{ color: formSettings.primaryColor }} />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        }
        return (
          <select
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            style={inputStyleProps}
            className={inputClass}
          >
            <option value="">{field.placeholder || 'Select an option...'}</option>
            {opts.map((opt) => (
              <option key={opt.id} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        );
      }

      case 'multi_select': {
        const opts = field.choiceConfig.options || [];
        const selectedArr = Array.isArray(value) ? value : [];
        return (
          <div className="relative">
            <div
              onClick={() => setMultiDropdownOpen(!multiDropdownOpen)}
              style={inputStyleProps}
              className={`${inputClass} flex items-center justify-between gap-2 cursor-pointer min-h-[42px]`}
            >
              <div className="flex flex-wrap gap-1.5">
                {selectedArr.length === 0 ? (
                  <span className="text-slate-400">{field.placeholder || 'Choose multiple items...'}</span>
                ) : (
                  selectedArr.map((val) => (
                    <span
                      key={val}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium text-white"
                      style={{ backgroundColor: formSettings.primaryColor }}
                    >
                      {val}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onChange(selectedArr.filter((v) => v !== val));
                        }}
                        className="hover:opacity-75 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))
                )}
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
            </div>

            {multiDropdownOpen && (
              <div className="mt-1 p-1.5 bg-white border border-slate-200 rounded-xl shadow-lg space-y-1 z-20 relative">
                {opts.map((opt) => {
                  const checked = selectedArr.includes(opt.value);
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        onChange(
                          checked
                            ? selectedArr.filter((v) => v !== opt.value)
                            : [...selectedArr, opt.value]
                        );
                      }}
                      className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-left hover:bg-slate-50 cursor-pointer"
                    >
                      <span>{opt.label}</span>
                      {checked && <Check className="w-3.5 h-3.5" style={{ color: formSettings.primaryColor }} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      }

      case 'linear_scale': {
        const min = field.choiceConfig.scaleMin ?? 1;
        const max = field.choiceConfig.scaleMax ?? 5;
        const steps: number[] = [];
        for (let n = min; n <= max; n++) steps.push(n);
        const current = value !== undefined && value !== '' ? Number(value) : null;

        return (
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-1.5 flex-wrap">
              {steps.map((num) => {
                const isSelected = current === num;
                return (
                  <button
                    key={num}
                    type="button"
                    onClick={() => onChange(num)}
                    className={`flex-1 min-w-[36px] py-2 text-xs font-bold border transition-all cursor-pointer ${radius}`}
                    style={{
                      backgroundColor: isSelected ? formSettings.primaryColor : field.design.inputBackground || '#ffffff',
                      color: isSelected ? '#ffffff' : field.design.textColor || '#334155',
                      borderColor: isSelected ? formSettings.primaryColor : field.design.borderColor || '#cbd5e1',
                    }}
                  >
                    {num}
                  </button>
                );
              })}
            </div>
            {(field.choiceConfig.scaleMinLabel || field.choiceConfig.scaleMaxLabel) && (
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>{field.choiceConfig.scaleMinLabel}</span>
                <span>{field.choiceConfig.scaleMaxLabel}</span>
              </div>
            )}
          </div>
        );
      }

      case 'star_rating': {
        const maxStars = field.choiceConfig.starMax || 5;
        const current = Number(value) || 0;
        return (
          <div className="flex items-center gap-1.5 py-1">
            {Array.from({ length: maxStars }, (_, i) => i + 1).map((star) => {
              const active = star <= current;
              return (
                <button
                  key={star}
                  type="button"
                  onClick={() => onChange(star)}
                  className="p-1 transition-transform hover:scale-110 cursor-pointer"
                >
                  <Star
                    className={`w-6 h-6 ${
                      active ? 'fill-amber-400 text-amber-400' : 'text-slate-300'
                    }`}
                  />
                </button>
              );
            })}
            <span className="ml-2 text-xs font-semibold text-slate-600">
              {current > 0 ? `${current} / ${maxStars}` : 'Not rated'}
            </span>
          </div>
        );
      }

      case 'toggle': {
        const checked = Boolean(value);
        return (
          <button
            type="button"
            onClick={() => onChange(!checked)}
            className={`inline-flex items-center gap-3 px-3.5 py-2 border transition-all cursor-pointer ${radius}`}
            style={{
              borderColor: checked ? formSettings.primaryColor : field.design.borderColor || '#cbd5e1',
              backgroundColor: checked ? `${formSettings.primaryColor}10` : field.design.inputBackground || '#ffffff',
            }}
          >
            <span
              className="w-10 h-5 rounded-full relative transition-colors flex items-center px-0.5"
              style={{
                backgroundColor: checked ? formSettings.primaryColor : '#cbd5e1',
              }}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
                  checked ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </span>
            <span className="text-xs font-semibold" style={{ color: field.design.textColor || '#1e293b' }}>
              {checked ? 'Yes (TRUE)' : 'No (FALSE)'}
            </span>
          </button>
        );
      }

      case 'mc_grid':
      case 'checkbox_grid': {
        const rows = field.choiceConfig.gridRows || ['Row 1', 'Row 2'];
        const cols = field.choiceConfig.gridColumns || ['Col 1', 'Col 2'];
        const isCheckbox = field.type === 'checkbox_grid';
        const gridState = (value && typeof value === 'object' ? value : {}) as Record<string, any>;

        return (
          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-2.5 text-left font-semibold text-slate-600"></th>
                  {cols.map((col, cIdx) => (
                    <th key={cIdx} className="p-2.5 text-center font-semibold text-slate-700">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((rowLabel, rIdx) => (
                  <tr key={rIdx} className="border-b border-slate-100 last:border-b-0">
                    <td className="p-2.5 font-medium text-slate-800 bg-slate-50/40">{rowLabel}</td>
                    {cols.map((colLabel, cIdx) => {
                      const rowVals = gridState[rowLabel];
                      const isChecked = isCheckbox
                        ? Array.isArray(rowVals) && rowVals.includes(colLabel)
                        : rowVals === colLabel;

                      return (
                        <td key={cIdx} className="p-2.5 text-center">
                          <input
                            type={isCheckbox ? 'checkbox' : 'radio'}
                            name={`${field.id}_row_${rIdx}`}
                            checked={isChecked}
                            onChange={() => {
                              if (isCheckbox) {
                                const prevRowArr = Array.isArray(rowVals) ? rowVals : [];
                                const nextRowArr = prevRowArr.includes(colLabel)
                                  ? prevRowArr.filter((v) => v !== colLabel)
                                  : [...prevRowArr, colLabel];
                                onChange({ ...gridState, [rowLabel]: nextRowArr });
                              } else {
                                onChange({ ...gridState, [rowLabel]: colLabel });
                              }
                            }}
                            className="w-4 h-4 cursor-pointer"
                            style={{ accentColor: formSettings.primaryColor }}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className={`${spacing} ${alignment}`}>
      <label className={`block font-semibold mb-1 ${fontSize}`} style={labelStyle}>
        <span>{field.label || 'Untitled Field'}</span>
        {field.required && <span className="text-rose-500 ml-1">*</span>}
        {!field.visible && !isPreviewMode && (
          <span className="ml-2 text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-200 text-slate-600">
            Hidden
          </span>
        )}
      </label>

      {field.description && (
        <p className="text-xs text-slate-500 mb-2 leading-relaxed">{field.description}</p>
      )}

      {renderInputControl()}

      {error && (
        <p className="mt-1.5 text-xs text-rose-600 font-medium flex items-center gap-1">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
};

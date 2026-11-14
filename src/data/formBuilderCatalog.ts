import {
  CustomFormConfig,
  CustomFormSubmission,
  FormComponentType,
  FormFieldConfig,
  FormSettingsConfig,
  GoogleSheetDataType,
  UploadedFilePayload,
} from '../types';

export interface ComponentCatalogItem {
  type: FormComponentType;
  category: 'basic' | 'choice' | 'layout';
  label: string;
  description: string;
  sheetType: GoogleSheetDataType;
  iconName: string;
}

export const COMPONENT_CATALOG: ComponentCatalogItem[] = [
  // A. Basic Input Components (11)
  {
    type: 'short_text',
    category: 'basic',
    label: 'Short Text',
    description: 'Single-line text input',
    sheetType: 'TEXT',
    iconName: 'Type',
  },
  {
    type: 'long_text',
    category: 'basic',
    label: 'Long Text / Paragraph',
    description: 'Multi-line text area',
    sheetType: 'TEXT',
    iconName: 'AlignLeft',
  },
  {
    type: 'number',
    category: 'basic',
    label: 'Number',
    description: 'Numeric input field',
    sheetType: 'NUMBER',
    iconName: 'Hash',
  },
  {
    type: 'email',
    category: 'basic',
    label: 'Email',
    description: 'Email address input',
    sheetType: 'TEXT',
    iconName: 'Mail',
  },
  {
    type: 'phone',
    category: 'basic',
    label: 'Phone Number',
    description: 'Telephone number input',
    sheetType: 'TEXT',
    iconName: 'Phone',
  },
  {
    type: 'url',
    category: 'basic',
    label: 'URL',
    description: 'Website link input',
    sheetType: 'TEXT',
    iconName: 'Link',
  },
  {
    type: 'date',
    category: 'basic',
    label: 'Date',
    description: 'Calendar date picker',
    sheetType: 'DATE',
    iconName: 'Calendar',
  },
  {
    type: 'time',
    category: 'basic',
    label: 'Time',
    description: 'Clock time selector',
    sheetType: 'TIME',
    iconName: 'Clock',
  },
  {
    type: 'datetime',
    category: 'basic',
    label: 'Date & Time',
    description: 'Combined date and time',
    sheetType: 'DATETIME',
    iconName: 'CalendarClock',
  },
  {
    type: 'file_upload',
    category: 'basic',
    label: 'File Upload',
    description: 'Upload document to Drive',
    sheetType: 'FILE URL',
    iconName: 'Paperclip',
  },
  {
    type: 'image_upload',
    category: 'basic',
    label: 'Image Upload',
    description: 'Upload image to Drive',
    sheetType: 'IMAGE URL',
    iconName: 'ImagePlus',
  },

  // B. Choice Components (9)
  {
    type: 'radio',
    category: 'choice',
    label: 'Multiple Choice (Radio)',
    description: 'Single-option radio list',
    sheetType: 'TEXT',
    iconName: 'CircleDot',
  },
  {
    type: 'checkboxes',
    category: 'choice',
    label: 'Checkboxes',
    description: 'Multi-option check list',
    sheetType: 'TEXT',
    iconName: 'CheckSquare',
  },
  {
    type: 'dropdown',
    category: 'choice',
    label: 'Dropdown',
    description: 'Single-select menu',
    sheetType: 'TEXT',
    iconName: 'ChevronDownSquare',
  },
  {
    type: 'multi_select',
    category: 'choice',
    label: 'Multi-select Dropdown',
    description: 'Select multiple tags',
    sheetType: 'TEXT',
    iconName: 'ListChecks',
  },
  {
    type: 'linear_scale',
    category: 'choice',
    label: 'Linear Scale',
    description: 'Numeric rating scale',
    sheetType: 'NUMBER',
    iconName: 'SlidersHorizontal',
  },
  {
    type: 'star_rating',
    category: 'choice',
    label: 'Star Rating',
    description: 'Interactive 1-5+ stars',
    sheetType: 'NUMBER',
    iconName: 'Star',
  },
  {
    type: 'toggle',
    category: 'choice',
    label: 'Toggle (Yes/No)',
    description: 'Boolean switch',
    sheetType: 'BOOLEAN',
    iconName: 'ToggleRight',
  },
  {
    type: 'mc_grid',
    category: 'choice',
    label: 'Multiple Choice Grid',
    description: 'Row × column single choice',
    sheetType: 'SEPARATE COLUMNS',
    iconName: 'Grid3X3',
  },
  {
    type: 'checkbox_grid',
    category: 'choice',
    label: 'Checkbox Grid',
    description: 'Row × column multi choice',
    sheetType: 'COMBINED OR SEPARATE',
    iconName: 'Table2',
  },

  // C. Content and Layout Components (7)
  {
    type: 'heading',
    category: 'layout',
    label: 'Heading',
    description: 'Title or section heading',
    sheetType: 'LAYOUT ONLY',
    iconName: 'Heading',
  },
  {
    type: 'description',
    category: 'layout',
    label: 'Description',
    description: 'Formatted helper block',
    sheetType: 'LAYOUT ONLY',
    iconName: 'FileText',
  },
  {
    type: 'section',
    category: 'layout',
    label: 'Section',
    description: 'Visual group header',
    sheetType: 'LAYOUT ONLY',
    iconName: 'FolderKanban',
  },
  {
    type: 'divider',
    category: 'layout',
    label: 'Divider',
    description: 'Horizontal separator',
    sheetType: 'LAYOUT ONLY',
    iconName: 'Minus',
  },
  {
    type: 'image',
    category: 'layout',
    label: 'Image',
    description: 'Embedded banner or photo',
    sheetType: 'LAYOUT ONLY',
    iconName: 'Image',
  },
  {
    type: 'video',
    category: 'layout',
    label: 'Video',
    description: 'YouTube / Vimeo / MP4 embed',
    sheetType: 'LAYOUT ONLY',
    iconName: 'Video',
  },
  {
    type: 'page_break',
    category: 'layout',
    label: 'Page Break',
    description: 'Multi-step page split',
    sheetType: 'LAYOUT ONLY',
    iconName: 'SplitSquareHorizontal',
  },
];

export interface ComponentCapabilities {
  isDataField: boolean;
  hasPlaceholder: boolean;
  hasDefaultValue: boolean;
  hasLengthValidation: boolean;
  hasNumericRange: boolean;
  hasDateRange: boolean;
  hasEmailValidation: boolean;
  hasPhoneValidation: boolean;
  hasUrlValidation: boolean;
  hasFileValidation: boolean;
  hasOptions: boolean;
  hasAllowMultiple: boolean;
  hasLinearScale: boolean;
  hasStarRating: boolean;
  hasGrid: boolean;
  hasCheckboxGridMode: boolean;
  hasHeadingLevel: boolean;
  hasMediaUrl: boolean;
  hasPageBreakLabels: boolean;
  hasInputDesign: boolean;
}

export function getComponentCapabilities(type: FormComponentType): ComponentCapabilities {
  const isLayout = ['heading', 'description', 'section', 'divider', 'image', 'video', 'page_break'].includes(type);
  return {
    isDataField: !isLayout,
    hasPlaceholder: ['short_text', 'long_text', 'number', 'email', 'phone', 'url', 'dropdown', 'multi_select'].includes(type),
    hasDefaultValue: ['short_text', 'long_text', 'number', 'email', 'phone', 'url', 'date', 'time', 'datetime', 'toggle', 'linear_scale', 'star_rating'].includes(type),
    hasLengthValidation: ['short_text', 'long_text'].includes(type),
    hasNumericRange: ['number'].includes(type),
    hasDateRange: ['date', 'time', 'datetime'].includes(type),
    hasEmailValidation: type === 'email',
    hasPhoneValidation: type === 'phone',
    hasUrlValidation: type === 'url',
    hasFileValidation: ['file_upload', 'image_upload'].includes(type),
    hasOptions: ['radio', 'checkboxes', 'dropdown', 'multi_select'].includes(type),
    hasAllowMultiple: ['radio', 'checkboxes', 'dropdown', 'multi_select'].includes(type),
    hasLinearScale: type === 'linear_scale',
    hasStarRating: type === 'star_rating',
    hasGrid: ['mc_grid', 'checkbox_grid'].includes(type),
    hasCheckboxGridMode: type === 'checkbox_grid',
    hasHeadingLevel: type === 'heading',
    hasMediaUrl: ['image', 'video'].includes(type),
    hasPageBreakLabels: type === 'page_break',
    hasInputDesign: !['divider', 'page_break', 'image', 'video'].includes(type),
  };
}

export function getSheetDataType(type: FormComponentType): GoogleSheetDataType {
  return COMPONENT_CATALOG.find((c) => c.type === type)?.sheetType || 'TEXT';
}

export function generateFieldId(): string {
  return `fld_${Math.random().toString(36).slice(2, 7)}_${Date.now().toString(36).slice(-4)}`;
}

export function ensureUniqueColumnHeader(
  desiredHeader: string,
  fieldId: string,
  allFields: FormFieldConfig[]
): string {
  const base = desiredHeader.trim() || 'Untitled Column';
  const taken = new Set(
    allFields
      .filter((f) => f.id !== fieldId && getComponentCapabilities(f.type).isDataField)
      .map((f) => f.columnHeader.trim().toLowerCase())
  );
  // Also reserve Timestamp
  taken.add('timestamp');

  if (!taken.has(base.toLowerCase())) {
    return base;
  }

  let counter = 2;
  while (taken.has(`${base} (${counter})`.toLowerCase())) {
    counter++;
  }
  return `${base} (${counter})`;
}

export function getDuplicateColumnHeaders(fields: FormFieldConfig[]): Set<string> {
  const counts: Record<string, number> = { timestamp: 1 };
  const duplicates = new Set<string>();
  fields.forEach((f) => {
    if (!getComponentCapabilities(f.type).isDataField) return;
    const key = f.columnHeader.trim().toLowerCase();
    if (!key) return;
    counts[key] = (counts[key] || 0) + 1;
    if (counts[key] > 1) {
      duplicates.add(key);
    }
  });
  return duplicates;
}

export function createDefaultField(
  type: FormComponentType,
  existingFields: FormFieldConfig[]
): FormFieldConfig {
  const id = generateFieldId();
  const catalogItem = COMPONENT_CATALOG.find((c) => c.type === type);
  const baseLabel = catalogItem?.label || 'Field';
  const order = existingFields.length;
  const columnHeader = ensureUniqueColumnHeader(baseLabel, id, existingFields);

  const baseField: FormFieldConfig = {
    id,
    type,
    label: baseLabel,
    columnHeader,
    description: '',
    placeholder: '',
    required: false,
    defaultValue: '',
    width: 'full',
    customWidthPercent: 100,
    visible: true,
    order,
    validation: {},
    choiceConfig: {},
    layoutConfig: {},
    design: {
      labelColor: '#1e293b',
      inputBackground: '#ffffff',
      textColor: '#0f172a',
      borderColor: '#cbd5e1',
      borderRadius: 'lg',
      fontSize: 'sm',
      spacing: 'normal',
      alignment: 'left',
    },
  };

  switch (type) {
    case 'short_text':
      baseField.label = 'Full Name';
      baseField.columnHeader = ensureUniqueColumnHeader('Full Name', id, existingFields);
      baseField.placeholder = 'Enter text...';
      break;
    case 'long_text':
      baseField.label = 'Comments / Details';
      baseField.columnHeader = ensureUniqueColumnHeader('Comments / Details', id, existingFields);
      baseField.placeholder = 'Write your response here...';
      break;
    case 'number':
      baseField.label = 'Quantity / Amount';
      baseField.columnHeader = ensureUniqueColumnHeader('Quantity / Amount', id, existingFields);
      baseField.placeholder = '0';
      break;
    case 'email':
      baseField.label = 'Email Address';
      baseField.columnHeader = ensureUniqueColumnHeader('Email Address', id, existingFields);
      baseField.placeholder = 'name@company.com';
      baseField.validation.validateEmail = true;
      break;
    case 'phone':
      baseField.label = 'Phone Number';
      baseField.columnHeader = ensureUniqueColumnHeader('Phone Number', id, existingFields);
      baseField.placeholder = '+1 (555) 234-5678';
      baseField.validation.validatePhone = true;
      break;
    case 'url':
      baseField.label = 'Website URL';
      baseField.columnHeader = ensureUniqueColumnHeader('Website URL', id, existingFields);
      baseField.placeholder = 'https://example.com';
      baseField.validation.validateUrl = true;
      break;
    case 'date':
      baseField.label = 'Preferred Date';
      baseField.columnHeader = ensureUniqueColumnHeader('Preferred Date', id, existingFields);
      break;
    case 'time':
      baseField.label = 'Preferred Time';
      baseField.columnHeader = ensureUniqueColumnHeader('Preferred Time', id, existingFields);
      break;
    case 'datetime':
      baseField.label = 'Appointment Date & Time';
      baseField.columnHeader = ensureUniqueColumnHeader('Appointment Date & Time', id, existingFields);
      break;
    case 'file_upload':
      baseField.label = 'Attachment (Document)';
      baseField.columnHeader = ensureUniqueColumnHeader('Attachment (Document)', id, existingFields);
      baseField.description = 'Uploads to Google Drive and saves the shareable URL in Google Sheets.';
      baseField.validation.allowedFileTypes = '.pdf,.doc,.docx,.txt,.csv';
      baseField.validation.maxFileSizeMB = 5;
      break;
    case 'image_upload':
      baseField.label = 'Upload Photo / Screenshot';
      baseField.columnHeader = ensureUniqueColumnHeader('Upload Photo / Screenshot', id, existingFields);
      baseField.description = 'Uploads image to Google Drive and stores the Image URL in Sheets.';
      baseField.validation.allowedFileTypes = '.png,.jpg,.jpeg,.webp,.gif';
      baseField.validation.maxFileSizeMB = 5;
      break;
    case 'radio':
      baseField.label = 'Select an Option';
      baseField.columnHeader = ensureUniqueColumnHeader('Select an Option', id, existingFields);
      baseField.choiceConfig = {
        options: [
          { id: 'opt_1', label: 'Option A', value: 'Option A' },
          { id: 'opt_2', label: 'Option B', value: 'Option B' },
          { id: 'opt_3', label: 'Option C', value: 'Option C' },
        ],
        defaultSelected: [],
        allowMultiple: false,
      };
      break;
    case 'checkboxes':
      baseField.label = 'Select All That Apply';
      baseField.columnHeader = ensureUniqueColumnHeader('Select All That Apply', id, existingFields);
      baseField.choiceConfig = {
        options: [
          { id: 'opt_1', label: 'Choice 1', value: 'Choice 1' },
          { id: 'opt_2', label: 'Choice 2', value: 'Choice 2' },
          { id: 'opt_3', label: 'Choice 3', value: 'Choice 3' },
        ],
        defaultSelected: [],
        allowMultiple: true,
      };
      break;
    case 'dropdown':
      baseField.label = 'Category';
      baseField.columnHeader = ensureUniqueColumnHeader('Category', id, existingFields);
      baseField.placeholder = 'Choose an item...';
      baseField.choiceConfig = {
        options: [
          { id: 'opt_1', label: 'General Inquiry', value: 'General Inquiry' },
          { id: 'opt_2', label: 'Technical Support', value: 'Technical Support' },
          { id: 'opt_3', label: 'Sales & Billing', value: 'Sales & Billing' },
        ],
        defaultSelected: [],
        allowMultiple: false,
      };
      break;
    case 'multi_select':
      baseField.label = 'Skills & Interests';
      baseField.columnHeader = ensureUniqueColumnHeader('Skills & Interests', id, existingFields);
      baseField.placeholder = 'Select multiple items...';
      baseField.choiceConfig = {
        options: [
          { id: 'opt_1', label: 'Automation', value: 'Automation' },
          { id: 'opt_2', label: 'Analytics', value: 'Analytics' },
          { id: 'opt_3', label: 'Design', value: 'Design' },
          { id: 'opt_4', label: 'Engineering', value: 'Engineering' },
        ],
        defaultSelected: [],
        allowMultiple: true,
      };
      break;
    case 'linear_scale':
      baseField.label = 'How satisfied are you?';
      baseField.columnHeader = ensureUniqueColumnHeader('Satisfaction Scale', id, existingFields);
      baseField.defaultValue = '5';
      baseField.choiceConfig = {
        scaleMin: 1,
        scaleMax: 5,
        scaleMinLabel: 'Not satisfied',
        scaleMaxLabel: 'Very satisfied',
      };
      break;
    case 'star_rating':
      baseField.label = 'Overall Rating';
      baseField.columnHeader = ensureUniqueColumnHeader('Overall Rating', id, existingFields);
      baseField.defaultValue = '5';
      baseField.choiceConfig = {
        starMax: 5,
      };
      break;
    case 'toggle':
      baseField.label = 'Subscribe to updates?';
      baseField.columnHeader = ensureUniqueColumnHeader('Subscribe Updates', id, existingFields);
      baseField.defaultValue = true;
      break;
    case 'mc_grid':
      baseField.label = 'Service Evaluation';
      baseField.columnHeader = ensureUniqueColumnHeader('Service Evaluation', id, existingFields);
      baseField.choiceConfig = {
        gridRows: ['Speed', 'Reliability', 'Support'],
        gridColumns: ['Poor', 'Average', 'Excellent'],
        gridOutputMode: 'separate_columns',
      };
      break;
    case 'checkbox_grid':
      baseField.label = 'Feature Availability';
      baseField.columnHeader = ensureUniqueColumnHeader('Feature Availability', id, existingFields);
      baseField.choiceConfig = {
        gridRows: ['Morning', 'Afternoon', 'Evening'],
        gridColumns: ['Mon-Wed', 'Thu-Fri', 'Weekend'],
        gridOutputMode: 'separate_columns',
      };
      break;
    case 'heading':
      baseField.label = 'Section Heading';
      baseField.description = 'Add context or instructions for the fields below.';
      baseField.layoutConfig = { headingLevel: 'h2' };
      baseField.design.fontSize = 'xl';
      break;
    case 'description':
      baseField.label = 'Informational Note';
      baseField.description =
        'All responses submitted through this form are formatted and appended to Google Sheets in real time.';
      break;
    case 'section':
      baseField.label = 'Contact Information';
      baseField.description = 'Please enter your primary contact details.';
      break;
    case 'divider':
      baseField.label = 'Divider';
      break;
    case 'image':
      baseField.label = 'Banner Image';
      baseField.description = 'Optional image caption';
      baseField.layoutConfig = {
        mediaUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1000&q=80',
        altText: 'Data analytics dashboard banner',
      };
      baseField.design.alignment = 'center';
      break;
    case 'video':
      baseField.label = 'Walkthrough Video';
      baseField.description = 'Watch a quick overview before submitting.';
      baseField.layoutConfig = {
        mediaUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      };
      break;
    case 'page_break':
      baseField.label = 'Page 2';
      baseField.description = 'Continue to the next step';
      baseField.layoutConfig = {
        nextButtonText: 'Next Step',
        prevButtonText: 'Back',
      };
      break;
  }

  return baseField;
}

export interface SheetColumnDefinition {
  key: string;
  fieldId: string;
  header: string;
  type: GoogleSheetDataType;
  required: boolean;
  rowSubKey?: string;
}

export function getOrderedColumnsForForm(fields: FormFieldConfig[]): SheetColumnDefinition[] {
  const sorted = [...fields].sort((a, b) => a.order - b.order);
  const cols: SheetColumnDefinition[] = [];
  const usedHeaders = new Set<string>(['timestamp']);

  const addUniqueCol = (
    key: string,
    fieldId: string,
    desiredHeader: string,
    type: GoogleSheetDataType,
    required: boolean,
    rowSubKey?: string
  ) => {
    let header = desiredHeader.trim() || 'Column';
    let candidate = header;
    let suffix = 2;
    while (usedHeaders.has(candidate.toLowerCase())) {
      candidate = `${header} (${suffix++})`;
    }
    usedHeaders.add(candidate.toLowerCase());
    cols.push({ key, fieldId, header: candidate, type, required, rowSubKey });
  };

  sorted.forEach((field) => {
    const caps = getComponentCapabilities(field.type);
    if (!caps.isDataField) return;

    if (field.type === 'mc_grid') {
      const rows = field.choiceConfig.gridRows || [];
      rows.forEach((rowLabel, idx) => {
        addUniqueCol(
          `${field.id}__row_${idx}`,
          field.id,
          `${field.columnHeader} [${rowLabel}]`,
          'TEXT',
          !!field.required,
          rowLabel
        );
      });
    } else if (field.type === 'checkbox_grid') {
      const mode = field.choiceConfig.gridOutputMode || 'separate_columns';
      if (mode === 'separate_columns') {
        const rows = field.choiceConfig.gridRows || [];
        rows.forEach((rowLabel, idx) => {
          addUniqueCol(
            `${field.id}__row_${idx}`,
            field.id,
            `${field.columnHeader} [${rowLabel}]`,
            'TEXT',
            !!field.required,
            rowLabel
          );
        });
      } else {
        addUniqueCol(field.id, field.id, field.columnHeader, 'TEXT', !!field.required);
      }
    } else {
      addUniqueCol(
        field.id,
        field.id,
        field.columnHeader || field.label,
        getSheetDataType(field.type),
        !!field.required
      );
    }
  });

  return cols;
}

export function mapSubmissionToSheetRow(
  form: CustomFormConfig,
  values: Record<string, any>,
  uploadedFiles: Record<string, UploadedFilePayload>
): CustomFormSubmission {
  const submittedAt = new Date().toLocaleString();
  const columnDefs = getOrderedColumnsForForm(form.fields);
  const fieldsById = new Map(form.fields.map((f) => [f.id, f]));

  const columns = columnDefs.map((col) => {
    const field = fieldsById.get(col.fieldId);
    if (!field) {
      return { header: col.header, type: col.type, value: '' };
    }

    const raw = values[field.id];

    // Empty optional field handling
    if (field.type === 'toggle') {
      const boolVal = raw !== undefined ? Boolean(raw) : Boolean(field.defaultValue);
      return { header: col.header, type: 'BOOLEAN' as GoogleSheetDataType, value: boolVal };
    }

    if (field.type === 'number' || field.type === 'linear_scale' || field.type === 'star_rating') {
      if (raw === undefined || raw === null || raw === '') {
        return { header: col.header, type: 'NUMBER' as GoogleSheetDataType, value: '' };
      }
      const num = Number(raw);
      return {
        header: col.header,
        type: 'NUMBER' as GoogleSheetDataType,
        value: Number.isNaN(num) ? '' : num,
      };
    }

    if (field.type === 'date') {
      return {
        header: col.header,
        type: 'DATE' as GoogleSheetDataType,
        value: raw ? String(raw) : '',
      };
    }

    if (field.type === 'time') {
      return {
        header: col.header,
        type: 'TIME' as GoogleSheetDataType,
        value: raw ? String(raw) : '',
      };
    }

    if (field.type === 'datetime') {
      return {
        header: col.header,
        type: 'DATETIME' as GoogleSheetDataType,
        value: raw ? String(raw).replace('T', ' ') : '',
      };
    }

    if (field.type === 'file_upload' || field.type === 'image_upload') {
      const filePayload = uploadedFiles[field.id];
      const urlValue = filePayload
        ? filePayload.previewUrl || `https://drive.google.com/file/d/pending_${encodeURIComponent(filePayload.fileName)}`
        : typeof raw === 'string'
        ? raw
        : '';
      return {
        header: col.header,
        type: col.type,
        value: urlValue,
      };
    }

    if (field.type === 'checkboxes' || field.type === 'multi_select') {
      const arr = Array.isArray(raw) ? raw : raw ? [String(raw)] : [];
      return {
        header: col.header,
        type: 'TEXT' as GoogleSheetDataType,
        value: arr.join(', '),
      };
    }

    if (field.type === 'radio' || field.type === 'dropdown') {
      if (Array.isArray(raw)) {
        return { header: col.header, type: 'TEXT' as GoogleSheetDataType, value: raw.join(', ') };
      }
      return {
        header: col.header,
        type: 'TEXT' as GoogleSheetDataType,
        value: raw !== undefined && raw !== null ? String(raw) : '',
      };
    }

    if (field.type === 'mc_grid') {
      const gridVal = (raw && typeof raw === 'object' ? raw : {}) as Record<string, string>;
      const cellVal = col.rowSubKey ? gridVal[col.rowSubKey] || '' : '';
      return { header: col.header, type: 'TEXT' as GoogleSheetDataType, value: cellVal };
    }

    if (field.type === 'checkbox_grid') {
      const gridVal = (raw && typeof raw === 'object' ? raw : {}) as Record<string, string[]>;
      if (col.rowSubKey) {
        const selectedCols = Array.isArray(gridVal[col.rowSubKey]) ? gridVal[col.rowSubKey] : [];
        return {
          header: col.header,
          type: 'TEXT' as GoogleSheetDataType,
          value: selectedCols.join(', '),
        };
      }
      // Combined text mode
      const rows = field.choiceConfig.gridRows || [];
      const parts = rows
        .map((r) => {
          const vals = Array.isArray(gridVal[r]) ? gridVal[r] : [];
          return vals.length > 0 ? `${r}: ${vals.join(', ')}` : '';
        })
        .filter(Boolean);
      return {
        header: col.header,
        type: 'TEXT' as GoogleSheetDataType,
        value: parts.join(' | '),
      };
    }

    return {
      header: col.header,
      type: col.type,
      value: raw !== undefined && raw !== null ? String(raw) : '',
    };
  });

  return {
    id: `csub_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    formId: form.id,
    formTitle: form.settings.title,
    sheetName: form.settings.sheetName || 'CustomResponses',
    submittedAt,
    columns,
    rawValues: values,
  };
}

export const DEFAULT_FORM_SETTINGS: FormSettingsConfig = {
  title: 'Project Onboarding & Intake Form',
  description: 'Configure fields, customize styles, and store responses directly in Google Sheets.',
  sheetName: 'CustomResponses',
  backgroundColor: '#ffffff',
  primaryColor: '#059669',
  secondaryColor: '#0f172a',
  fontFamily: 'Plus Jakarta Sans',
  formWidth: 'medium',
  inputStyle: 'outlined',
  buttonStyle: 'solid',
  sectionLayout: 'stacked',
  submitButtonText: 'Submit to Google Sheets',
  successMessage: 'Thank you! Your response has been formatted and saved to Google Sheets.',
};

export function createStarterCustomForms(): CustomFormConfig[] {
  const baseFields: FormFieldConfig[] = [];

  const push = (
    type: FormComponentType,
    overrides: Partial<FormFieldConfig> = {}
  ) => {
    const f = createDefaultField(type, baseFields);
    const merged: FormFieldConfig = {
      ...f,
      ...overrides,
      order: baseFields.length,
      validation: { ...f.validation, ...(overrides.validation || {}) },
      choiceConfig: { ...f.choiceConfig, ...(overrides.choiceConfig || {}) },
      layoutConfig: { ...f.layoutConfig, ...(overrides.layoutConfig || {}) },
      design: { ...f.design, ...(overrides.design || {}) },
    };
    if (overrides.label && !overrides.columnHeader) {
      merged.columnHeader = ensureUniqueColumnHeader(overrides.label, merged.id, baseFields);
    }
    baseFields.push(merged);
  };

  push('section', {
    label: 'Applicant Overview',
    description: 'Basic contact details mapped to Google Sheets text & contact columns.',
  });
  push('short_text', {
    label: 'Full Name',
    columnHeader: 'Full Name',
    placeholder: 'e.g. Jordan Rivera',
    required: true,
    width: 'half',
  });
  push('email', {
    label: 'Work Email',
    columnHeader: 'Work Email',
    placeholder: 'jordan@company.com',
    required: true,
    width: 'half',
  });
  push('dropdown', {
    label: 'Department',
    columnHeader: 'Department',
    required: true,
    width: 'half',
    choiceConfig: {
      options: [
        { id: 'd1', label: 'Engineering', value: 'Engineering' },
        { id: 'd2', label: 'Product & Design', value: 'Product & Design' },
        { id: 'd3', label: 'Marketing', value: 'Marketing' },
        { id: 'd4', label: 'Operations', value: 'Operations' },
      ],
    },
  });
  push('date', {
    label: 'Target Launch Date',
    columnHeader: 'Target Launch Date',
    width: 'half',
  });
  push('star_rating', {
    label: 'Priority Score',
    columnHeader: 'Priority Score',
    defaultValue: '5',
    choiceConfig: { starMax: 5 },
    width: 'half',
  });
  push('toggle', {
    label: 'Requires Google Drive Folder?',
    columnHeader: 'Drive Folder Needed',
    defaultValue: true,
    width: 'half',
  });
  push('long_text', {
    label: 'Project Scope & Notes',
    columnHeader: 'Project Scope & Notes',
    placeholder: 'Describe your goals or integration requirements...',
  });

  return [
    {
      id: 'form_onboarding_starter',
      updatedAt: new Date().toLocaleString(),
      settings: { ...DEFAULT_FORM_SETTINGS },
      fields: baseFields,
    },
  ];
}

export function createBlankCustomForm(title = 'Untitled Custom Form'): CustomFormConfig {
  const safeSheetName = title.replace(/[^a-zA-Z0-9 _-]/g, '').trim().slice(0, 28) || 'CustomSheet';
  return {
    id: `form_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    updatedAt: new Date().toLocaleString(),
    settings: {
      ...DEFAULT_FORM_SETTINGS,
      title,
      description: 'Add components from the left panel to design your custom form.',
      sheetName: safeSheetName,
    },
    fields: [],
  };
}

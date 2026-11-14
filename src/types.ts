export type FormType = 'registration' | 'userDetails' | 'feedback';

export interface RegistrationSubmission {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  organization: string;
  ticketType: 'Standard' | 'VIP' | 'Student' | 'Speaker';
  track: 'Frontend' | 'Google Apps Script' | 'Cloud & Backend' | 'AI & Automation';
  dietary: string;
  needAccommodation: boolean;
  notes: string;
  submittedAt: string;
}

export interface UserDetailsSubmission {
  id: string;
  username: string;
  fullName: string;
  workEmail: string;
  department: 'Engineering' | 'Product' | 'Design' | 'Marketing' | 'Operations' | 'Human Resources';
  jobTitle: string;
  accessLevel: 'Administrator' | 'Manager' | 'Standard Member' | 'Read Only';
  region: string;
  twoFactorEnabled: boolean;
  internalNotes: string;
  submittedAt: string;
}

export interface FeedbackSubmission {
  id: string;
  customerName: string;
  email: string;
  category: 'Feature Request' | 'Bug Report' | 'UI / UX Design' | 'Performance' | 'General Feedback';
  rating: number; // 1-5
  npsScore: number; // 0-10
  feedbackMessage: string;
  wouldRecommend: 'Yes' | 'Maybe' | 'No';
  priority: 'Low' | 'Medium' | 'High';
  submittedAt: string;
}

export interface SheetRow {
  id: string;
  timestamp: string;
  [key: string]: any;
}

export interface WebAppConfig {
  scriptUrl: string;
  syncToRealSheet: boolean;
  lastResponseStatus?: 'success' | 'error' | 'pending' | null;
  lastLog?: string;
}

// ==========================================
// Dynamic Form Builder & Customizer Types
// ==========================================

export type BasicComponentType =
  | 'short_text'
  | 'long_text'
  | 'number'
  | 'email'
  | 'phone'
  | 'url'
  | 'date'
  | 'time'
  | 'datetime'
  | 'file_upload'
  | 'image_upload';

export type ChoiceComponentType =
  | 'radio'
  | 'checkboxes'
  | 'dropdown'
  | 'multi_select'
  | 'linear_scale'
  | 'star_rating'
  | 'toggle'
  | 'mc_grid'
  | 'checkbox_grid';

export type LayoutComponentType =
  | 'heading'
  | 'description'
  | 'section'
  | 'divider'
  | 'image'
  | 'video'
  | 'page_break';

export type FormComponentType =
  | BasicComponentType
  | ChoiceComponentType
  | LayoutComponentType;

export type GoogleSheetDataType =
  | 'TEXT'
  | 'NUMBER'
  | 'DATE'
  | 'TIME'
  | 'DATETIME'
  | 'BOOLEAN'
  | 'FILE URL'
  | 'IMAGE URL'
  | 'SEPARATE COLUMNS'
  | 'COMBINED OR SEPARATE'
  | 'LAYOUT ONLY';

export interface FormFieldChoiceOption {
  id: string;
  label: string;
  value: string;
}

export interface FormFieldValidation {
  minLength?: number;
  maxLength?: number;
  minValue?: string;
  maxValue?: string;
  validateEmail?: boolean;
  validatePhone?: boolean;
  validateUrl?: boolean;
  allowedFileTypes?: string; // e.g. ".pdf,.docx,.png"
  maxFileSizeMB?: number;
  customErrorMessage?: string;
}

export interface FormFieldChoiceConfig {
  options?: FormFieldChoiceOption[];
  defaultSelected?: string[];
  allowMultiple?: boolean;
  scaleMin?: number;
  scaleMax?: number;
  scaleMinLabel?: string;
  scaleMaxLabel?: string;
  starMax?: number;
  gridRows?: string[];
  gridColumns?: string[];
  gridOutputMode?: 'separate_columns' | 'combined_text';
}

export interface FormFieldLayoutConfig {
  headingLevel?: 'h1' | 'h2' | 'h3';
  mediaUrl?: string;
  altText?: string;
  nextButtonText?: string;
  prevButtonText?: string;
}

export interface FormFieldDesign {
  labelColor?: string;
  inputBackground?: string;
  textColor?: string;
  borderColor?: string;
  borderRadius?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | 'full';
  fontSize?: 'xs' | 'sm' | 'base' | 'lg' | 'xl';
  spacing?: 'compact' | 'normal' | 'relaxed';
  alignment?: 'left' | 'center' | 'right';
}

export interface FormFieldConfig {
  id: string;
  type: FormComponentType;
  label: string;
  columnHeader: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: any;
  width: 'full' | 'half' | 'custom';
  customWidthPercent?: number;
  visible: boolean;
  order: number;
  validation: FormFieldValidation;
  choiceConfig: FormFieldChoiceConfig;
  layoutConfig: FormFieldLayoutConfig;
  design: FormFieldDesign;
}

export interface FormSettingsConfig {
  title: string;
  description: string;
  sheetName: string;
  backgroundColor: string;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: 'Plus Jakarta Sans' | 'Inter' | 'System UI' | 'Georgia' | 'JetBrains Mono';
  formWidth: 'narrow' | 'medium' | 'wide' | 'full';
  inputStyle: 'outlined' | 'filled' | 'underlined' | 'minimal';
  buttonStyle: 'solid' | 'outline' | 'pill' | 'soft';
  sectionLayout: 'stacked' | 'card' | 'bordered' | 'two-column';
  submitButtonText: string;
  successMessage: string;
}

export interface CustomFormConfig {
  id: string;
  updatedAt: string;
  settings: FormSettingsConfig;
  fields: FormFieldConfig[];
}

export interface UploadedFilePayload {
  fieldId: string;
  columnHeader: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  base64Data?: string;
  previewUrl: string;
}

export interface CustomFormSubmission {
  id: string;
  formId: string;
  formTitle: string;
  sheetName: string;
  submittedAt: string;
  columns: {
    header: string;
    type: GoogleSheetDataType;
    value: string | number | boolean;
  }[];
  rawValues: Record<string, any>;
}

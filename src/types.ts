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

// ==========================================
// Role-Based Form Management System Types
// ==========================================

export type UserRole = 'ADMIN' | 'USER';
export type AccountStatus = 'ACTIVE' | 'DEACTIVATED';
export type FormStatus = 'DRAFT' | 'PUBLISHED' | 'SUSPENDED';
export type FormAccessMode = 'PUBLIC_ANONYMOUS' | 'REQUIRE_LOGIN';

export interface UserProfile {
  id: string;
  googleId: string;
  fullName: string;
  email: string;
  profilePictureUrl: string | null;
  role: UserRole;
  accountStatus: AccountStatus;
  createdAt: string;
  lastLogin: string;
  formCount?: number;
  submissionCount?: number;
  sheetsConnected?: boolean;
}

export interface ManagedFormRecord extends CustomFormConfig {
  ownerId: string;
  ownerName: string;
  ownerEmail: string;
  title: string;
  description: string;
  sheetName: string;
  status: FormStatus;
  publicToken: string;
  accessMode: FormAccessMode;
  oneResponsePerUser: boolean;
  expiresAt: string | null;
  maxResponses: number | null;
  submissionsEnabled: boolean;
  isReported: boolean;
  reportReason: string | null;
  spreadsheetId: string | null;
  spreadsheetName: string | null;
  appsScriptUrl: string | null;
  responseCount: number;
  createdAt: string;
}

export interface FormResponseRecord {
  id: string;
  formId: string;
  formTitle?: string;
  formOwnerEmail?: string;
  respondentUserId: string | null;
  respondentName: string;
  respondentEmail: string | null;
  isAnonymous: boolean;
  columns: {
    header: string;
    type: GoogleSheetDataType;
    value: string | number | boolean;
  }[];
  rawValues?: Record<string, any>;
  sheetsSyncStatus: 'LOCAL_ONLY' | 'SYNCED' | 'TOKEN_EXPIRED' | 'SYNC_FAILED';
  sheetsSyncError?: string | null;
  submittedAt: string;
}

export interface GoogleIntegrationStatus {
  connected: boolean;
  tokenStatus: 'CONNECTED' | 'NEEDS_REAUTH' | 'DISCONNECTED';
  googleEmail: string | null;
  scopes?: string[];
  updatedAt?: string;
}

export interface SpreadsheetSummary {
  id: string;
  name: string;
  webViewLink: string;
  modifiedTime?: string;
}

export interface AuditLogEntry {
  id: string;
  actor_user_id: string | null;
  actor_email: string | null;
  actor_role: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  details: string | null;
  ip_address: string | null;
  created_at: string;
}

export interface PlatformSettingsConfig {
  allowPublicRegistration: boolean;
  allowAnonymousForms: boolean;
  maxFormsPerUser: number;
  disabledComponentTypes: FormComponentType[];
  maintenanceMode: boolean;
}


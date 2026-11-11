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

-- Migration 001: Initial Role-Based Form Management System Schema
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS schema_migrations (
  version TEXT PRIMARY KEY,
  applied_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  google_id TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  profile_picture_url TEXT,
  role TEXT NOT NULL CHECK(role IN ('ADMIN', 'USER')) DEFAULT 'USER',
  account_status TEXT NOT NULL CHECK(account_status IN ('ACTIVE', 'DEACTIVATED')) DEFAULT 'ACTIVE',
  created_at TEXT NOT NULL,
  last_login TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, account_status);

CREATE TABLE IF NOT EXISTS forms (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  owner_name TEXT NOT NULL,
  owner_email TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  sheet_name TEXT NOT NULL DEFAULT 'CustomResponses',
  form_configuration TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('DRAFT', 'PUBLISHED', 'SUSPENDED')) DEFAULT 'DRAFT',
  public_token TEXT NOT NULL UNIQUE,
  access_mode TEXT NOT NULL CHECK(access_mode IN ('PUBLIC_ANONYMOUS', 'REQUIRE_LOGIN')) DEFAULT 'PUBLIC_ANONYMOUS',
  one_response_per_user INTEGER NOT NULL DEFAULT 0,
  expires_at TEXT,
  max_responses INTEGER,
  submissions_enabled INTEGER NOT NULL DEFAULT 1,
  is_reported INTEGER NOT NULL DEFAULT 0,
  report_reason TEXT,
  spreadsheet_id TEXT,
  spreadsheet_name TEXT,
  apps_script_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_forms_owner_id ON forms(owner_id);
CREATE INDEX IF NOT EXISTS idx_forms_public_token ON forms(public_token);
CREATE INDEX IF NOT EXISTS idx_forms_status ON forms(status);
CREATE INDEX IF NOT EXISTS idx_forms_updated_at ON forms(updated_at);

CREATE TABLE IF NOT EXISTS form_fields (
  id TEXT PRIMARY KEY,
  form_id TEXT NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  field_key TEXT NOT NULL,
  field_type TEXT NOT NULL,
  label TEXT NOT NULL,
  column_header TEXT NOT NULL,
  field_order INTEGER NOT NULL,
  required INTEGER NOT NULL DEFAULT 0,
  field_configuration TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(form_id, field_key)
);

CREATE INDEX IF NOT EXISTS idx_form_fields_form_order ON form_fields(form_id, field_order);

CREATE TABLE IF NOT EXISTS form_responses (
  id TEXT PRIMARY KEY,
  form_id TEXT NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  respondent_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  respondent_google_id TEXT,
  respondent_name TEXT NOT NULL DEFAULT 'Anonymous',
  respondent_email TEXT,
  is_anonymous INTEGER NOT NULL DEFAULT 1,
  response_data TEXT NOT NULL,
  sheets_sync_status TEXT NOT NULL CHECK(sheets_sync_status IN ('LOCAL_ONLY', 'SYNCED', 'TOKEN_EXPIRED', 'SYNC_FAILED')) DEFAULT 'LOCAL_ONLY',
  sheets_sync_error TEXT,
  submitted_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_form_responses_form_submitted ON form_responses(form_id, submitted_at);
CREATE INDEX IF NOT EXISTS idx_form_responses_respondent ON form_responses(respondent_user_id);

CREATE TABLE IF NOT EXISTS google_integrations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'google_sheets',
  google_email TEXT,
  encrypted_access_token TEXT NOT NULL,
  iv TEXT NOT NULL,
  auth_tag TEXT NOT NULL,
  scopes TEXT NOT NULL,
  token_status TEXT NOT NULL CHECK(token_status IN ('CONNECTED', 'NEEDS_REAUTH', 'DISCONNECTED')) DEFAULT 'CONNECTED',
  expires_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_google_integrations_user ON google_integrations(user_id);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  actor_user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  actor_email TEXT,
  actor_role TEXT,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT,
  details TEXT,
  ip_address TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_by TEXT,
  updated_at TEXT NOT NULL
);

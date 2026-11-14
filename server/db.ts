import Database from 'better-sqlite3';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export type UserRole = 'ADMIN' | 'USER';
export type AccountStatus = 'ACTIVE' | 'DEACTIVATED';
export type FormStatus = 'DRAFT' | 'PUBLISHED' | 'SUSPENDED';
export type FormAccessMode = 'PUBLIC_ANONYMOUS' | 'REQUIRE_LOGIN';

export interface DbUser {
  id: string;
  google_id: string;
  full_name: string;
  email: string;
  profile_picture_url: string | null;
  role: UserRole;
  account_status: AccountStatus;
  created_at: string;
  last_login: string;
}

export interface DbForm {
  id: string;
  owner_id: string;
  owner_name: string;
  owner_email: string;
  title: string;
  description: string;
  sheet_name: string;
  form_configuration: string;
  status: FormStatus;
  public_token: string;
  access_mode: FormAccessMode;
  one_response_per_user: number;
  expires_at: string | null;
  max_responses: number | null;
  submissions_enabled: number;
  is_reported: number;
  report_reason: string | null;
  spreadsheet_id: string | null;
  spreadsheet_name: string | null;
  apps_script_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbFormField {
  id: string;
  form_id: string;
  field_key: string;
  field_type: string;
  label: string;
  column_header: string;
  field_order: number;
  required: number;
  field_configuration: string;
  created_at: string;
  updated_at: string;
}

export interface DbFormResponse {
  id: string;
  form_id: string;
  respondent_user_id: string | null;
  respondent_google_id: string | null;
  respondent_name: string;
  respondent_email: string | null;
  is_anonymous: number;
  response_data: string;
  sheets_sync_status: 'LOCAL_ONLY' | 'SYNCED' | 'TOKEN_EXPIRED' | 'SYNC_FAILED';
  sheets_sync_error: string | null;
  submitted_at: string;
}

export interface DbGoogleIntegration {
  id: string;
  user_id: string;
  provider: string;
  google_email: string | null;
  encrypted_access_token: string;
  iv: string;
  auth_tag: string;
  scopes: string;
  token_status: 'CONNECTED' | 'NEEDS_REAUTH' | 'DISCONNECTED';
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbAuditLog {
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

const DEFAULT_DB_PATH = process.env.SQLITE_DB_PATH || path.resolve(process.cwd(), 'data', 'fdocx.db');
const dbDir = path.dirname(DEFAULT_DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

export const db = new Database(DEFAULT_DB_PATH);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Run SQL migrations idempotently
export function runMigrations(): void {
  const migrationsDir = path.resolve(process.cwd(), 'migrations');
  if (!fs.existsSync(migrationsDir)) return;

  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TEXT NOT NULL
    );
  `);

  const checkStmt = db.prepare('SELECT version FROM schema_migrations WHERE version = ?');
  const markStmt = db.prepare('INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?)');

  for (const file of files) {
    const existing = checkStmt.get(file);
    if (!existing) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      db.exec(sql);
      markStmt.run(file, new Date().toISOString());
    }
  }

  // Seed default platform settings if absent
  const defaultSettings: Record<string, any> = {
    allowPublicRegistration: true,
    allowAnonymousForms: true,
    maxFormsPerUser: 100,
    disabledComponentTypes: [],
    maintenanceMode: false,
  };
  const insertSetting = db.prepare(
    'INSERT OR IGNORE INTO platform_settings (key, value, updated_by, updated_at) VALUES (?, ?, ?, ?)'
  );
  const now = new Date().toISOString();
  for (const [k, v] of Object.entries(defaultSettings)) {
    insertSetting.run(k, JSON.stringify(v), 'system', now);
  }
}

runMigrations();

// Bootstrapped initial admin emails from environment (fallback to workspace owner email)
export function getBootstrappedAdminEmails(): Set<string> {
  const raw = process.env.ADMIN_EMAILS || 'itzbarath07@gmail.com';
  return new Set(
    raw
      .split(',')
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean)
  );
}

// Encryption utilities for OAuth tokens
function getEncryptionKey(): Buffer {
  const raw =
    process.env.TOKEN_ENCRYPTION_KEY ||
    process.env.SESSION_SECRET ||
    'fdocx-default-dev-key-change-in-production-env';
  return crypto.createHash('sha256').update(raw).digest();
}

export function encryptToken(plaintext: string): {
  encrypted: string;
  iv: string;
  authTag: string;
} {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let encrypted = cipher.update(plaintext, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  const authTag = cipher.getAuthTag().toString('base64');
  return {
    encrypted,
    iv: iv.toString('base64'),
    authTag,
  };
}

export function decryptToken(encrypted: string, ivB64: string, authTagB64: string): string {
  const key = getEncryptionKey();
  const iv = Buffer.from(ivB64, 'base64');
  const authTag = Buffer.from(authTagB64, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encrypted, 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// XSS / Input sanitization helpers
export function sanitizeString(val: unknown, maxLen = 5000): string {
  if (val === null || val === undefined) return '';
  const str = String(val);
  // Strip script tags, inline event handlers, and null bytes
  const cleaned = str
    .replace(/\0/g, '')
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
  return cleaned.slice(0, maxLen);
}

export function sanitizeValueRecursive(val: unknown, depth = 0): any {
  if (depth > 6) return null;
  if (val === null || val === undefined) return val;
  if (typeof val === 'string') return sanitizeString(val, 20000);
  if (typeof val === 'number' || typeof val === 'boolean') return val;
  if (Array.isArray(val)) return val.slice(0, 500).map((item) => sanitizeValueRecursive(item, depth + 1));
  if (typeof val === 'object') {
    const out: Record<string, any> = {};
    for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
      const cleanKey = sanitizeString(k, 200);
      if (cleanKey) {
        out[cleanKey] = sanitizeValueRecursive(v, depth + 1);
      }
    }
    return out;
  }
  return String(val);
}

export function generatePublicToken(): string {
  return crypto.randomBytes(9).toString('base64url');
}

export function generateId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, '').slice(0, 16)}`;
}

// Immutable audit log insertion
export function appendAuditLog(entry: {
  actorUserId?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  details?: Record<string, any> | null;
  ipAddress?: string | null;
}): void {
  try {
    const stmt = db.prepare(`
      INSERT INTO audit_logs (
        id, actor_user_id, actor_email, actor_role, action, target_type, target_id, details, ip_address, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      generateId('log'),
      entry.actorUserId ?? null,
      entry.actorEmail ?? null,
      entry.actorRole ?? null,
      sanitizeString(entry.action, 100),
      sanitizeString(entry.targetType, 100),
      entry.targetId ?? null,
      entry.details ? JSON.stringify(sanitizeValueRecursive(entry.details)) : null,
      entry.ipAddress ?? null,
      new Date().toISOString()
    );
  } catch (err) {
    console.error('Failed to write audit log:', err);
  }
}

// User operations
export function upsertUserFromGoogleAuth(profile: {
  googleId: string;
  email: string;
  fullName: string;
  picture?: string | null;
}): DbUser {
  const normalizedEmail = profile.email.trim().toLowerCase();
  const now = new Date().toISOString();

  const existing = db
    .prepare('SELECT * FROM users WHERE google_id = ? OR LOWER(email) = ?')
    .get(profile.googleId, normalizedEmail) as DbUser | undefined;

  if (existing) {
    // Preserve role & account_status strictly from DB! Never allow client override.
    // Only auto-bootstrap if ZERO active admins exist AND this email is in ADMIN_EMAILS.
    let nextRole: UserRole = existing.role;
    const activeAdminCount = (
      db
        .prepare("SELECT COUNT(*) as cnt FROM users WHERE role = 'ADMIN' AND account_status = 'ACTIVE'")
        .get() as { cnt: number }
    ).cnt;
    if (activeAdminCount === 0 && getBootstrappedAdminEmails().has(normalizedEmail)) {
      nextRole = 'ADMIN';
    }

    db.prepare(`
      UPDATE users
      SET google_id = ?, full_name = ?, email = ?, profile_picture_url = ?, role = ?, last_login = ?
      WHERE id = ?
    `).run(
      profile.googleId,
      sanitizeString(profile.fullName || normalizedEmail.split('@')[0], 120),
      normalizedEmail,
      profile.picture ? sanitizeString(profile.picture, 1000) : existing.profile_picture_url,
      nextRole,
      now,
      existing.id
    );

    return db.prepare('SELECT * FROM users WHERE id = ?').get(existing.id) as DbUser;
  }

  // New account: USER role by default, unless matching initial bootstrapped ADMIN_EMAILS
  const isBootstrapAdmin = getBootstrappedAdminEmails().has(normalizedEmail);
  const initialRole: UserRole = isBootstrapAdmin ? 'ADMIN' : 'USER';
  const newId = generateId('usr');

  db.prepare(`
    INSERT INTO users (
      id, google_id, full_name, email, profile_picture_url, role, account_status, created_at, last_login
    ) VALUES (?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)
  `).run(
    newId,
    profile.googleId,
    sanitizeString(profile.fullName || normalizedEmail.split('@')[0], 120),
    normalizedEmail,
    profile.picture ? sanitizeString(profile.picture, 1000) : null,
    initialRole,
    now,
    now
  );

  return db.prepare('SELECT * FROM users WHERE id = ?').get(newId) as DbUser;
}

export function getUserById(id: string): DbUser | undefined {
  return db.prepare('SELECT * FROM users WHERE id = ?').get(id) as DbUser | undefined;
}

export function countActiveAdmins(): number {
  const row = db
    .prepare("SELECT COUNT(*) as cnt FROM users WHERE role = 'ADMIN' AND account_status = 'ACTIVE'")
    .get() as { cnt: number };
  return row.cnt;
}

export function getPlatformSettings(): Record<string, any> {
  const rows = db.prepare('SELECT key, value FROM platform_settings').all() as { key: string; value: string }[];
  const out: Record<string, any> = {};
  for (const r of rows) {
    try {
      out[r.key] = JSON.parse(r.value);
    } catch {
      out[r.key] = r.value;
    }
  }
  return out;
}

export function savePlatformSettings(patch: Record<string, any>, actorEmail: string): Record<string, any> {
  const now = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO platform_settings (key, value, updated_by, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_by = excluded.updated_by, updated_at = excluded.updated_at
  `);
  const tx = db.transaction((entries: [string, any][]) => {
    for (const [k, v] of entries) {
      stmt.run(sanitizeString(k, 100), JSON.stringify(sanitizeValueRecursive(v)), actorEmail, now);
    }
  });
  tx(Object.entries(patch));
  return getPlatformSettings();
}

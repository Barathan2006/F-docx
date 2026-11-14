import 'dotenv/config';
import crypto from 'crypto';
import cookieParser from 'cookie-parser';
import express, { type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import * as XLSX from 'xlsx';
import {
  AuthenticatedRequest,
  attachOptionalUser,
  clearAuthCookies,
  rateLimit,
  requireAdmin,
  requireAuth,
  requireCsrf,
  setAuthCookies,
  verifyGoogleIdToken,
} from './server/auth';
import {
  DbAuditLog,
  DbForm,
  DbFormField,
  DbFormResponse,
  DbGoogleIntegration,
  DbUser,
  appendAuditLog,
  countActiveAdmins,
  db,
  decryptToken,
  encryptToken,
  generateId,
  getBootstrappedAdminEmails,
  getPlatformSettings,
  getUserById,
  sanitizeString,
  sanitizeValueRecursive,
  savePlatformSettings,
  upsertUserFromGoogleAuth,
} from './server/db';
import {
  GoogleTokenExpiredError,
  appendRowToGoogleSpreadsheet,
  createGoogleSpreadsheet,
  listUserSpreadsheets,
  verifyGoogleWorkspaceToken,
} from './server/sheets';

const app = express();
const PORT = Number(process.env.PORT || 3000);

app.set('trust proxy', 1);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
app.use(attachOptionalUser);

function getClientIp(req: Request): string {
  return (
    (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
    req.socket.remoteAddress ||
    'unknown'
  );
}

function formatUserDto(u: DbUser) {
  return {
    id: u.id,
    googleId: u.google_id,
    fullName: u.full_name,
    email: u.email,
    profilePictureUrl: u.profile_picture_url,
    role: u.role,
    accountStatus: u.account_status,
    createdAt: u.created_at,
    lastLogin: u.last_login,
  };
}

function hydrateFormRecord(formRow: DbForm) {
  const fieldRows = db
    .prepare('SELECT * FROM form_fields WHERE form_id = ? ORDER BY field_order ASC')
    .all(formRow.id) as DbFormField[];

  const responseCountRow = db
    .prepare('SELECT COUNT(*) as cnt FROM form_responses WHERE form_id = ?')
    .get(formRow.id) as { cnt: number };

  let settings: any = {};
  try {
    settings = JSON.parse(formRow.form_configuration);
  } catch {
    settings = {};
  }

  const fields = fieldRows.map((fr) => {
    try {
      return JSON.parse(fr.field_configuration);
    } catch {
      return {
        id: fr.field_key,
        type: fr.field_type,
        label: fr.label,
        columnHeader: fr.column_header,
        order: fr.field_order,
        required: !!fr.required,
      };
    }
  });

  return {
    id: formRow.id,
    ownerId: formRow.owner_id,
    ownerName: formRow.owner_name,
    ownerEmail: formRow.owner_email,
    title: formRow.title,
    description: formRow.description,
    sheetName: formRow.sheet_name,
    status: formRow.status,
    publicToken: formRow.public_token,
    accessMode: formRow.access_mode,
    oneResponsePerUser: !!formRow.one_response_per_user,
    expiresAt: formRow.expires_at,
    maxResponses: formRow.max_responses,
    submissionsEnabled: !!formRow.submissions_enabled,
    isReported: !!formRow.is_reported,
    reportReason: formRow.report_reason,
    spreadsheetId: formRow.spreadsheet_id,
    spreadsheetName: formRow.spreadsheet_name,
    appsScriptUrl: formRow.apps_script_url,
    responseCount: responseCountRow.cnt,
    createdAt: formRow.created_at,
    updatedAt: formRow.updated_at,
    settings,
    fields,
  };
}

function syncFormFieldsTransaction(formId: string, fields: any[], now: string) {
  const delStmt = db.prepare('DELETE FROM form_fields WHERE form_id = ?');
  const insStmt = db.prepare(`
    INSERT INTO form_fields (
      id, form_id, field_key, field_type, label, column_header, field_order, required, field_configuration, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  delStmt.run(formId);

  const seenHeaders = new Set<string>();
  fields.forEach((rawField, idx) => {
    const cleanField = sanitizeValueRecursive(rawField);
    const fieldKey = sanitizeString(cleanField.id || `fld_${idx}_${Date.now()}`, 128);
    const fieldType = sanitizeString(cleanField.type || 'short_text', 64);
    const label = sanitizeString(cleanField.label || 'Untitled Field', 200);
    let colHeader = sanitizeString(cleanField.columnHeader || label || fieldKey, 120);

    // Prevent duplicate column headers in DB
    let uniqueHeader = colHeader;
    let suffix = 2;
    while (seenHeaders.has(uniqueHeader.toLowerCase())) {
      uniqueHeader = `${colHeader} (${suffix++})`;
    }
    seenHeaders.add(uniqueHeader.toLowerCase());

    cleanField.id = fieldKey;
    cleanField.order = idx;
    cleanField.columnHeader = uniqueHeader;

    insStmt.run(
      `${formId}::${fieldKey}`,
      formId,
      fieldKey,
      fieldType,
      label,
      uniqueHeader,
      idx,
      cleanField.required ? 1 : 0,
      JSON.stringify(cleanField),
      now,
      now
    );
  });
}

function canUserAccessForm(user: DbUser, form: DbForm): boolean {
  return user.role === 'ADMIN' || form.owner_id === user.id;
}

// ==========================================
// 1. Existing Apps Script Diagnostic Routes
// ==========================================
app.post('/api/ping-endpoint', async (req: Request, res: Response) => {
  try {
    const { url: targetUrl, payload = {} } = req.body || {};
    if (!targetUrl) {
      return res.status(400).json({ success: false, message: 'URL is required' });
    }

    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      redirect: 'follow',
    });

    const text = await response.text();

    if (text.includes('doPost') && (text.includes('見つかりません') || text.includes('not found'))) {
      return res.json({
        success: false,
        code: 'NO_DOPOST',
        message:
          'Google Apps Script responded: "Script function not found: doPost". In your Google Sheet → Extensions → Apps Script, make sure function doPost(e) is defined, then click Deploy → Manage deployments → Edit → Version: New version → Deploy.',
      });
    }

    if (
      targetUrl.endsWith('/dev') ||
      text.includes('現在、ファイルを開くことができません') ||
      text.includes('ページが見つかりません')
    ) {
      return res.json({
        success: false,
        code: 'DEV_URL_OR_NOT_FOUND',
        message:
          'Google Apps Script warning: URLs ending in "/dev" are private test links requiring your Google account session. For public website forms, deploy as a Web app with "Who has access: Anyone" and use the URL ending in "/exec".',
        suggestion: targetUrl.replace(/\/dev$/, '/exec'),
      });
    }

    if (
      text.includes('accounts.google.com/ServiceLogin') ||
      text.includes('accounts.google.com/v3/signin') ||
      text.includes('Sign in - Google Accounts')
    ) {
      return res.json({
        success: false,
        code: 'AUTH_REQUIRED',
        message:
          'Access Denied: Your Google Apps Script deployment requires Google Sign-In. Click Deploy -> Manage deployments -> Edit -> set "Who has access" to "Anyone" -> Deploy, and use the URL ending in "/exec".',
      });
    }

    let scriptJson: any = null;
    try {
      scriptJson = JSON.parse(text);
    } catch {
      scriptJson = null;
    }

    if (scriptJson && scriptJson.status === 'error') {
      return res.json({
        success: false,
        code: 'SCRIPT_ERROR',
        message: `Google Apps Script Error: ${scriptJson.message}`,
      });
    }

    return res.json({
      success: true,
      status: response.status,
      spreadsheetName: scriptJson?.spreadsheetName || null,
      spreadsheetUrl: scriptJson?.spreadsheetUrl || null,
      message: scriptJson?.spreadsheetName
        ? `Verified! Row appended to Google Sheet "${scriptJson.spreadsheetName}".`
        : 'Verified! Google Apps Script successfully received the payload and executed.',
      responseSnippet: text.slice(0, 150),
    });
  } catch (err: any) {
    return res.json({
      success: false,
      message: `Connection error: ${err.message || 'Network request failed'}`,
    });
  }
});

app.post('/api/fetch-sheet', async (req: Request, res: Response) => {
  try {
    const { url: targetUrl } = req.body || {};
    if (!targetUrl) {
      return res.status(400).json({ success: false, message: 'URL is required' });
    }

    const response = await fetch(targetUrl, {
      method: 'GET',
      redirect: 'follow',
    });
    const text = await response.text();

    if (
      targetUrl.endsWith('/dev') ||
      text.includes('現在、ファイルを開くことができません') ||
      text.includes('ページが見つかりません')
    ) {
      return res.json({
        success: false,
        code: 'DEV_URL_OR_NOT_FOUND',
        message:
          'URL ends with "/dev" (private test link). Deploy as Web App ("Who has access: Anyone") and switch to the "/exec" URL.',
      });
    }

    if (
      text.includes('accounts.google.com/ServiceLogin') ||
      text.includes('accounts.google.com/v3/signin') ||
      text.includes('Sign in - Google Accounts')
    ) {
      return res.json({
        success: false,
        code: 'AUTH_REQUIRED',
        message:
          'Access Denied: In Apps Script, set "Who has access" to "Anyone" and deploy a new Web App version.',
      });
    }

    let scriptJson: any = null;
    try {
      scriptJson = JSON.parse(text);
    } catch {
      scriptJson = null;
    }

    if (!scriptJson) {
      return res.json({
        success: false,
        code: 'NO_DOGET',
        message:
          'Your Apps Script did not return JSON. Paste the updated script (with doGet & doPost) from Integrations Hub and deploy a New version.',
      });
    }

    if (scriptJson.status === 'error') {
      return res.json({
        success: false,
        code: 'SCRIPT_ERROR',
        message: scriptJson.message,
      });
    }

    return res.json({
      success: true,
      spreadsheetName: scriptJson.spreadsheetName || 'Connected Google Sheet',
      spreadsheetUrl: scriptJson.spreadsheetUrl || null,
      sheets: scriptJson.sheets || null,
    });
  } catch (err: any) {
    return res.json({
      success: false,
      message: `Failed to fetch live sheet: ${err.message || 'Network error'}`,
    });
  }
});

// ==========================================
// 2. Authentication & Session Routes
// ==========================================
function verifyAdminSecretCode(submitted: unknown): { ok: boolean; reason?: string } {
  const configuredSecret = (process.env.ADMIN_SECRET_CODE || '').trim();
  if (!configuredSecret) {
    return {
      ok: false,
      reason: 'Admin secret code verification is not configured on the server (set ADMIN_SECRET_CODE).',
    };
  }
  const candidate = typeof submitted === 'string' ? submitted.trim() : '';
  if (!candidate) {
    return { ok: false, reason: 'Administrator secret code is required.' };
  }
  const expectedDigest = crypto.createHash('sha256').update(configuredSecret).digest();
  const submittedDigest = crypto.createHash('sha256').update(candidate).digest();
  if (!crypto.timingSafeEqual(expectedDigest, submittedDigest)) {
    return { ok: false, reason: 'Invalid administrator secret code.' };
  }
  return { ok: true };
}

app.post(
  '/api/auth/session',
  rateLimit('auth', 30, 60_000),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { idToken, loginMode, adminSecretCode, enteredName } = req.body || {};
      if (!idToken || typeof idToken !== 'string') {
        return res.status(400).json({ error: 'Google ID token is required.' });
      }

      const mode = loginMode === 'admin' ? 'admin' : 'user';
      const verifiedProfile = await verifyGoogleIdToken(idToken);

      // Check existing deactivated status before allowing session
      const existing = db
        .prepare('SELECT * FROM users WHERE google_id = ? OR LOWER(email) = ?')
        .get(verifiedProfile.googleId, verifiedProfile.email) as DbUser | undefined;

      if (existing && existing.account_status === 'DEACTIVATED') {
        appendAuditLog({
          actorUserId: existing.id,
          actorEmail: existing.email,
          actorRole: existing.role,
          action: 'LOGIN_BLOCKED_DEACTIVATED',
          targetType: 'user',
          targetId: existing.id,
          ipAddress: getClientIp(req),
        });
        return res
          .status(403)
          .json({ error: 'This account has been deactivated by an administrator.' });
      }

      if (mode === 'admin') {
        const secretCheck = verifyAdminSecretCode(adminSecretCode);
        if (!secretCheck.ok) {
          appendAuditLog({
            actorUserId: existing?.id ?? null,
            actorEmail: verifiedProfile.email,
            actorRole: existing?.role ?? 'USER',
            action: 'ADMIN_LOGIN_FAILED_SECRET',
            targetType: 'auth',
            targetId: existing?.id ?? null,
            details: { reason: secretCheck.reason },
            ipAddress: getClientIp(req),
          });
          return res.status(403).json({
            error: secretCheck.reason || 'Invalid administrator secret code.',
          });
        }

        const isBootstrappedAdmin = getBootstrappedAdminEmails().has(verifiedProfile.email);
        const canAccessAdmin = existing
          ? existing.role === 'ADMIN' || (countActiveAdmins() === 0 && isBootstrappedAdmin)
          : isBootstrappedAdmin;

        if (!canAccessAdmin) {
          appendAuditLog({
            actorUserId: existing?.id ?? null,
            actorEmail: verifiedProfile.email,
            actorRole: existing?.role ?? 'USER',
            action: 'ADMIN_LOGIN_UNAUTHORIZED_ROLE',
            targetType: 'auth',
            targetId: existing?.id ?? null,
            details: {
              reason: existing
                ? 'Authenticated account does not hold ADMIN role.'
                : 'Public registration is prohibited via Admin Access.',
            },
            ipAddress: getClientIp(req),
          });
          return res.status(403).json({
            error: existing
              ? 'Access denied: This Google account does not have ADMIN privileges.'
              : 'Access denied: Public registration as ADMIN is not allowed.',
          });
        }
      }

      // Authoritative identity comes strictly from verified Google profile (never enteredName)
      const user = upsertUserFromGoogleAuth(verifiedProfile);

      if (mode === 'admin' && user.role !== 'ADMIN') {
        return res.status(403).json({
          error: 'Access denied: Administrator privileges required.',
        });
      }

      const csrfToken = setAuthCookies(req, res, user.id);

      appendAuditLog({
        actorUserId: user.id,
        actorEmail: user.email,
        actorRole: user.role,
        action: mode === 'admin' ? 'ADMIN_LOGIN' : existing ? 'USER_LOGIN' : 'USER_REGISTERED',
        targetType: 'user',
        targetId: user.id,
        details: {
          role: user.role,
          loginMode: mode,
          ...(enteredName ? { enteredNameHint: sanitizeString(enteredName, 120) } : {}),
        },
        ipAddress: getClientIp(req),
      });

      return res.json({
        user: formatUserDto(user),
        csrfToken,
      });
    } catch (err: any) {
      return res.status(401).json({
        error: err?.message || 'Google authentication verification failed.',
      });
    }
  }
);

app.post('/api/auth/logout', (req: AuthenticatedRequest, res: Response) => {
  if (req.user) {
    appendAuditLog({
      actorUserId: req.user.id,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'USER_LOGOUT',
      targetType: 'user',
      targetId: req.user.id,
      ipAddress: getClientIp(req),
    });
  }
  clearAuthCookies(req, res);
  res.json({ success: true });
});

app.get('/api/auth/me', (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  return res.json({
    user: formatUserDto(req.user),
    platformSettings: getPlatformSettings(),
  });
});

// ==========================================
// 3. User & Creator Form Management Routes
// ==========================================
app.get('/api/forms', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const rows = db
    .prepare('SELECT * FROM forms WHERE owner_id = ? ORDER BY updated_at DESC')
    .all(user.id) as DbForm[];
  res.json({ forms: rows.map(hydrateFormRecord) });
});

app.post('/api/forms', requireAuth, requireCsrf, (req: AuthenticatedRequest, res: Response) => {
  try {
    const user = req.user!;
    const body = sanitizeValueRecursive(req.body || {});
    const settings = body.settings || {};
    const fields = Array.isArray(body.fields) ? body.fields : [];

    // Enforce platform component restrictions for non-admins
    const platformSettings = getPlatformSettings();
    const disabledTypes = new Set<string>(platformSettings.disabledComponentTypes || []);
    if (user.role !== 'ADMIN' && disabledTypes.size > 0) {
      const blocked = fields.find((f: any) => disabledTypes.has(f.type));
      if (blocked) {
        return res.status(403).json({
          error: `Component type "${blocked.type}" is currently disabled by the platform administrator.`,
        });
      }
    }

    const now = new Date().toISOString();
    const formId =
      body.id && typeof body.id === 'string' && /^[a-zA-Z0-9_-]{3,64}$/.test(body.id)
        ? body.id
        : generateId('frm');

    // Verify if form ID already exists (prevent hijacking another user's form ID)
    const existing = db.prepare('SELECT * FROM forms WHERE id = ?').get(formId) as DbForm | undefined;
    if (existing && !canUserAccessForm(user, existing)) {
      return res.status(403).json({ error: 'Forbidden: You do not own this form.' });
    }

    const title = sanitizeString(settings.title || body.title || 'Untitled Form', 200);
    const description = sanitizeString(settings.description || body.description || '', 2000);
    const sheetName = sanitizeString(settings.sheetName || body.sheetName || 'CustomResponses', 80);
    const accessMode =
      body.accessMode === 'REQUIRE_LOGIN' ? 'REQUIRE_LOGIN' : 'PUBLIC_ANONYMOUS';
    const oneResponsePerUser = body.oneResponsePerUser ? 1 : 0;
    const expiresAt = body.expiresAt ? sanitizeString(body.expiresAt, 64) : null;
    const maxResponses =
      body.maxResponses !== undefined && body.maxResponses !== null && body.maxResponses !== ''
        ? Math.max(1, Number(body.maxResponses) || 1)
        : null;
    const submissionsEnabled = body.submissionsEnabled === false ? 0 : 1;

    if (existing) {
      // Update existing form while keeping ownership & suspension lock intact
      const nextStatus =
        existing.status === 'SUSPENDED' && user.role !== 'ADMIN'
          ? 'SUSPENDED'
          : body.status === 'PUBLISHED'
          ? 'PUBLISHED'
          : body.status === 'DRAFT'
          ? 'DRAFT'
          : existing.status;

      const tx = db.transaction(() => {
        db.prepare(`
          UPDATE forms
          SET title = ?, description = ?, sheet_name = ?, form_configuration = ?, status = ?,
              access_mode = ?, one_response_per_user = ?, expires_at = ?, max_responses = ?,
              submissions_enabled = ?, spreadsheet_id = COALESCE(?, spreadsheet_id),
              spreadsheet_name = COALESCE(?, spreadsheet_name),
              apps_script_url = COALESCE(?, apps_script_url),
              updated_at = ?
          WHERE id = ?
        `).run(
          title,
          description,
          sheetName,
          JSON.stringify(settings),
          nextStatus,
          accessMode,
          oneResponsePerUser,
          expiresAt,
          maxResponses,
          submissionsEnabled,
          body.spreadsheetId ?? null,
          body.spreadsheetName ?? null,
          body.appsScriptUrl ?? null,
          now,
          existing.id
        );

        syncFormFieldsTransaction(existing.id, fields, now);
      });
      tx();

      appendAuditLog({
        actorUserId: user.id,
        actorEmail: user.email,
        actorRole: user.role,
        action: 'FORM_UPDATED',
        targetType: 'form',
        targetId: existing.id,
        details: { title, fieldCount: fields.length, status: nextStatus },
        ipAddress: getClientIp(req),
      });

      const updated = db.prepare('SELECT * FROM forms WHERE id = ?').get(existing.id) as DbForm;
      return res.json({ form: hydrateFormRecord(updated) });
    }

    // Create new form — server automatically stamps creator identity from verified user!
    const publicToken = generateId('pub').replace('pub_', '');
    const initialStatus = body.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT';

    const tx = db.transaction(() => {
      db.prepare(`
        INSERT INTO forms (
          id, owner_id, owner_name, owner_email, title, description, sheet_name, form_configuration,
          status, public_token, access_mode, one_response_per_user, expires_at, max_responses,
          submissions_enabled, is_reported, spreadsheet_id, spreadsheet_name, apps_script_url,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?)
      `).run(
        formId,
        user.id,
        user.full_name,
        user.email,
        title,
        description,
        sheetName,
        JSON.stringify(settings),
        initialStatus,
        publicToken,
        accessMode,
        oneResponsePerUser,
        expiresAt,
        maxResponses,
        submissionsEnabled,
        body.spreadsheetId ?? null,
        body.spreadsheetName ?? null,
        body.appsScriptUrl ?? null,
        now,
        now
      );

      syncFormFieldsTransaction(formId, fields, now);
    });
    tx();

    appendAuditLog({
      actorUserId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'FORM_CREATED',
      targetType: 'form',
      targetId: formId,
      details: { title, fieldCount: fields.length },
      ipAddress: getClientIp(req),
    });

    const created = db.prepare('SELECT * FROM forms WHERE id = ?').get(formId) as DbForm;
    return res.status(201).json({ form: hydrateFormRecord(created) });
  } catch (err: any) {
    return res.status(500).json({ error: err?.message || 'Failed to save form.' });
  }
});

app.get('/api/forms/:id', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const form = db.prepare('SELECT * FROM forms WHERE id = ?').get(req.params.id) as DbForm | undefined;
  if (!form) return res.status(404).json({ error: 'Form not found.' });
  if (!canUserAccessForm(req.user!, form)) {
    return res.status(403).json({ error: 'Forbidden: You do not own this form.' });
  }
  return res.json({ form: hydrateFormRecord(form) });
});

app.post(
  '/api/forms/:id/publish',
  requireAuth,
  requireCsrf,
  (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    const form = db.prepare('SELECT * FROM forms WHERE id = ?').get(req.params.id) as DbForm | undefined;
    if (!form) return res.status(404).json({ error: 'Form not found.' });
    if (!canUserAccessForm(user, form)) {
      return res.status(403).json({ error: 'Forbidden: You do not own this form.' });
    }
    if (form.status === 'SUSPENDED' && user.role !== 'ADMIN') {
      return res
        .status(403)
        .json({ error: 'This form was suspended by an administrator and cannot be published.' });
    }

    const now = new Date().toISOString();
    const body = req.body || {};
    const accessMode =
      body.accessMode === 'REQUIRE_LOGIN'
        ? 'REQUIRE_LOGIN'
        : body.accessMode === 'PUBLIC_ANONYMOUS'
        ? 'PUBLIC_ANONYMOUS'
        : form.access_mode;

    db.prepare(`
      UPDATE forms
      SET status = 'PUBLISHED',
          access_mode = ?,
          submissions_enabled = 1,
          updated_at = ?
      WHERE id = ?
    `).run(accessMode, now, form.id);

    appendAuditLog({
      actorUserId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'FORM_PUBLISHED',
      targetType: 'form',
      targetId: form.id,
      details: { publicToken: form.public_token, accessMode },
      ipAddress: getClientIp(req),
    });

    const updated = db.prepare('SELECT * FROM forms WHERE id = ?').get(form.id) as DbForm;
    return res.json({ form: hydrateFormRecord(updated) });
  }
);

app.post(
  '/api/forms/:id/unpublish',
  requireAuth,
  requireCsrf,
  (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    const form = db.prepare('SELECT * FROM forms WHERE id = ?').get(req.params.id) as DbForm | undefined;
    if (!form) return res.status(404).json({ error: 'Form not found.' });
    if (!canUserAccessForm(user, form)) {
      return res.status(403).json({ error: 'Forbidden: You do not own this form.' });
    }
    if (form.status === 'SUSPENDED' && user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Form is suspended by administrator.' });
    }

    const now = new Date().toISOString();
    db.prepare("UPDATE forms SET status = 'DRAFT', updated_at = ? WHERE id = ?").run(now, form.id);

    appendAuditLog({
      actorUserId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'FORM_UNPUBLISHED',
      targetType: 'form',
      targetId: form.id,
      ipAddress: getClientIp(req),
    });

    const updated = db.prepare('SELECT * FROM forms WHERE id = ?').get(form.id) as DbForm;
    return res.json({ form: hydrateFormRecord(updated) });
  }
);

app.patch(
  '/api/forms/:id/access-settings',
  requireAuth,
  requireCsrf,
  (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    const form = db.prepare('SELECT * FROM forms WHERE id = ?').get(req.params.id) as DbForm | undefined;
    if (!form) return res.status(404).json({ error: 'Form not found.' });
    if (!canUserAccessForm(user, form)) {
      return res.status(403).json({ error: 'Forbidden: You do not own this form.' });
    }

    const body = sanitizeValueRecursive(req.body || {});
    const accessMode = body.accessMode === 'REQUIRE_LOGIN' ? 'REQUIRE_LOGIN' : 'PUBLIC_ANONYMOUS';
    const oneResponsePerUser = body.oneResponsePerUser ? 1 : 0;
    const expiresAt = body.expiresAt ? sanitizeString(body.expiresAt, 64) : null;
    const maxResponses =
      body.maxResponses !== undefined && body.maxResponses !== null && body.maxResponses !== ''
        ? Math.max(1, Number(body.maxResponses) || 1)
        : null;
    const submissionsEnabled = body.submissionsEnabled === false ? 0 : 1;
    const appsScriptUrl =
      body.appsScriptUrl !== undefined ? sanitizeString(body.appsScriptUrl, 1000) || null : form.apps_script_url;

    const now = new Date().toISOString();
    db.prepare(`
      UPDATE forms
      SET access_mode = ?, one_response_per_user = ?, expires_at = ?, max_responses = ?,
          submissions_enabled = ?, apps_script_url = ?, updated_at = ?
      WHERE id = ?
    `).run(
      accessMode,
      oneResponsePerUser,
      expiresAt,
      maxResponses,
      submissionsEnabled,
      appsScriptUrl,
      now,
      form.id
    );

    appendAuditLog({
      actorUserId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'FORM_ACCESS_SETTINGS_UPDATED',
      targetType: 'form',
      targetId: form.id,
      details: { accessMode, oneResponsePerUser, expiresAt, maxResponses, submissionsEnabled },
      ipAddress: getClientIp(req),
    });

    const updated = db.prepare('SELECT * FROM forms WHERE id = ?').get(form.id) as DbForm;
    return res.json({ form: hydrateFormRecord(updated) });
  }
);

app.post(
  '/api/forms/:id/duplicate',
  requireAuth,
  requireCsrf,
  (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    const source = db.prepare('SELECT * FROM forms WHERE id = ?').get(req.params.id) as DbForm | undefined;
    if (!source) return res.status(404).json({ error: 'Form not found.' });
    if (!canUserAccessForm(user, source)) {
      return res.status(403).json({ error: 'Forbidden: You do not own this form.' });
    }

    const hydrated = hydrateFormRecord(source);
    const newId = generateId('frm');
    const newToken = generateId('pub').replace('pub_', '');
    const now = new Date().toISOString();
    const newTitle = `${source.title} (Copy)`;
    const nextSettings = { ...hydrated.settings, title: newTitle };

    const tx = db.transaction(() => {
      db.prepare(`
        INSERT INTO forms (
          id, owner_id, owner_name, owner_email, title, description, sheet_name, form_configuration,
          status, public_token, access_mode, one_response_per_user, expires_at, max_responses,
          submissions_enabled, is_reported, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'DRAFT', ?, ?, ?, ?, ?, 1, 0, ?, ?)
      `).run(
        newId,
        user.id,
        user.full_name,
        user.email,
        newTitle,
        source.description,
        source.sheet_name,
        JSON.stringify(nextSettings),
        newToken,
        source.access_mode,
        source.one_response_per_user,
        source.expires_at,
        source.max_responses,
        now,
        now
      );
      syncFormFieldsTransaction(newId, hydrated.fields, now);
    });
    tx();

    appendAuditLog({
      actorUserId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'FORM_DUPLICATED',
      targetType: 'form',
      targetId: newId,
      details: { sourceFormId: source.id },
      ipAddress: getClientIp(req),
    });

    const created = db.prepare('SELECT * FROM forms WHERE id = ?').get(newId) as DbForm;
    return res.status(201).json({ form: hydrateFormRecord(created) });
  }
);

app.delete(
  '/api/forms/:id',
  requireAuth,
  requireCsrf,
  (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    const form = db.prepare('SELECT * FROM forms WHERE id = ?').get(req.params.id) as DbForm | undefined;
    if (!form) return res.status(404).json({ error: 'Form not found.' });
    if (!canUserAccessForm(user, form)) {
      return res.status(403).json({ error: 'Forbidden: You do not own this form.' });
    }

    db.prepare('DELETE FROM forms WHERE id = ?').run(form.id);

    appendAuditLog({
      actorUserId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'FORM_DELETED',
      targetType: 'form',
      targetId: form.id,
      details: { title: form.title, ownerEmail: form.owner_email },
      ipAddress: getClientIp(req),
    });

    return res.json({ success: true });
  }
);

app.get('/api/forms/:id/responses', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const form = db.prepare('SELECT * FROM forms WHERE id = ?').get(req.params.id) as DbForm | undefined;
  if (!form) return res.status(404).json({ error: 'Form not found.' });
  if (!canUserAccessForm(user, form)) {
    return res.status(403).json({ error: 'Forbidden: You cannot view responses to another user\'s form.' });
  }

  const rows = db
    .prepare('SELECT * FROM form_responses WHERE form_id = ? ORDER BY submitted_at DESC')
    .all(form.id) as DbFormResponse[];

  const responses = rows.map((r) => {
    let parsedData: any = {};
    try {
      parsedData = JSON.parse(r.response_data);
    } catch {
      parsedData = {};
    }
    return {
      id: r.id,
      formId: r.form_id,
      respondentUserId: r.respondent_user_id,
      respondentName: r.respondent_name,
      respondentEmail: r.respondent_email,
      isAnonymous: !!r.is_anonymous,
      columns: parsedData.columns || [],
      rawValues: parsedData.rawValues || {},
      sheetsSyncStatus: r.sheets_sync_status,
      sheetsSyncError: r.sheets_sync_error,
      submittedAt: r.submitted_at,
    };
  });

  return res.json({ form: hydrateFormRecord(form), responses });
});

function buildExportRows(form: DbForm, rows: DbFormResponse[]) {
  const headersSet = new Set<string>();
  const parsedRows = rows.map((r) => {
    let parsed: any = {};
    try {
      parsed = JSON.parse(r.response_data);
    } catch {}
    const cols: { header: string; value: any }[] = parsed.columns || [];
    cols.forEach((c) => headersSet.add(c.header));
    return { record: r, cols };
  });

  const dynamicHeaders = Array.from(headersSet);
  const allHeaders = [
    'Submission ID',
    'Submitted At',
    'Respondent Type',
    'Respondent Name',
    'Respondent Email',
    'Google Sheets Sync',
    ...dynamicHeaders,
  ];

  const matrix: (string | number | boolean)[][] = [allHeaders];
  for (const item of parsedRows) {
    const colMap = new Map<string, any>();
    item.cols.forEach((c) => colMap.set(c.header, c.value));
    matrix.push([
      item.record.id,
      item.record.submitted_at,
      item.record.is_anonymous ? 'Anonymous' : 'Authenticated Google User',
      item.record.respondent_name,
      item.record.respondent_email || '',
      item.record.sheets_sync_status,
      ...dynamicHeaders.map((h) => {
        const val = colMap.get(h);
        return val === undefined || val === null ? '' : val;
      }),
    ]);
  }
  return { allHeaders, matrix };
}

app.get('/api/forms/:id/export', requireAuth, (req: AuthenticatedRequest, res: Response) => {
  const user = req.user!;
  const form = db.prepare('SELECT * FROM forms WHERE id = ?').get(req.params.id) as DbForm | undefined;
  if (!form) return res.status(404).json({ error: 'Form not found.' });
  if (!canUserAccessForm(user, form)) {
    return res.status(403).json({ error: 'Forbidden: Cannot export responses you do not own.' });
  }

  const format = String(req.query.format || 'csv').toLowerCase();
  const rows = db
    .prepare('SELECT * FROM form_responses WHERE form_id = ? ORDER BY submitted_at DESC')
    .all(form.id) as DbFormResponse[];

  const { matrix } = buildExportRows(form, rows);
  const safeSlug = form.title.replace(/[^a-z0-9_-]/gi, '_').slice(0, 40) || 'form';

  appendAuditLog({
    actorUserId: user.id,
    actorEmail: user.email,
    actorRole: user.role,
    action: 'RESPONSE_EXPORT',
    targetType: 'form',
    targetId: form.id,
    details: { format, rowCount: rows.length },
    ipAddress: getClientIp(req),
  });

  if (format === 'xlsx' || format === 'excel') {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(matrix);
    XLSX.utils.book_append_sheet(wb, ws, (form.sheet_name || 'Responses').slice(0, 31));
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${safeSlug}_responses.xlsx"`);
    return res.send(buf);
  }

  const csvLines = matrix.map((row) =>
    row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(',')
  );
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="${safeSlug}_responses.csv"`);
  return res.send(csvLines.join('\n'));
});

// ==========================================
// 4. Separate Google Sheets OAuth Integration Routes
// ==========================================
app.post(
  '/api/integrations/google/connect',
  requireAuth,
  requireCsrf,
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const user = req.user!;
      const { accessToken } = req.body || {};
      if (!accessToken || typeof accessToken !== 'string') {
        return res.status(400).json({ error: 'Google OAuth access token is required.' });
      }

      const verified = await verifyGoogleWorkspaceToken(accessToken);
      const { encrypted, iv, authTag } = encryptToken(accessToken);
      const now = new Date().toISOString();
      const expiresAt = new Date(Date.now() + 55 * 60 * 1000).toISOString();

      db.prepare(`
        INSERT INTO google_integrations (
          id, user_id, provider, google_email, encrypted_access_token, iv, auth_tag, scopes,
          token_status, expires_at, created_at, updated_at
        ) VALUES (?, ?, 'google_sheets', ?, ?, ?, ?, ?, 'CONNECTED', ?, ?, ?)
        ON CONFLICT(user_id, provider) DO UPDATE SET
          google_email = excluded.google_email,
          encrypted_access_token = excluded.encrypted_access_token,
          iv = excluded.iv,
          auth_tag = excluded.auth_tag,
          scopes = excluded.scopes,
          token_status = 'CONNECTED',
          expires_at = excluded.expires_at,
          updated_at = excluded.updated_at
      `).run(
        generateId('gint'),
        user.id,
        verified.email || user.email,
        encrypted,
        iv,
        authTag,
        verified.scopes.join(' '),
        expiresAt,
        now,
        now
      );

      appendAuditLog({
        actorUserId: user.id,
        actorEmail: user.email,
        actorRole: user.role,
        action: 'GOOGLE_SHEETS_CONNECTED',
        targetType: 'google_integration',
        targetId: user.id,
        details: { googleEmail: verified.email || user.email },
        ipAddress: getClientIp(req),
      });

      return res.json({
        connected: true,
        googleEmail: verified.email || user.email,
        tokenStatus: 'CONNECTED',
        scopes: verified.scopes,
        updatedAt: now,
      });
    } catch (err: any) {
      return res.status(400).json({
        error: err?.message || 'Could not verify Google Sheets OAuth connection.',
      });
    }
  }
);

app.get(
  '/api/integrations/google/status',
  requireAuth,
  (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    const row = db
      .prepare("SELECT * FROM google_integrations WHERE user_id = ? AND provider = 'google_sheets'")
      .get(user.id) as DbGoogleIntegration | undefined;

    if (!row || row.token_status === 'DISCONNECTED') {
      return res.json({ connected: false, tokenStatus: 'DISCONNECTED', googleEmail: null });
    }

    const isExpired = row.expires_at ? Date.now() > new Date(row.expires_at).getTime() : false;
    return res.json({
      connected: row.token_status === 'CONNECTED' && !isExpired,
      tokenStatus: isExpired ? 'NEEDS_REAUTH' : row.token_status,
      googleEmail: row.google_email,
      scopes: row.scopes ? row.scopes.split(' ').filter(Boolean) : [],
      updatedAt: row.updated_at,
    });
  }
);

function getUserDecryptedSheetsToken(userId: string): { token: string; row: DbGoogleIntegration } {
  const row = db
    .prepare("SELECT * FROM google_integrations WHERE user_id = ? AND provider = 'google_sheets'")
    .get(userId) as DbGoogleIntegration | undefined;
  if (!row || row.token_status !== 'CONNECTED') {
    throw new GoogleTokenExpiredError('Google Sheets account is not connected.');
  }
  const token = decryptToken(row.encrypted_access_token, row.iv, row.auth_tag);
  return { token, row };
}

app.get(
  '/api/integrations/google/spreadsheets',
  requireAuth,
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    try {
      const { token } = getUserDecryptedSheetsToken(user.id);
      const spreadsheets = await listUserSpreadsheets(token);
      return res.json({ spreadsheets });
    } catch (err: any) {
      if (err instanceof GoogleTokenExpiredError) {
        db.prepare(
          "UPDATE google_integrations SET token_status = 'NEEDS_REAUTH', updated_at = ? WHERE user_id = ? AND provider = 'google_sheets'"
        ).run(new Date().toISOString(), user.id);
        return res.status(401).json({ code: 'NEEDS_REAUTH', error: err.message });
      }
      return res.status(500).json({ error: err?.message || 'Failed to load spreadsheets.' });
    }
  }
);

app.post(
  '/api/integrations/google/spreadsheets/create',
  requireAuth,
  requireCsrf,
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    try {
      const { title, sheetName, headers = [] } = req.body || {};
      const { token } = getUserDecryptedSheetsToken(user.id);
      const created = await createGoogleSpreadsheet(
        token,
        sanitizeString(title || 'f-docx Responses', 120),
        sanitizeString(sheetName || 'Responses', 80),
        Array.isArray(headers) ? headers.map((h: any) => sanitizeString(h, 120)) : []
      );
      return res.status(201).json(created);
    } catch (err: any) {
      if (err instanceof GoogleTokenExpiredError) {
        db.prepare(
          "UPDATE google_integrations SET token_status = 'NEEDS_REAUTH', updated_at = ? WHERE user_id = ? AND provider = 'google_sheets'"
        ).run(new Date().toISOString(), user.id);
        return res.status(401).json({ code: 'NEEDS_REAUTH', error: err.message });
      }
      return res.status(500).json({ error: err?.message || 'Failed to create spreadsheet.' });
    }
  }
);

app.post(
  '/api/forms/:id/sheets-link',
  requireAuth,
  requireCsrf,
  (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    const form = db.prepare('SELECT * FROM forms WHERE id = ?').get(req.params.id) as DbForm | undefined;
    if (!form) return res.status(404).json({ error: 'Form not found.' });
    if (!canUserAccessForm(user, form)) {
      return res.status(403).json({ error: 'Forbidden.' });
    }

    const { spreadsheetId, spreadsheetName, sheetName } = req.body || {};
    const now = new Date().toISOString();
    db.prepare(`
      UPDATE forms
      SET spreadsheet_id = ?, spreadsheet_name = ?, sheet_name = COALESCE(?, sheet_name), updated_at = ?
      WHERE id = ?
    `).run(
      spreadsheetId ? sanitizeString(spreadsheetId, 200) : null,
      spreadsheetName ? sanitizeString(spreadsheetName, 200) : null,
      sheetName ? sanitizeString(sheetName, 80) : null,
      now,
      form.id
    );

    appendAuditLog({
      actorUserId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: spreadsheetId ? 'FORM_SHEETS_LINKED' : 'FORM_SHEETS_UNLINKED',
      targetType: 'form',
      targetId: form.id,
      details: { spreadsheetId, spreadsheetName },
      ipAddress: getClientIp(req),
    });

    const updated = db.prepare('SELECT * FROM forms WHERE id = ?').get(form.id) as DbForm;
    return res.json({ form: hydrateFormRecord(updated) });
  }
);

app.post(
  '/api/integrations/google/disconnect',
  requireAuth,
  requireCsrf,
  (req: AuthenticatedRequest, res: Response) => {
    const user = req.user!;
    db.prepare("DELETE FROM google_integrations WHERE user_id = ? AND provider = 'google_sheets'").run(
      user.id
    );
    appendAuditLog({
      actorUserId: user.id,
      actorEmail: user.email,
      actorRole: user.role,
      action: 'GOOGLE_SHEETS_DISCONNECTED',
      targetType: 'google_integration',
      targetId: user.id,
      ipAddress: getClientIp(req),
    });
    return res.json({ success: true });
  }
);

// ==========================================
// 5. Public Form Read & Submit Routes
// ==========================================
function evaluatePublicAvailability(form: DbForm, currentCount: number) {
  if (form.status === 'SUSPENDED') {
    return { available: false, reason: 'SUSPENDED', message: 'This form has been suspended by an administrator.' };
  }
  if (form.status !== 'PUBLISHED') {
    return { available: false, reason: 'UNPUBLISHED', message: 'This form is not currently accepting responses.' };
  }
  if (!form.submissions_enabled) {
    return { available: false, reason: 'DISABLED', message: 'Submissions for this form are currently paused by its creator.' };
  }
  if (form.expires_at && Date.now() > new Date(form.expires_at).getTime()) {
    return { available: false, reason: 'EXPIRED', message: 'This form has passed its closing date and is no longer accepting responses.' };
  }
  if (form.max_responses && currentCount >= form.max_responses) {
    return { available: false, reason: 'MAX_RESPONSES', message: 'This form has reached its maximum response limit.' };
  }
  return { available: true, reason: null, message: null };
}

app.get('/api/public/forms/:token', (req: AuthenticatedRequest, res: Response) => {
  const form = db
    .prepare('SELECT * FROM forms WHERE public_token = ?')
    .get(sanitizeString(req.params.token, 64)) as DbForm | undefined;

  if (!form) {
    return res.status(404).json({ error: 'Form not found or link is invalid.' });
  }

  const countRow = db
    .prepare('SELECT COUNT(*) as cnt FROM form_responses WHERE form_id = ?')
    .get(form.id) as { cnt: number };

  const availability = evaluatePublicAvailability(form, countRow.cnt);
  if (!availability.available) {
    return res.status(403).json({
      available: false,
      reason: availability.reason,
      error: availability.message,
      title: form.title,
    });
  }

  let alreadySubmitted = false;
  if (form.one_response_per_user && req.user) {
    const prev = db
      .prepare('SELECT id FROM form_responses WHERE form_id = ? AND respondent_user_id = ?')
      .get(form.id, req.user.id);
    alreadySubmitted = !!prev;
  }

  const fieldRows = db
    .prepare('SELECT field_configuration FROM form_fields WHERE form_id = ? ORDER BY field_order ASC')
    .all(form.id) as { field_configuration: string }[];

  let settings: any = {};
  try {
    settings = JSON.parse(form.form_configuration);
  } catch {}

  const fields = fieldRows.map((fr) => JSON.parse(fr.field_configuration));

  // Public payload deliberately omits owner internal IDs, spreadsheets IDs, or admin fields!
  return res.json({
    available: true,
    form: {
      publicToken: form.public_token,
      title: form.title,
      description: form.description,
      accessMode: form.access_mode,
      oneResponsePerUser: !!form.one_response_per_user,
      expiresAt: form.expires_at,
      maxResponses: form.max_responses,
      responseCount: countRow.cnt,
      settings,
      fields,
    },
    viewer: req.user
      ? {
          fullName: req.user.full_name,
          email: req.user.email,
          profilePictureUrl: req.user.profile_picture_url,
        }
      : null,
    alreadySubmitted,
  });
});

app.post(
  '/api/public/forms/:token/submit',
  rateLimit('public_submit', 20, 60_000),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const form = db
        .prepare('SELECT * FROM forms WHERE public_token = ?')
        .get(sanitizeString(req.params.token, 64)) as DbForm | undefined;

      if (!form) {
        return res.status(404).json({ error: 'Form not found.' });
      }

      const countRow = db
        .prepare('SELECT COUNT(*) as cnt FROM form_responses WHERE form_id = ?')
        .get(form.id) as { cnt: number };

      const availability = evaluatePublicAvailability(form, countRow.cnt);
      if (!availability.available) {
        return res.status(403).json({ error: availability.message });
      }

      // Enforce authentication if configured (or if one_response_per_user requires identity)
      if ((form.access_mode === 'REQUIRE_LOGIN' || form.one_response_per_user) && !req.user) {
        return res.status(401).json({
          code: 'LOGIN_REQUIRED',
          error: 'Google Sign-In is required to submit this form.',
        });
      }

      if (form.one_response_per_user && req.user) {
        const existingResp = db
          .prepare('SELECT id FROM form_responses WHERE form_id = ? AND respondent_user_id = ?')
          .get(form.id, req.user.id);
        if (existingResp) {
          return res.status(409).json({
            error: 'You have already submitted a response to this form (limit: 1 response per user).',
          });
        }
      }

      const body = sanitizeValueRecursive(req.body || {});
      const columns = Array.isArray(body.columns) ? body.columns : [];
      const rawValues = body.rawValues && typeof body.rawValues === 'object' ? body.rawValues : {};

      // Validate required fields server-side
      const fieldRows = db
        .prepare('SELECT * FROM form_fields WHERE form_id = ? ORDER BY field_order ASC')
        .all(form.id) as DbFormField[];

      for (const fr of fieldRows) {
        const cfg = JSON.parse(fr.field_configuration);
        if (cfg.visible === false) continue;
        if (cfg.required) {
          const val = rawValues[fr.field_key];
          const isEmpty =
            val === undefined ||
            val === null ||
            val === '' ||
            (Array.isArray(val) && val.length === 0);
          if (isEmpty && cfg.type !== 'toggle') {
            return res.status(400).json({
              error: cfg.validation?.customErrorMessage || `Field "${cfg.label}" is required.`,
            });
          }
        }
      }

      const submissionId = generateId('sub');
      const submittedAt = new Date().toISOString();

      // Server-verified respondent identity (never trust client-supplied identity!)
      const respondentUserId = req.user ? req.user.id : null;
      const respondentGoogleId = req.user ? req.user.google_id : null;
      const respondentName = req.user ? req.user.full_name : 'Anonymous';
      const respondentEmail = req.user ? req.user.email : null;
      const isAnonymous = req.user ? 0 : 1;

      let sheetsSyncStatus: DbFormResponse['sheets_sync_status'] = 'LOCAL_ONLY';
      let sheetsSyncError: string | null = null;

      // Sync to owner's linked Google Spreadsheet if configured
      if (form.spreadsheet_id) {
        try {
          const { token } = getUserDecryptedSheetsToken(form.owner_id);
          const headers = [
            'Submission ID',
            'Submitted At',
            'Respondent',
            ...columns.map((c: any) => String(c.header)),
          ];
          const rowValues = [
            submissionId,
            submittedAt,
            respondentEmail ? `${respondentName} <${respondentEmail}>` : 'Anonymous',
            ...columns.map((c: any) => c.value ?? ''),
          ];
          await appendRowToGoogleSpreadsheet(
            token,
            form.spreadsheet_id,
            form.sheet_name || 'Responses',
            headers,
            rowValues
          );
          sheetsSyncStatus = 'SYNCED';
        } catch (syncErr: any) {
          if (syncErr instanceof GoogleTokenExpiredError) {
            sheetsSyncStatus = 'TOKEN_EXPIRED';
            db.prepare(
              "UPDATE google_integrations SET token_status = 'NEEDS_REAUTH', updated_at = ? WHERE user_id = ? AND provider = 'google_sheets'"
            ).run(submittedAt, form.owner_id);
          } else {
            sheetsSyncStatus = 'SYNC_FAILED';
          }
          sheetsSyncError = syncErr?.message || 'Google Sheets sync error';
        }
      }

      // Optional Apps Script webhook dispatch if configured on form
      if (form.apps_script_url) {
        try {
          const payload: Record<string, any> = {
            formType: 'customForm',
            formId: form.id,
            formTitle: form.title,
            sheetName: form.sheet_name,
            submissionId,
            submittedAt,
            respondent: respondentEmail || 'Anonymous',
            columnHeaders: columns.map((c: any) => c.header),
            orderedValues: columns.map((c: any) => c.value),
          };
          columns.forEach((c: any) => {
            payload[c.header] = c.value;
          });
          await fetch(form.apps_script_url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            redirect: 'follow',
          });
          if (sheetsSyncStatus === 'LOCAL_ONLY') {
            sheetsSyncStatus = 'SYNCED';
          }
        } catch (hookErr: any) {
          if (!sheetsSyncError) sheetsSyncError = hookErr?.message || 'Webhook dispatch warning';
        }
      }

      db.prepare(`
        INSERT INTO form_responses (
          id, form_id, respondent_user_id, respondent_google_id, respondent_name,
          respondent_email, is_anonymous, response_data, sheets_sync_status, sheets_sync_error, submitted_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        submissionId,
        form.id,
        respondentUserId,
        respondentGoogleId,
        respondentName,
        respondentEmail,
        isAnonymous,
        JSON.stringify({ columns, rawValues }),
        sheetsSyncStatus,
        sheetsSyncError,
        submittedAt
      );

      appendAuditLog({
        actorUserId: respondentUserId,
        actorEmail: respondentEmail || 'anonymous',
        actorRole: req.user?.role || 'PUBLIC',
        action: 'FORM_RESPONSE_SUBMITTED',
        targetType: 'form',
        targetId: form.id,
        details: { submissionId, isAnonymous: !!isAnonymous, sheetsSyncStatus },
        ipAddress: getClientIp(req),
      });

      return res.status(201).json({
        success: true,
        submissionId,
        submittedAt,
        sheetsSyncStatus,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err?.message || 'Submission failed.' });
    }
  }
);

app.post(
  '/api/public/forms/:token/report',
  rateLimit('public_report', 10, 60_000),
  (req: AuthenticatedRequest, res: Response) => {
    const form = db
      .prepare('SELECT * FROM forms WHERE public_token = ?')
      .get(sanitizeString(req.params.token, 64)) as DbForm | undefined;
    if (!form) return res.status(404).json({ error: 'Form not found.' });

    const reason = sanitizeString(req.body?.reason || 'Reported by respondent', 500);
    db.prepare('UPDATE forms SET is_reported = 1, report_reason = ?, updated_at = ? WHERE id = ?').run(
      reason,
      new Date().toISOString(),
      form.id
    );

    appendAuditLog({
      actorUserId: req.user?.id || null,
      actorEmail: req.user?.email || 'anonymous',
      actorRole: req.user?.role || 'PUBLIC',
      action: 'FORM_REPORTED',
      targetType: 'form',
      targetId: form.id,
      details: { reason },
      ipAddress: getClientIp(req),
    });

    return res.json({ success: true });
  }
);

// ==========================================
// 6. Administrator-Only Governance APIs
// ==========================================
app.get('/api/admin/overview', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  const totalUsers = (db.prepare('SELECT COUNT(*) as cnt FROM users').get() as { cnt: number }).cnt;
  const activeUsers = (
    db.prepare("SELECT COUNT(*) as cnt FROM users WHERE account_status = 'ACTIVE'").get() as {
      cnt: number;
    }
  ).cnt;
  const adminUsers = (
    db.prepare("SELECT COUNT(*) as cnt FROM users WHERE role = 'ADMIN' AND account_status = 'ACTIVE'").get() as {
      cnt: number;
    }
  ).cnt;
  const totalForms = (db.prepare('SELECT COUNT(*) as cnt FROM forms').get() as { cnt: number }).cnt;
  const publishedForms = (
    db.prepare("SELECT COUNT(*) as cnt FROM forms WHERE status = 'PUBLISHED'").get() as {
      cnt: number;
    }
  ).cnt;
  const reportedForms = (
    db.prepare('SELECT COUNT(*) as cnt FROM forms WHERE is_reported = 1').get() as { cnt: number }
  ).cnt;
  const totalResponses = (
    db.prepare('SELECT COUNT(*) as cnt FROM form_responses').get() as { cnt: number }
  ).cnt;
  const connectedIntegrations = (
    db.prepare("SELECT COUNT(*) as cnt FROM google_integrations WHERE token_status = 'CONNECTED'").get() as {
      cnt: number;
    }
  ).cnt;

  const recentLogs = db
    .prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 20')
    .all() as DbAuditLog[];

  return res.json({
    metrics: {
      totalUsers,
      activeUsers,
      adminUsers,
      totalForms,
      publishedForms,
      reportedForms,
      totalResponses,
      connectedIntegrations,
    },
    recentLogs,
  });
});

app.get('/api/admin/users', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const search = sanitizeString(req.query.q || '', 120).toLowerCase();
  const roleFilter = String(req.query.role || 'ALL').toUpperCase();
  const statusFilter = String(req.query.status || 'ALL').toUpperCase();

  const users = db.prepare('SELECT * FROM users ORDER BY created_at DESC').all() as DbUser[];
  const enriched = users
    .filter((u) => {
      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
      if (statusFilter !== 'ALL' && u.account_status !== statusFilter) return false;
      if (search && !u.full_name.toLowerCase().includes(search) && !u.email.toLowerCase().includes(search)) {
        return false;
      }
      return true;
    })
    .map((u) => {
      const formCount = (
        db.prepare('SELECT COUNT(*) as cnt FROM forms WHERE owner_id = ?').get(u.id) as {
          cnt: number;
        }
      ).cnt;
      const submissionCount = (
        db
          .prepare(
            'SELECT COUNT(*) as cnt FROM form_responses fr JOIN forms f ON fr.form_id = f.id WHERE f.owner_id = ?'
          )
          .get(u.id) as { cnt: number }
      ).cnt;
      const sheetsConnected = !!(
        db
          .prepare("SELECT id FROM google_integrations WHERE user_id = ? AND token_status = 'CONNECTED'")
          .get(u.id)
      );
      return {
        ...formatUserDto(u),
        formCount,
        submissionCount,
        sheetsConnected,
      };
    });

  return res.json({ users: enriched });
});

app.get('/api/admin/users/:id/details', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const targetUser = getUserById(req.params.id);
  if (!targetUser) return res.status(404).json({ error: 'User not found.' });

  const userForms = db
    .prepare('SELECT * FROM forms WHERE owner_id = ? ORDER BY updated_at DESC')
    .all(targetUser.id) as DbForm[];

  const userResponses = db
    .prepare(`
      SELECT fr.*, f.title as form_title
      FROM form_responses fr
      JOIN forms f ON fr.form_id = f.id
      WHERE f.owner_id = ? OR fr.respondent_user_id = ?
      ORDER BY fr.submitted_at DESC
      LIMIT 100
    `)
    .all(targetUser.id, targetUser.id) as (DbFormResponse & { form_title: string })[];

  return res.json({
    user: formatUserDto(targetUser),
    forms: userForms.map(hydrateFormRecord),
    responses: userResponses.map((r) => ({
      id: r.id,
      formId: r.form_id,
      formTitle: r.form_title,
      respondentName: r.respondent_name,
      respondentEmail: r.respondent_email,
      isAnonymous: !!r.is_anonymous,
      submittedAt: r.submitted_at,
      sheetsSyncStatus: r.sheets_sync_status,
      responseData: JSON.parse(r.response_data || '{}'),
    })),
  });
});

app.patch(
  '/api/admin/users/:id/status',
  requireAdmin,
  requireCsrf,
  (req: AuthenticatedRequest, res: Response) => {
    const admin = req.user!;
    const target = getUserById(req.params.id);
    if (!target) return res.status(404).json({ error: 'User not found.' });

    const nextStatus = req.body?.status === 'DEACTIVATED' ? 'DEACTIVATED' : 'ACTIVE';

    // Safeguard: cannot deactivate the last active admin (or yourself if you're the last admin)
    if (target.role === 'ADMIN' && target.account_status === 'ACTIVE' && nextStatus === 'DEACTIVATED') {
      if (countActiveAdmins() <= 1) {
        return res.status(400).json({
          error: 'Safeguard triggered: Cannot deactivate the last active administrator.',
        });
      }
    }

    db.prepare('UPDATE users SET account_status = ? WHERE id = ?').run(nextStatus, target.id);

    appendAuditLog({
      actorUserId: admin.id,
      actorEmail: admin.email,
      actorRole: admin.role,
      action: nextStatus === 'DEACTIVATED' ? 'USER_DEACTIVATED' : 'USER_ACTIVATED',
      targetType: 'user',
      targetId: target.id,
      details: { targetEmail: target.email, previousStatus: target.account_status, nextStatus },
      ipAddress: getClientIp(req),
    });

    const updated = getUserById(target.id)!;
    return res.json({ user: formatUserDto(updated) });
  }
);

app.patch(
  '/api/admin/users/:id/role',
  requireAdmin,
  requireCsrf,
  (req: AuthenticatedRequest, res: Response) => {
    const admin = req.user!;
    const target = getUserById(req.params.id);
    if (!target) return res.status(404).json({ error: 'User not found.' });

    const nextRole = req.body?.role === 'ADMIN' ? 'ADMIN' : 'USER';

    // Safeguard: prevent removing the last active administrator
    if (target.role === 'ADMIN' && nextRole === 'USER') {
      if (countActiveAdmins() <= 1) {
        return res.status(400).json({
          error: 'Safeguard triggered: Cannot demote the last active administrator.',
        });
      }
    }

    db.prepare('UPDATE users SET role = ? WHERE id = ?').run(nextRole, target.id);

    appendAuditLog({
      actorUserId: admin.id,
      actorEmail: admin.email,
      actorRole: admin.role,
      action: nextRole === 'ADMIN' ? 'USER_PROMOTED_ADMIN' : 'ADMIN_DEMOTED_USER',
      targetType: 'user',
      targetId: target.id,
      details: { targetEmail: target.email, previousRole: target.role, nextRole },
      ipAddress: getClientIp(req),
    });

    const updated = getUserById(target.id)!;
    return res.json({ user: formatUserDto(updated) });
  }
);

app.get('/api/admin/forms', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const statusFilter = String(req.query.status || 'ALL').toUpperCase();
  const ownerFilter = sanitizeString(req.query.ownerId || '', 128);
  const reportedOnly = req.query.reported === 'true';

  const rows = db.prepare('SELECT * FROM forms ORDER BY updated_at DESC').all() as DbForm[];
  const filtered = rows.filter((f) => {
    if (statusFilter !== 'ALL' && f.status !== statusFilter) return false;
    if (ownerFilter && f.owner_id !== ownerFilter) return false;
    if (reportedOnly && !f.is_reported) return false;
    return true;
  });

  return res.json({ forms: filtered.map(hydrateFormRecord) });
});

app.patch(
  '/api/admin/forms/:id/governance',
  requireAdmin,
  requireCsrf,
  (req: AuthenticatedRequest, res: Response) => {
    const admin = req.user!;
    const form = db.prepare('SELECT * FROM forms WHERE id = ?').get(req.params.id) as DbForm | undefined;
    if (!form) return res.status(404).json({ error: 'Form not found.' });

    const body = req.body || {};
    const nextStatus =
      body.status === 'PUBLISHED' || body.status === 'DRAFT' || body.status === 'SUSPENDED'
        ? body.status
        : form.status;
    const clearReport = body.clearReport === true;
    const now = new Date().toISOString();

    db.prepare(`
      UPDATE forms
      SET status = ?,
          is_reported = CASE WHEN ? THEN 0 ELSE is_reported END,
          report_reason = CASE WHEN ? THEN NULL ELSE report_reason END,
          updated_at = ?
      WHERE id = ?
    `).run(nextStatus, clearReport ? 1 : 0, clearReport ? 1 : 0, now, form.id);

    appendAuditLog({
      actorUserId: admin.id,
      actorEmail: admin.email,
      actorRole: admin.role,
      action: 'ADMIN_FORM_GOVERNANCE',
      targetType: 'form',
      targetId: form.id,
      details: { previousStatus: form.status, nextStatus, clearReport },
      ipAddress: getClientIp(req),
    });

    const updated = db.prepare('SELECT * FROM forms WHERE id = ?').get(form.id) as DbForm;
    return res.json({ form: hydrateFormRecord(updated) });
  }
);

app.get('/api/admin/responses', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const formId = sanitizeString(req.query.formId || '', 128);
  const ownerId = sanitizeString(req.query.ownerId || '', 128);

  const rows = db
    .prepare(`
      SELECT fr.*, f.title as form_title, f.owner_id as form_owner_id, f.owner_email as form_owner_email, f.sheet_name
      FROM form_responses fr
      JOIN forms f ON fr.form_id = f.id
      ORDER BY fr.submitted_at DESC
      LIMIT 300
    `)
    .all() as (DbFormResponse & {
    form_title: string;
    form_owner_id: string;
    form_owner_email: string;
    sheet_name: string;
  })[];

  const filtered = rows
    .filter((r) => {
      if (formId && r.form_id !== formId) return false;
      if (ownerId && r.form_owner_id !== ownerId) return false;
      return true;
    })
    .map((r) => {
      const parsed = JSON.parse(r.response_data || '{}');
      return {
        id: r.id,
        formId: r.form_id,
        formTitle: r.form_title,
        formOwnerEmail: r.form_owner_email,
        respondentUserId: r.respondent_user_id,
        respondentName: r.respondent_name,
        respondentEmail: r.respondent_email,
        isAnonymous: !!r.is_anonymous,
        columns: parsed.columns || [],
        sheetsSyncStatus: r.sheets_sync_status,
        submittedAt: r.submitted_at,
      };
    });

  return res.json({ responses: filtered });
});

app.get('/api/admin/responses/export', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const admin = req.user!;
  const format = String(req.query.format || 'csv').toLowerCase();
  const rows = db
    .prepare(`
      SELECT fr.*, f.title as form_title, f.owner_email as form_owner_email
      FROM form_responses fr
      JOIN forms f ON fr.form_id = f.id
      ORDER BY fr.submitted_at DESC
    `)
    .all() as (DbFormResponse & { form_title: string; form_owner_email: string })[];

  const matrix: (string | number | boolean)[][] = [
    [
      'Submission ID',
      'Form ID',
      'Form Title',
      'Form Owner',
      'Submitted At',
      'Respondent Name',
      'Respondent Email',
      'Sheets Sync',
      'Payload Summary',
    ],
  ];

  for (const r of rows) {
    const parsed = JSON.parse(r.response_data || '{}');
    const summary = (parsed.columns || [])
      .map((c: any) => `${c.header}: ${c.value}`)
      .join(' | ');
    matrix.push([
      r.id,
      r.form_id,
      r.form_title,
      r.form_owner_email,
      r.submitted_at,
      r.respondent_name,
      r.respondent_email || 'Anonymous',
      r.sheets_sync_status,
      summary,
    ]);
  }

  appendAuditLog({
    actorUserId: admin.id,
    actorEmail: admin.email,
    actorRole: admin.role,
    action: 'ADMIN_RESPONSE_EXPORT',
    targetType: 'platform',
    targetId: 'all_responses',
    details: { format, rowCount: rows.length },
    ipAddress: getClientIp(req),
  });

  if (format === 'xlsx' || format === 'excel') {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(matrix);
    XLSX.utils.book_append_sheet(wb, ws, 'AllResponses');
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', 'attachment; filename="admin_all_responses.xlsx"');
    return res.send(buf);
  }

  const csv = matrix
    .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
    .join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="admin_all_responses.csv"');
  return res.send(csv);
});

app.get('/api/admin/audit-logs', requireAdmin, (req: AuthenticatedRequest, res: Response) => {
  const actionFilter = sanitizeString(req.query.action || '', 100);
  const actorFilter = sanitizeString(req.query.actor || '', 120).toLowerCase();

  const logs = db
    .prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 300')
    .all() as DbAuditLog[];

  const filtered = logs.filter((l) => {
    if (actionFilter && l.action !== actionFilter) return false;
    if (actorFilter && !(l.actor_email || '').toLowerCase().includes(actorFilter)) return false;
    return true;
  });

  return res.json({ logs: filtered });
});

app.get('/api/admin/settings', requireAdmin, (_req: AuthenticatedRequest, res: Response) => {
  return res.json({ settings: getPlatformSettings() });
});

app.put(
  '/api/admin/settings',
  requireAdmin,
  requireCsrf,
  (req: AuthenticatedRequest, res: Response) => {
    const admin = req.user!;
    const updated = savePlatformSettings(req.body || {}, admin.email);
    appendAuditLog({
      actorUserId: admin.id,
      actorEmail: admin.email,
      actorRole: admin.role,
      action: 'PLATFORM_SETTINGS_UPDATED',
      targetType: 'platform_settings',
      targetId: 'global',
      details: updated,
      ipAddress: getClientIp(req),
    });
    return res.json({ settings: updated });
  }
);

// ==========================================
// 7. Vite Dev Middleware / Production Static Server
// ==========================================
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      if (req.originalUrl.startsWith('/api/')) return next();
      try {
        const indexPath = path.resolve(process.cwd(), 'index.html');
        let html = fs.readFileSync(indexPath, 'utf-8');
        html = await vite.transformIndexHtml(req.originalUrl, html);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (e) {
        next(e);
      }
    });
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (req, res, next) => {
      if (req.originalUrl.startsWith('/api/')) return next();
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`f-docx server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

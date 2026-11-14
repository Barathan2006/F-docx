import crypto from 'crypto';
import type { NextFunction, Request, Response } from 'express';
import { getApp, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import firebaseConfig from '../firebase-applet-config.json';
import { DbUser, getUserById } from './db';

// Initialize Firebase Admin for verifying Google Sign-In ID tokens via Google's public JWKS
const adminApp =
  getApps().length > 0
    ? getApp()
    : initializeApp({
        projectId: firebaseConfig.projectId,
      });

export const adminAuth = getAuth(adminApp);

const SESSION_COOKIE_NAME = 'fdx_session';
const CSRF_COOKIE_NAME = 'fdx_csrf';
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

function getSessionSecret(): string {
  return (
    process.env.SESSION_SECRET ||
    `${firebaseConfig.projectId}:${firebaseConfig.appId}:fdocx-session-secret-v1`
  );
}

interface SessionPayload {
  uid: string;
  csrf: string;
  exp: number;
}

export function signSessionToken(userId: string): { token: string; csrfToken: string } {
  const csrfToken = crypto.randomBytes(24).toString('base64url');
  const payload: SessionPayload = {
    uid: userId,
    csrf: csrfToken,
    exp: Date.now() + SESSION_TTL_MS,
  };
  const dataB64 = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  const sig = crypto.createHmac('sha256', getSessionSecret()).update(dataB64).digest('base64url');
  return {
    token: `${dataB64}.${sig}`,
    csrfToken,
  };
}

export function verifySessionToken(token: string): SessionPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [dataB64, sig] = parts;
    const expectedSig = crypto
      .createHmac('sha256', getSessionSecret())
      .update(dataB64)
      .digest('base64url');
    const a = Buffer.from(sig);
    const b = Buffer.from(expectedSig);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
    const payload = JSON.parse(Buffer.from(dataB64, 'base64url').toString('utf8')) as SessionPayload;
    if (!payload.uid || !payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

export function setAuthCookies(req: Request, res: Response, userId: string): string {
  const { token, csrfToken } = signSessionToken(userId);
  const isSecure =
    req.secure ||
    req.headers['x-forwarded-proto'] === 'https' ||
    process.env.NODE_ENV === 'production';

  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: isSecure ? 'none' : 'lax',
    secure: isSecure,
    maxAge: SESSION_TTL_MS,
    path: '/',
  });

  res.cookie(CSRF_COOKIE_NAME, csrfToken, {
    httpOnly: false,
    sameSite: isSecure ? 'none' : 'lax',
    secure: isSecure,
    maxAge: SESSION_TTL_MS,
    path: '/',
  });

  return csrfToken;
}

export function clearAuthCookies(req: Request, res: Response): void {
  const isSecure =
    req.secure ||
    req.headers['x-forwarded-proto'] === 'https' ||
    process.env.NODE_ENV === 'production';

  res.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: isSecure ? 'none' : 'lax',
    secure: isSecure,
    path: '/',
  });
  res.clearCookie(CSRF_COOKIE_NAME, {
    httpOnly: false,
    sameSite: isSecure ? 'none' : 'lax',
    secure: isSecure,
    path: '/',
  });
}

export interface AuthenticatedRequest extends Request {
  user?: DbUser;
  authMethod?: 'cookie' | 'bearer';
  csrfFromSession?: string;
}

export async function verifyGoogleIdToken(idToken: string): Promise<{
  googleId: string;
  email: string;
  fullName: string;
  picture: string | null;
}> {
  const decoded = await adminAuth.verifyIdToken(idToken);
  if (!decoded.email || decoded.email_verified === false) {
    throw new Error('Verified Google email is required.');
  }
  const googleSub =
    (decoded.firebase?.identities?.['google.com']?.[0] as string | undefined) || decoded.uid;

  return {
    googleId: googleSub,
    email: decoded.email.toLowerCase(),
    fullName: decoded.name || decoded.email.split('@')[0],
    picture: decoded.picture || null,
  };
}

export async function attachOptionalUser(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // 1. Check HttpOnly signed session cookie first
    const cookieToken = req.cookies?.[SESSION_COOKIE_NAME];
    if (cookieToken) {
      const parsed = verifySessionToken(cookieToken);
      if (parsed) {
        const dbUser = getUserById(parsed.uid);
        if (dbUser && dbUser.account_status === 'ACTIVE') {
          req.user = dbUser;
          req.authMethod = 'cookie';
          req.csrfFromSession = parsed.csrf;
          return next();
        }
      }
    }

    // 2. Check Authorization: Bearer <firebaseIdToken> (for iframe environments where third-party cookies may be restricted)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const bearerToken = authHeader.slice(7).trim();
      if (bearerToken) {
        const decoded = await adminAuth.verifyIdToken(bearerToken);
        const googleSub =
          (decoded.firebase?.identities?.['google.com']?.[0] as string | undefined) || decoded.uid;
        const email = decoded.email?.toLowerCase() || '';
        const { db } = await import('./db');
        const dbUser = db
          .prepare('SELECT * FROM users WHERE google_id = ? OR LOWER(email) = ?')
          .get(googleSub, email) as DbUser | undefined;
        if (dbUser && dbUser.account_status === 'ACTIVE') {
          req.user = dbUser;
          req.authMethod = 'bearer';
        }
      }
    }
  } catch {
    // Ignore invalid optional tokens; requireAuth will block protected routes
  }
  next();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required. Please sign in with Google.' });
    return;
  }
  if (req.user.account_status !== 'ACTIVE') {
    res.status(403).json({ error: 'Your account has been deactivated by an administrator.' });
    return;
  }
  next();
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  if (req.user.account_status !== 'ACTIVE') {
    res.status(403).json({ error: 'Account deactivated.' });
    return;
  }
  if (req.user.role !== 'ADMIN') {
    res.status(403).json({ error: 'Forbidden: Administrator role required.' });
    return;
  }
  next();
}

export function requireCsrf(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  // Mutating requests authenticated solely via cookie must include matching X-CSRF-Token header
  if (req.method === 'GET' || req.method === 'HEAD' || req.method === 'OPTIONS') {
    return next();
  }
  if (req.authMethod === 'bearer') {
    return next();
  }
  if (req.authMethod === 'cookie') {
    const headerCsrf = req.headers['x-csrf-token'];
    const cookieCsrf = req.cookies?.[CSRF_COOKIE_NAME];
    if (!headerCsrf || !req.csrfFromSession || headerCsrf !== req.csrfFromSession) {
      // Allow if cookie CSRF matches header
      if (!cookieCsrf || headerCsrf !== cookieCsrf) {
        res.status(403).json({ error: 'Invalid or missing CSRF token.' });
        return;
      }
    }
  }
  next();
}

// Simple fixed-window in-memory rate limiter
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(keyPrefix: string, maxRequests: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown';
    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();
    const bucket = rateBuckets.get(key);
    if (!bucket || now > bucket.resetAt) {
      rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (bucket.count >= maxRequests) {
      res.status(429).json({
        error: 'Too many requests. Please wait a moment and try again.',
      });
      return;
    }
    bucket.count += 1;
    next();
  };
}

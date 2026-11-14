import { auth } from './firebase';

let inMemoryCsrfToken: string | null = null;

export function setCsrfToken(token: string | null) {
  inMemoryCsrfToken = token;
}

function getCsrfFromCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )fdx_csrf=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

export async function apiRequest<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Always attach fresh Firebase ID token if signed in (reliable across iframes)
  if (auth.currentUser) {
    try {
      const idToken = await auth.currentUser.getIdToken();
      headers.set('Authorization', `Bearer ${idToken}`);
    } catch {
      // Fallback to cookie auth
    }
  }

  const csrf = inMemoryCsrfToken || getCsrfFromCookie();
  if (csrf && options.method && !['GET', 'HEAD', 'OPTIONS'].includes(options.method.toUpperCase())) {
    headers.set('X-CSRF-Token', csrf);
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    let message = `Request failed (${response.status})`;
    let code: string | undefined;
    try {
      const errJson = await response.json();
      message = errJson.error || errJson.message || message;
      code = errJson.code;
    } catch {}
    const err = new Error(message) as Error & { status?: number; code?: string };
    err.status = response.status;
    err.code = code;
    throw err;
  }

  return (await response.json()) as T;
}

export async function apiDownloadFile(url: string, filename: string): Promise<void> {
  const headers = new Headers();
  if (auth.currentUser) {
    try {
      const idToken = await auth.currentUser.getIdToken();
      headers.set('Authorization', `Bearer ${idToken}`);
    } catch {}
  }

  const res = await fetch(url, {
    method: 'GET',
    headers,
    credentials: 'include',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Export failed' }));
    throw new Error(err.error || 'Export failed');
  }
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = objectUrl;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(objectUrl);
}

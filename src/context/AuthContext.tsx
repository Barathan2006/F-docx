import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import {
  auth,
  connectGoogleSheetsOAuth,
  signInWithGoogleAccount,
  signOutFirebase,
} from '../lib/firebase';
import { apiRequest, setCsrfToken } from '../lib/api';
import { GoogleIntegrationStatus, PlatformSettingsConfig, UserProfile } from '../types';

export interface LoginOptions {
  loginMode?: 'user' | 'admin';
  adminSecretCode?: string;
  enteredName?: string;
}

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  authError: string | null;
  platformSettings: PlatformSettingsConfig | null;
  googleSheetsStatus: GoogleIntegrationStatus;
  loginWithGoogle: (options?: LoginOptions) => Promise<UserProfile>;
  clearAuthError: () => void;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  refreshGoogleSheetsStatus: () => Promise<void>;
  connectGoogleSheets: () => Promise<GoogleIntegrationStatus>;
  disconnectGoogleSheets: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [platformSettings, setPlatformSettings] = useState<PlatformSettingsConfig | null>(null);
  const [googleSheetsStatus, setGoogleSheetsStatus] = useState<GoogleIntegrationStatus>({
    connected: false,
    tokenStatus: 'DISCONNECTED',
    googleEmail: null,
  });
  const explicitLoginInFlightRef = useRef(false);

  const refreshGoogleSheetsStatus = useCallback(async () => {
    try {
      const status = await apiRequest<GoogleIntegrationStatus>('/api/integrations/google/status');
      setGoogleSheetsStatus(status);
    } catch {
      setGoogleSheetsStatus({
        connected: false,
        tokenStatus: 'DISCONNECTED',
        googleEmail: null,
      });
    }
  }, []);

  const syncSessionWithBackend = useCallback(
    async (idToken?: string, options?: LoginOptions) => {
      if (idToken) {
        const res = await apiRequest<{ user: UserProfile; csrfToken: string }>('/api/auth/session', {
          method: 'POST',
          body: JSON.stringify({
            idToken,
            loginMode: options?.loginMode || 'user',
            ...(options?.adminSecretCode !== undefined
              ? { adminSecretCode: options.adminSecretCode }
              : {}),
            ...(options?.enteredName ? { enteredName: options.enteredName } : {}),
          }),
        });
        setCsrfToken(res.csrfToken);
        setUser(res.user);
        setAuthError(null);
        await refreshGoogleSheetsStatus();
        return res.user;
      }

      const me = await apiRequest<{ user: UserProfile; platformSettings?: PlatformSettingsConfig }>(
        '/api/auth/me'
      );
      setUser(me.user);
      if (me.platformSettings) setPlatformSettings(me.platformSettings);
      setAuthError(null);
      await refreshGoogleSheetsStatus();
      return me.user;
    },
    [refreshGoogleSheetsStatus]
  );

  useEffect(() => {
    let active = true;
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!active || explicitLoginInFlightRef.current) return;
      try {
        if (firebaseUser) {
          const idToken = await firebaseUser.getIdToken();
          await syncSessionWithBackend(idToken);
        } else {
          // Check if server HttpOnly cookie session is active
          try {
            await syncSessionWithBackend();
          } catch {
            if (active) setUser(null);
          }
        }
      } catch (err: any) {
        if (active) {
          setUser(null);
          setAuthError(err?.message || null);
        }
      } finally {
        if (active) setLoading(false);
      }
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [syncSessionWithBackend]);

  const loginWithGoogle = async (options?: LoginOptions) => {
    setAuthError(null);
    explicitLoginInFlightRef.current = true;
    try {
      const { idToken } = await signInWithGoogleAccount();
      const profile = await syncSessionWithBackend(idToken, options);
      return profile;
    } catch (err: any) {
      const msg = err?.message || 'Google sign-in failed.';
      // Ensure failed login (e.g. invalid secret code or unauthorized role) does not leave Firebase signed in
      try {
        await signOutFirebase();
      } catch {}
      setCsrfToken(null);
      setUser(null);
      setAuthError(msg);
      throw err;
    } finally {
      explicitLoginInFlightRef.current = false;
      setLoading(false);
    }
  };

  const clearAuthError = useCallback(() => {
    setAuthError(null);
  }, []);

  const logout = async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch {}
    try {
      await signOutFirebase();
    } catch {}
    setCsrfToken(null);
    setUser(null);
    setGoogleSheetsStatus({
      connected: false,
      tokenStatus: 'DISCONNECTED',
      googleEmail: null,
    });
  };

  const refreshUser = async () => {
    try {
      await syncSessionWithBackend();
    } catch {
      setUser(null);
    }
  };

  const connectGoogleSheets = async () => {
    const { accessToken } = await connectGoogleSheetsOAuth();
    const res = await apiRequest<GoogleIntegrationStatus>('/api/integrations/google/connect', {
      method: 'POST',
      body: JSON.stringify({ accessToken }),
    });
    setGoogleSheetsStatus(res);
    return res;
  };

  const disconnectGoogleSheets = async () => {
    await apiRequest('/api/integrations/google/disconnect', { method: 'POST' });
    setGoogleSheetsStatus({
      connected: false,
      tokenStatus: 'DISCONNECTED',
      googleEmail: null,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authError,
        platformSettings,
        googleSheetsStatus,
        loginWithGoogle,
        clearAuthError,
        logout,
        refreshUser,
        refreshGoogleSheetsStatus,
        connectGoogleSheets,
        disconnectGoogleSheets,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

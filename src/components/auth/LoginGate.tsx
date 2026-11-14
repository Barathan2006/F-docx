import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  FileSpreadsheet,
  ShieldCheck,
  Lock,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  User,
  KeyRound,
} from 'lucide-react';

const GoogleMark: React.FC = () => (
  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
    <path
      fill="#EA4335"
      d="M12 10.2v3.9h5.4c-.2 1.3-1.5 3.9-5.4 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.5 14.6 2.5 12 2.5 6.8 2.5 2.5 6.8 2.5 12s4.3 9.5 9.5 9.5c5.5 0 9.1-3.9 9.1-9.3 0-.6-.1-1.1-.2-1.6H12z"
    />
    <path
      fill="#34A853"
      d="M3.6 7.5l3.2 2.3C7.7 7.6 9.7 6 12 6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.5 14.6 2.5 12 2.5 8.3 2.5 5.1 4.6 3.6 7.5z"
    />
    <path
      fill="#FBBC05"
      d="M12 21.5c2.6 0 4.8-.9 6.4-2.4l-3-2.5c-.8.6-1.9 1-3.4 1-3.8 0-5.1-2.5-5.4-3.8l-3.2 2.5c1.5 3 4.7 5.2 8.6 5.2z"
    />
    <path
      fill="#4285F4"
      d="M21.1 12.2c0-.6-.1-1.1-.2-1.6H12v3.9h5.4c-.3 1.4-1.1 2.4-2.1 3.1l3 2.5c1.8-1.6 2.8-4.1 2.8-7.9z"
    />
  </svg>
);

export const LoginGate: React.FC = () => {
  const { loginWithGoogle, authError, clearAuthError } = useAuth();

  // User login form state
  const [userName, setUserName] = useState('');
  const [userValidationError, setUserValidationError] = useState<string | null>(null);

  // Admin login form state
  const [adminName, setAdminName] = useState('');
  const [adminSecretCode, setAdminSecretCode] = useState('');
  const [showSecretCode, setShowSecretCode] = useState(false);
  const [adminValidationError, setAdminValidationError] = useState<string | null>(null);

  // Shared auth loading state
  const [activeAuthFlow, setActiveAuthFlow] = useState<'user' | 'admin' | null>(null);
  const [heroImageError, setHeroImageError] = useState(false);

  const isAuthenticating = activeAuthFlow !== null;

  const handleUserContinueWithGoogle = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();
    setAdminValidationError(null);

    const trimmedName = userName.trim();
    if (!trimmedName) {
      setUserValidationError('Please enter your User Name before continuing with Google.');
      return;
    }

    setUserValidationError(null);
    setActiveAuthFlow('user');
    try {
      await loginWithGoogle({
        loginMode: 'user',
        enteredName: trimmedName,
      });
    } catch {
      // Error surfaced via authError in AuthContext
    } finally {
      setActiveAuthFlow(null);
    }
  };

  const handleAdminContinueWithGoogle = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();
    setUserValidationError(null);

    const trimmedAdminName = adminName.trim();
    const trimmedSecret = adminSecretCode.trim();

    if (!trimmedAdminName) {
      setAdminValidationError('Please enter your Admin Name.');
      return;
    }
    if (!trimmedSecret) {
      setAdminValidationError('Please enter the administrator Secret Code.');
      return;
    }

    setAdminValidationError(null);
    setActiveAuthFlow('admin');
    try {
      await loginWithGoogle({
        loginMode: 'admin',
        adminSecretCode: trimmedSecret,
        enteredName: trimmedAdminName,
      });
    } catch {
      // Error surfaced via authError in AuthContext
    } finally {
      setActiveAuthFlow(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#050807] text-[#FFFFFF] relative overflow-hidden flex items-center justify-center py-8 px-4 sm:px-6 lg:px-10 font-sans">
      {/* Subtle Green Glow Ambient Accents */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -top-40 -left-32 w-[520px] h-[520px] rounded-full bg-[#00E676]/10 blur-[140px]"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none fixed -bottom-44 -right-32 w-[540px] h-[540px] rounded-full bg-[#00C853]/10 blur-[150px]"
      />

      <div className="relative z-10 max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* LEFT SECTION – CLEAN BRANDING */}
        <section className="lg:col-span-5 bg-[#0B1210] border border-[#263A33] rounded-3xl p-7 sm:p-8 flex flex-col justify-between gap-6 shadow-[0_0_50px_-18px_rgba(0,230,118,0.18)]">
          {/* Logo & Name */}
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-[#151F1D] border border-[#00E676]/40 shadow-[0_0_20px_-4px_rgba(0,230,118,0.35)] flex items-center justify-center text-[#00E676]">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <span className="font-mono font-extrabold text-2xl tracking-tight text-[#FFFFFF]">
                f-docx
              </span>
              <p className="text-xs font-medium tracking-wide text-[#00E676]">
                Create · Customize · Share
              </p>
            </div>
          </div>

          {/* Clean Framed Visual */}
          <div className="relative flex-1 min-h-[280px] rounded-2xl overflow-hidden border border-[#263A33] bg-[#050807] group">
            {!heroImageError ? (
              <img
                src="/assets/aistudio/CM_Vijay_Zone_out_f28d5881.jpg"
                alt="f-docx workspace visual"
                referrerPolicy="no-referrer"
                onError={() => setHeroImageError(true)}
                className="w-full h-full object-cover object-top transition-transform duration-500 group-hover:scale-[1.02]"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-[#151F1D] text-[#A7B0AD] text-sm">
                f-docx Studio
              </div>
            )}
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#050807]/70 via-transparent to-[#00E676]/10"
            />
          </div>
        </section>

        {/* RIGHT SECTION – AUTHENTICATION CARD */}
        <section className="lg:col-span-7 bg-[#0B1210] border border-[#263A33] rounded-3xl p-7 sm:p-9 flex flex-col justify-center space-y-6 shadow-[0_0_50px_-18px_rgba(0,200,83,0.16)]">
          {/* Header */}
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-[#151F1D] border border-[#00E676]/40 flex items-center justify-center text-[#00E676] shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[#FFFFFF] tracking-tight">Welcome Back</h2>
              <p className="text-sm text-[#A7B0AD] mt-0.5">Sign in to continue.</p>
            </div>
          </div>

          {/* Server Auth Error */}
          {authError && (
            <div
              role="alert"
              className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-200 text-xs flex items-start gap-2.5"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="leading-relaxed">{authError}</span>
            </div>
          )}

          {/* Section 1: User Login */}
          <form
            onSubmit={handleUserContinueWithGoogle}
            className="rounded-2xl bg-[#050807]/75 border border-[#263A33] p-5 space-y-4 transition-colors hover:border-[#263A33]/90"
            noValidate
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-[#00E676]" />
                <h3 className="text-sm font-bold text-[#FFFFFF]">User Login</h3>
              </div>
              <span className="text-[11px] font-medium text-[#A7B0AD]">USER Workspace</span>
            </div>

            <div className="space-y-1.5">
              <label htmlFor="user-login-name" className="block text-xs font-medium text-[#A7B0AD]">
                User Name
              </label>
              <input
                id="user-login-name"
                type="text"
                autoComplete="name"
                value={userName}
                onChange={(e) => {
                  setUserName(e.target.value);
                  if (userValidationError) setUserValidationError(null);
                  if (authError) clearAuthError();
                }}
                placeholder="Enter your name"
                disabled={isAuthenticating}
                className="w-full px-3.5 py-2.5 rounded-xl bg-[#151F1D] border border-[#263A33] text-sm text-[#FFFFFF] placeholder-[#A7B0AD]/50 focus:outline-none focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676]/40 transition-colors disabled:opacity-60"
              />
            </div>

            {userValidationError && (
              <p className="text-xs text-rose-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{userValidationError}</span>
              </p>
            )}

            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-2.5 px-4 rounded-xl bg-[#00E676] hover:bg-[#00C853] active:bg-[#00C853] disabled:opacity-60 text-[#050807] font-bold text-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer whitespace-nowrap shadow-[0_0_24px_-6px_rgba(0,230,118,0.55)]"
            >
              {activeAuthFlow === 'user' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Connecting Google Account...</span>
                </>
              ) : (
                <>
                  <GoogleMark />
                  <span>Continue with Google</span>
                </>
              )}
            </button>
          </form>

          {/* Section 2: Admin Login – Separate Admin Access Card with Distinct Green Border */}
          <form
            onSubmit={handleAdminContinueWithGoogle}
            className="rounded-2xl bg-[#07110D] border-2 border-[#00E676]/70 shadow-[0_0_28px_-8px_rgba(0,230,118,0.35)] p-5 space-y-4"
            noValidate
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#00E676]" />
                <h3 className="text-sm font-bold text-[#FFFFFF]">Admin Access</h3>
              </div>
              <span className="text-[11px] font-semibold text-[#00E676] tracking-wide">
                Verified Admin Only
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label htmlFor="admin-login-name" className="block text-xs font-medium text-[#A7B0AD]">
                  Admin Name
                </label>
                <input
                  id="admin-login-name"
                  type="text"
                  autoComplete="name"
                  value={adminName}
                  onChange={(e) => {
                    setAdminName(e.target.value);
                    if (adminValidationError) setAdminValidationError(null);
                    if (authError) clearAuthError();
                  }}
                  placeholder="Enter admin name"
                  disabled={isAuthenticating}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-[#151F1D] border border-[#263A33] text-sm text-[#FFFFFF] placeholder-[#A7B0AD]/50 focus:outline-none focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676]/40 transition-colors disabled:opacity-60"
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="admin-secret-code" className="block text-xs font-medium text-[#A7B0AD]">
                  Secret Code
                </label>
                <div className="relative">
                  <KeyRound className="w-3.5 h-3.5 text-[#A7B0AD]/70 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="admin-secret-code"
                    type={showSecretCode ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={adminSecretCode}
                    onChange={(e) => {
                      setAdminSecretCode(e.target.value);
                      if (adminValidationError) setAdminValidationError(null);
                      if (authError) clearAuthError();
                    }}
                    placeholder="Enter secret code"
                    disabled={isAuthenticating}
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-[#151F1D] border border-[#263A33] text-sm text-[#FFFFFF] placeholder-[#A7B0AD]/50 focus:outline-none focus:border-[#00E676] focus:ring-1 focus:ring-[#00E676]/40 transition-colors disabled:opacity-60"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecretCode((prev) => !prev)}
                    aria-label={showSecretCode ? 'Hide secret code' : 'Show secret code'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md text-[#A7B0AD] hover:text-[#FFFFFF] focus:outline-none focus:text-[#00E676] cursor-pointer"
                  >
                    {showSecretCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            {adminValidationError && (
              <p className="text-xs text-rose-400 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{adminValidationError}</span>
              </p>
            )}

            <button
              type="submit"
              disabled={isAuthenticating}
              className="w-full py-2.5 px-4 rounded-xl bg-[#151F1D] hover:bg-[#00C853] border border-[#00E676]/60 hover:border-[#00C853] text-[#FFFFFF] hover:text-[#050807] disabled:opacity-60 font-bold text-sm transition-all flex items-center justify-center gap-2.5 cursor-pointer whitespace-nowrap"
            >
              {activeAuthFlow === 'admin' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Admin Access...</span>
                </>
              ) : (
                <>
                  <GoogleMark />
                  <span>Continue with Google</span>
                </>
              )}
            </button>
          </form>

          {/* Compact Security Note */}
          <div className="flex items-start gap-2 text-[11px] text-[#A7B0AD] leading-relaxed px-1">
            <Lock className="w-3.5 h-3.5 text-[#00C853] shrink-0 mt-0.5" />
            <span>
              Identity is verified strictly via your Google OAuth profile. Administrator sessions require backend verification of both the secret code and an assigned ADMIN account.
            </span>
          </div>
        </section>
      </div>
    </div>
  );
};


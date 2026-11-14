import React from 'react';
import { FormType, UserProfile, WebAppConfig } from '../types';
import {
  FileSpreadsheet,
  Github,
  LayoutGrid,
  Settings2,
  UserCheck,
  KeyRound,
  MessageSquareHeart,
  BarChart3,
  PlugZap,
  Wrench,
  FolderKanban,
  ShieldCheck,
  LogOut,
} from 'lucide-react';

export type MainNavTab =
  | 'dashboard'
  | 'builder'
  | 'forms'
  | 'sheet'
  | 'analytics'
  | 'integrations'
  | 'github'
  | 'admin';

interface Props {
  user: UserProfile;
  onLogout: () => void;
  activeNavTab: MainNavTab;
  onSelectNavTab: (tab: MainNavTab) => void;
  activeFormTab: FormType;
  onSelectFormTab: (tab: FormType) => void;
  webAppConfig: WebAppConfig;
  onOpenConfigModal: () => void;
  totalSubmissions: number;
}

export const Navbar: React.FC<Props> = ({
  user,
  onLogout,
  activeNavTab,
  onSelectNavTab,
  activeFormTab,
  onSelectFormTab,
  webAppConfig,
  onOpenConfigModal,
  totalSubmissions,
}) => {
  const isAdmin = user.role === 'ADMIN';

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Logo & Identity */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm ring-2 ring-emerald-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-slate-900 tracking-tight text-lg font-mono">
                f-docx
              </span>
              <span
                className={`px-1.5 py-0.5 text-[10px] font-bold rounded uppercase tracking-wider ${
                  isAdmin
                    ? 'bg-indigo-100 text-indigo-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {user.role}
              </span>
            </div>
          </div>

          {/* Center Main Tabs */}
          <nav className="hidden xl:flex items-center gap-1">
            <button
              onClick={() => onSelectNavTab('dashboard')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeNavTab === 'dashboard'
                  ? 'bg-emerald-50 text-emerald-800 shadow-xs ring-1 ring-emerald-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <FolderKanban className="w-3.5 h-3.5 text-emerald-600" />
              <span>My Forms</span>
            </button>

            <button
              onClick={() => onSelectNavTab('builder')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeNavTab === 'builder'
                  ? 'bg-emerald-50 text-emerald-800 shadow-xs ring-1 ring-emerald-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Wrench className="w-3.5 h-3.5 text-emerald-600" />
              <span>Builder</span>
            </button>

            <button
              onClick={() => onSelectNavTab('forms')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeNavTab === 'forms'
                  ? 'bg-emerald-50 text-emerald-800 shadow-xs ring-1 ring-emerald-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Playground</span>
            </button>

            <button
              onClick={() => onSelectNavTab('sheet')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeNavTab === 'sheet'
                  ? 'bg-emerald-50 text-emerald-800 shadow-xs ring-1 ring-emerald-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Sheet DB</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-200/80 text-emerald-900 font-bold">
                {totalSubmissions}
              </span>
            </button>

            <button
              onClick={() => onSelectNavTab('analytics')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeNavTab === 'analytics'
                  ? 'bg-emerald-50 text-emerald-800 shadow-xs ring-1 ring-emerald-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Analytics</span>
            </button>

            <button
              onClick={() => onSelectNavTab('integrations')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeNavTab === 'integrations'
                  ? 'bg-emerald-50 text-emerald-800 shadow-xs ring-1 ring-emerald-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <PlugZap className="w-3.5 h-3.5 text-emerald-600" />
              <span>Integrations</span>
            </button>

            <button
              onClick={() => onSelectNavTab('github')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                activeNavTab === 'github'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Github className="w-3.5 h-3.5" />
              <span>Repo</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => onSelectNavTab('admin')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                  activeNavTab === 'admin'
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-indigo-50 text-indigo-800 hover:bg-indigo-100 border border-indigo-200'
                }`}
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Admin</span>
              </button>
            )}
          </nav>

          {/* Right Action: Endpoint Config + User Identity + Logout */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenConfigModal}
              className={`hidden 2xl:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border whitespace-nowrap ${
                webAppConfig.syncToRealSheet && webAppConfig.scriptUrl
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
              title="Configure live Apps Script endpoint"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  webAppConfig.syncToRealSheet && webAppConfig.scriptUrl
                    ? 'bg-emerald-500'
                    : 'bg-slate-400'
                }`}
              />
              <span>Endpoint</span>
              <Settings2 className="w-3 h-3 text-slate-400" />
            </button>

            <div
              className="flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-xl bg-slate-50 border border-slate-200"
              title={`${user.fullName} (${user.email}) — Role: ${user.role}`}
            >
              {user.profilePictureUrl ? (
                <img
                  src={user.profilePictureUrl}
                  alt={user.fullName}
                  className="w-6 h-6 rounded-full border border-slate-300"
                />
              ) : (
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center">
                  {user.fullName[0]}
                </div>
              )}
              <div className="hidden sm:block leading-tight max-w-[125px]">
                <div className="text-[11px] font-bold text-slate-800 truncate">
                  {user.fullName}
                </div>
                <div className="text-[9px] text-slate-500 truncate">{user.email}</div>
              </div>
              <button
                type="button"
                onClick={onLogout}
                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Compact / Tablet Secondary Navigation */}
        <div className="xl:hidden flex items-center overflow-x-auto py-2 border-t border-slate-100 text-xs gap-1">
          <button
            onClick={() => onSelectNavTab('dashboard')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium ${
              activeNavTab === 'dashboard' ? 'bg-emerald-100 text-emerald-800 font-bold' : 'text-slate-600'
            }`}
          >
            My Forms
          </button>
          <button
            onClick={() => onSelectNavTab('builder')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium ${
              activeNavTab === 'builder' ? 'bg-emerald-100 text-emerald-800 font-bold' : 'text-slate-600'
            }`}
          >
            Builder
          </button>
          {isAdmin && (
            <button
              onClick={() => onSelectNavTab('admin')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-bold ${
                activeNavTab === 'admin' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-800'
              }`}
            >
              Admin
            </button>
          )}
          <button
            onClick={() => onSelectNavTab('forms')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium ${
              activeNavTab === 'forms' ? 'bg-emerald-100 text-emerald-800 font-bold' : 'text-slate-600'
            }`}
          >
            Playground
          </button>
          <button
            onClick={() => onSelectNavTab('sheet')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium ${
              activeNavTab === 'sheet' ? 'bg-emerald-100 text-emerald-800 font-bold' : 'text-slate-600'
            }`}
          >
            Sheet DB ({totalSubmissions})
          </button>
          <button
            onClick={() => onSelectNavTab('analytics')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium ${
              activeNavTab === 'analytics' ? 'bg-emerald-100 text-emerald-800 font-bold' : 'text-slate-600'
            }`}
          >
            Analytics
          </button>
          <button
            onClick={() => onSelectNavTab('integrations')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium ${
              activeNavTab === 'integrations' ? 'bg-emerald-100 text-emerald-800 font-bold' : 'text-slate-600'
            }`}
          >
            Integrations
          </button>
          <button
            onClick={() => onSelectNavTab('github')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium ${
              activeNavTab === 'github' ? 'bg-slate-900 text-white font-bold' : 'text-slate-600'
            }`}
          >
            Repo
          </button>
        </div>

        {/* Form Menu Selector Bar (when in 'forms' mode) */}
        {activeNavTab === 'forms' && (
          <div className="py-2.5 border-t border-slate-100 flex items-center justify-between gap-3 overflow-x-auto">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1 hidden sm:inline">
                Active Form:
              </span>
              <button
                onClick={() => onSelectFormTab('registration')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeFormTab === 'registration'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                <span>1. Registration Form</span>
              </button>

              <button
                onClick={() => onSelectFormTab('userDetails')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeFormTab === 'userDetails'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>2. Login / User Details</span>
              </button>

              <button
                onClick={() => onSelectFormTab('feedback')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeFormTab === 'feedback'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <MessageSquareHeart className="w-3.5 h-3.5" />
                <span>3. Feedback Form</span>
              </button>
            </div>

            <div className="text-[11px] text-slate-400 hidden md:block">
              Auto-syncs to corresponding tab in Google Sheet
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

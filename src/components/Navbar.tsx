import React from 'react';
import { FormType, WebAppConfig } from '../types';
import {
  FileSpreadsheet,
  Globe,
  Github,
  LayoutGrid,
  Settings2,
  UserCheck,
  KeyRound,
  MessageSquareHeart,
  BarChart3,
  PlugZap
} from 'lucide-react';

export type MainNavTab = 'forms' | 'sheet' | 'analytics' | 'integrations' | 'github';

interface Props {
  activeNavTab: MainNavTab;
  onSelectNavTab: (tab: MainNavTab) => void;
  activeFormTab: FormType;
  onSelectFormTab: (tab: FormType) => void;
  webAppConfig: WebAppConfig;
  onOpenConfigModal: () => void;
  totalSubmissions: number;
}

export const Navbar: React.FC<Props> = ({
  activeNavTab,
  onSelectNavTab,
  activeFormTab,
  onSelectFormTab,
  webAppConfig,
  onOpenConfigModal,
  totalSubmissions,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/90 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Logo & Identity */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm ring-2 ring-emerald-500/20">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-lg sm:text-xl font-mono">
                  f-docx
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-md uppercase tracking-wider">
                  Sync Engine
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden md:block">
                HTML Forms directly to Google Sheets
              </p>
            </div>
          </div>

          {/* Center Main Tabs */}
          <nav className="hidden lg:flex items-center gap-1">
            <button
              onClick={() => onSelectNavTab('forms')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeNavTab === 'forms'
                  ? 'bg-emerald-50 text-emerald-800 shadow-xs ring-1 ring-emerald-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Forms Playground</span>
            </button>

            <button
              onClick={() => onSelectNavTab('sheet')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeNavTab === 'sheet'
                  ? 'bg-emerald-50 text-emerald-800 shadow-xs ring-1 ring-emerald-500/20'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Google Sheet DB</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-200/80 text-emerald-900 font-bold">
                {totalSubmissions}
              </span>
            </button>

            <button
              onClick={() => onSelectNavTab('analytics')}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
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
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
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
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                activeNavTab === 'github'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
              }`}
            >
              <Github className="w-3.5 h-3.5" />
              <span>f-docx Repo</span>
            </button>
          </nav>

          {/* Right Action: Real Script Config */}
          <div className="flex items-center gap-2">
            <button
              onClick={onOpenConfigModal}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${
                webAppConfig.syncToRealSheet && webAppConfig.scriptUrl
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
              }`}
              title="Configure live endpoint"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  webAppConfig.syncToRealSheet && webAppConfig.scriptUrl
                    ? 'bg-emerald-500 animate-pulse'
                    : 'bg-slate-400'
                }`}
              />
              <span className="hidden sm:inline">
                {webAppConfig.syncToRealSheet && webAppConfig.scriptUrl
                  ? 'Endpoint Connected'
                  : 'Configure Endpoint'}
              </span>
              <span className="sm:hidden">Endpoint</span>
              <Settings2 className="w-3 h-3 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Mobile & Tablet Secondary Navigation */}
        <div className="lg:hidden flex items-center justify-between overflow-x-auto py-2 border-t border-slate-100 text-xs gap-1">
          <button
            onClick={() => onSelectNavTab('forms')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap font-medium ${
              activeNavTab === 'forms' ? 'bg-emerald-100 text-emerald-800 font-bold' : 'text-slate-600'
            }`}
          >
            Forms
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
            f-docx Repo
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

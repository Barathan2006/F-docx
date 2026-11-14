import React, { useEffect, useState } from 'react';
import {
  AuditLogEntry,
  FormComponentType,
  FormResponseRecord,
  ManagedFormRecord,
  PlatformSettingsConfig,
  UserProfile,
} from '../../types';
import { apiDownloadFile, apiRequest } from '../../lib/api';
import { COMPONENT_CATALOG } from '../../data/formBuilderCatalog';
import { useAuth } from '../../context/AuthContext';
import {
  Activity,
  AlertTriangle,
  Ban,
  CheckCircle2,
  Download,
  ExternalLink,
  FileSpreadsheet,
  Flag,
  Globe,
  Lock,
  Pencil,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  Trash2,
  UserCheck,
  UserCog,
  Users,
  X,
  Eye,
} from 'lucide-react';

interface Props {
  onEditAnyForm: (form: ManagedFormRecord) => void;
  onOpenPublicPreview: (publicToken: string) => void;
}

type AdminSubTab = 'overview' | 'users' | 'forms' | 'responses' | 'logs' | 'settings';

export const AdminControlCenter: React.FC<Props> = ({
  onEditAnyForm,
  onOpenPublicPreview,
}) => {
  const { user: currentAdmin } = useAuth();
  const [subTab, setSubTab] = useState<AdminSubTab>('overview');
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  // Overview state
  const [metrics, setMetrics] = useState<any>(null);
  const [recentLogs, setRecentLogs] = useState<AuditLogEntry[]>([]);

  // Users state
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [userSearch, setUserSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'ADMIN' | 'USER'>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'DEACTIVATED'>('ALL');
  const [selectedUserDetails, setSelectedUserDetails] = useState<{
    user: UserProfile;
    forms: ManagedFormRecord[];
    responses: any[];
  } | null>(null);

  // Forms state
  const [allForms, setAllForms] = useState<ManagedFormRecord[]>([]);
  const [formStatusFilter, setFormStatusFilter] = useState<'ALL' | 'DRAFT' | 'PUBLISHED' | 'SUSPENDED'>('ALL');
  const [reportedOnly, setReportedOnly] = useState(false);
  const [confirmDeleteFormId, setConfirmDeleteFormId] = useState<string | null>(null);

  // Responses state
  const [allResponses, setAllResponses] = useState<FormResponseRecord[]>([]);
  const [responseFormFilter, setResponseFormFilter] = useState('');

  // Audit logs state
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [logActionFilter, setLogActionFilter] = useState('');
  const [logActorFilter, setLogActorFilter] = useState('');

  // Settings state
  const [settings, setSettings] = useState<PlatformSettingsConfig>({
    allowPublicRegistration: true,
    allowAnonymousForms: true,
    maxFormsPerUser: 100,
    disabledComponentTypes: [],
    maintenanceMode: false,
  });

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  };

  const loadOverview = async () => {
    const res = await apiRequest<{ metrics: any; recentLogs: AuditLogEntry[] }>(
      '/api/admin/overview'
    );
    setMetrics(res.metrics);
    setRecentLogs(res.recentLogs);
  };

  const loadUsers = async () => {
    const params = new URLSearchParams({
      q: userSearch,
      role: roleFilter,
      status: statusFilter,
    });
    const res = await apiRequest<{ users: UserProfile[] }>(`/api/admin/users?${params.toString()}`);
    setUsers(res.users);
  };

  const loadForms = async () => {
    const params = new URLSearchParams({
      status: formStatusFilter,
      reported: reportedOnly ? 'true' : 'false',
    });
    const res = await apiRequest<{ forms: ManagedFormRecord[] }>(
      `/api/admin/forms?${params.toString()}`
    );
    setAllForms(res.forms);
  };

  const loadResponses = async () => {
    const params = new URLSearchParams();
    if (responseFormFilter) params.set('formId', responseFormFilter);
    const res = await apiRequest<{ responses: FormResponseRecord[] }>(
      `/api/admin/responses?${params.toString()}`
    );
    setAllResponses(res.responses);
  };

  const loadAuditLogs = async () => {
    const params = new URLSearchParams();
    if (logActionFilter) params.set('action', logActionFilter);
    if (logActorFilter) params.set('actor', logActorFilter);
    const res = await apiRequest<{ logs: AuditLogEntry[] }>(
      `/api/admin/audit-logs?${params.toString()}`
    );
    setAuditLogs(res.logs);
  };

  const loadSettings = async () => {
    const res = await apiRequest<{ settings: PlatformSettingsConfig }>('/api/admin/settings');
    setSettings(res.settings);
  };

  useEffect(() => {
    setError(null);
    (async () => {
      try {
        if (subTab === 'overview') await loadOverview();
        if (subTab === 'users') await loadUsers();
        if (subTab === 'forms') await loadForms();
        if (subTab === 'responses') {
          await Promise.all([loadForms(), loadResponses()]);
        }
        if (subTab === 'logs') await loadAuditLogs();
        if (subTab === 'settings') await loadSettings();
      } catch (err: any) {
        setError(err?.message || 'Failed to load admin data.');
      }
    })();
  }, [subTab, roleFilter, statusFilter, formStatusFilter, reportedOnly, responseFormFilter]);

  const handleToggleUserStatus = async (u: UserProfile) => {
    setError(null);
    try {
      const nextStatus = u.accountStatus === 'ACTIVE' ? 'DEACTIVATED' : 'ACTIVE';
      const res = await apiRequest<{ user: UserProfile }>(`/api/admin/users/${u.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: nextStatus }),
      });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, ...res.user } : x)));
      notify(`${u.fullName} is now ${res.user.accountStatus}.`);
    } catch (err: any) {
      setError(err?.message || 'Could not update account status.');
    }
  };

  const handleChangeUserRole = async (u: UserProfile, nextRole: 'ADMIN' | 'USER') => {
    setError(null);
    try {
      const res = await apiRequest<{ user: UserProfile }>(`/api/admin/users/${u.id}/role`, {
        method: 'PATCH',
        body: JSON.stringify({ role: nextRole }),
      });
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, ...res.user } : x)));
      notify(`Updated ${u.fullName}'s role to ${res.user.role}.`);
    } catch (err: any) {
      setError(err?.message || 'Could not change user role.');
    }
  };

  const handleInspectUser = async (userId: string) => {
    setError(null);
    try {
      const details = await apiRequest<{
        user: UserProfile;
        forms: ManagedFormRecord[];
        responses: any[];
      }>(`/api/admin/users/${userId}/details`);
      setSelectedUserDetails(details);
    } catch (err: any) {
      setError(err?.message || 'Could not fetch user profile details.');
    }
  };

  const handleFormGovernance = async (
    formId: string,
    payload: { status?: 'PUBLISHED' | 'DRAFT' | 'SUSPENDED'; clearReport?: boolean }
  ) => {
    setError(null);
    try {
      const res = await apiRequest<{ form: ManagedFormRecord }>(
        `/api/admin/forms/${formId}/governance`,
        {
          method: 'PATCH',
          body: JSON.stringify(payload),
        }
      );
      setAllForms((prev) => prev.map((f) => (f.id === formId ? res.form : f)));
      notify(`Updated form governance state to ${res.form.status}.`);
    } catch (err: any) {
      setError(err?.message || 'Governance update failed.');
    }
  };

  const handleDeleteAnyForm = async (formId: string) => {
    setError(null);
    try {
      await apiRequest(`/api/forms/${formId}`, { method: 'DELETE' });
      setAllForms((prev) => prev.filter((f) => f.id !== formId));
      setConfirmDeleteFormId(null);
      notify('Form deleted permanently.');
    } catch (err: any) {
      setError(err?.message || 'Failed to delete form.');
    }
  };

  const handleSaveSettings = async () => {
    setError(null);
    try {
      const res = await apiRequest<{ settings: PlatformSettingsConfig }>('/api/admin/settings', {
        method: 'PUT',
        body: JSON.stringify(settings),
      });
      setSettings(res.settings);
      notify('Platform settings & component availability updated.');
    } catch (err: any) {
      setError(err?.message || 'Could not save settings.');
    }
  };

  const toggleComponentAvailability = (type: FormComponentType) => {
    setSettings((prev) => {
      const list = prev.disabledComponentTypes || [];
      const exists = list.includes(type);
      return {
        ...prev,
        disabledComponentTypes: exists ? list.filter((t) => t !== type) : [...list, type],
      };
    });
  };

  if (currentAdmin?.role !== 'ADMIN') {
    return (
      <div className="bg-white rounded-2xl border border-rose-200 p-10 text-center space-y-2">
        <ShieldAlert className="w-10 h-10 text-rose-600 mx-auto" />
        <h2 className="text-lg font-bold text-slate-900">Access Denied</h2>
        <p className="text-xs text-slate-500">
          Administrator privileges are required to view the Admin Control Center.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Sub-Navigation */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-2xl p-6 shadow-sm space-y-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-500/20 text-indigo-200 border border-indigo-400/30 mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ADMIN Control Center</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Platform Governance, Users & Audit Logs
          </h2>
          <p className="text-xs text-slate-300 mt-1">
            Full visibility across all registered accounts, forms, submissions, component availability, and security events.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-white/10">
          {(
            [
              ['overview', 'Overview', Activity],
              ['users', 'Users', Users],
              ['forms', 'All Forms', FileSpreadsheet],
              ['responses', 'All Responses', Download],
              ['logs', 'Audit Logs', ShieldAlert],
              ['settings', 'Settings & Components', Sliders],
            ] as const
          ).map(([key, label, Icon]) => (
            <button
              key={key}
              type="button"
              onClick={() => setSubTab(key)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                subTab === key
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'bg-white/10 text-slate-200 hover:bg-white/20'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {toast && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{toast}</span>
        </div>
      )}

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-500 hover:text-rose-800 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* A. Overview */}
      {subTab === 'overview' && metrics && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              ['Registered Users', metrics.totalUsers, `${metrics.activeUsers} active • ${metrics.adminUsers} admins`],
              ['Total Forms', metrics.totalForms, `${metrics.publishedForms} published`],
              ['Form Submissions', metrics.totalResponses, 'Across all creators'],
              ['Reported / Integrations', metrics.reportedForms, `${metrics.connectedIntegrations} Sheets OAuth active`],
            ].map(([title, value, sub], idx) => (
              <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  {title}
                </div>
                <div className="text-2xl font-extrabold text-slate-900 mt-1">{value}</div>
                <div className="text-[11px] text-slate-500 mt-1">{sub}</div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3">Recent Platform Activity</h3>
            <div className="divide-y divide-slate-100 text-xs">
              {recentLogs.map((l) => (
                <div key={l.id} className="py-2.5 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded font-mono text-[10px] font-bold bg-slate-100 text-slate-800">
                      {l.action}
                    </span>
                    <span className="font-semibold text-slate-800">
                      {l.actor_email || 'system'}
                    </span>
                    <span className="text-slate-400">
                      ({l.target_type} {l.target_id || ''})
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {new Date(l.created_at).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* B. User Management */}
      {subTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-[240px]">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') loadUsers();
                  }}
                  placeholder="Search name or email..."
                  className="w-full pl-8 pr-3 py-2 text-xs border border-slate-200 rounded-xl"
                />
              </div>
              <button
                type="button"
                onClick={loadUsers}
                className="px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold cursor-pointer"
              >
                Search
              </button>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value as any)}
                className="px-2.5 py-2 border border-slate-200 rounded-xl bg-white"
              >
                <option value="ALL">All Roles</option>
                <option value="ADMIN">ADMIN</option>
                <option value="USER">USER</option>
              </select>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-2.5 py-2 border border-slate-200 rounded-xl bg-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="DEACTIVATED">DEACTIVATED</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] uppercase text-slate-500">
                  <th className="py-2.5 pr-4">User</th>
                  <th className="py-2.5 pr-4">Role</th>
                  <th className="py-2.5 pr-4">Status</th>
                  <th className="py-2.5 pr-4">Forms / Subs</th>
                  <th className="py-2.5 pr-4">Last Login</th>
                  <th className="py-2.5 text-right">Governance Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70">
                    <td className="py-3 pr-4">
                      <div className="flex items-center gap-2.5">
                        {u.profilePictureUrl ? (
                          <img
                            src={u.profilePictureUrl}
                            alt={u.fullName}
                            className="w-8 h-8 rounded-full border border-slate-200"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center font-bold text-slate-600">
                            {u.fullName[0]}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-900">{u.fullName}</div>
                          <div className="text-[11px] text-slate-500">{u.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          u.role === 'ADMIN'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span
                        className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                          u.accountStatus === 'ACTIVE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {u.accountStatus}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-600">
                      {u.formCount ?? 0} forms • {u.submissionCount ?? 0} subs
                    </td>
                    <td className="py-3 pr-4 text-slate-500">
                      {new Date(u.lastLogin).toLocaleString()}
                    </td>
                    <td className="py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleInspectUser(u.id)}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold cursor-pointer"
                        >
                          Profile
                        </button>
                        {u.role === 'USER' ? (
                          <button
                            type="button"
                            onClick={() => handleChangeUserRole(u, 'ADMIN')}
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 font-semibold cursor-pointer"
                          >
                            Promote ADMIN
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleChangeUserRole(u, 'USER')}
                            className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-semibold cursor-pointer"
                          >
                            Demote USER
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleToggleUserStatus(u)}
                          className={`px-2.5 py-1 rounded-lg font-semibold cursor-pointer ${
                            u.accountStatus === 'ACTIVE'
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200'
                              : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {u.accountStatus === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* C. Form Governance */}
      {subTab === 'forms' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <select
                value={formStatusFilter}
                onChange={(e) => setFormStatusFilter(e.target.value as any)}
                className="px-3 py-2 border border-slate-200 rounded-xl bg-white"
              >
                <option value="ALL">All Statuses</option>
                <option value="PUBLISHED">PUBLISHED</option>
                <option value="DRAFT">DRAFT</option>
                <option value="SUSPENDED">SUSPENDED</option>
              </select>
              <label className="inline-flex items-center gap-2 font-semibold text-slate-700 cursor-pointer ml-2">
                <input
                  type="checkbox"
                  checked={reportedOnly}
                  onChange={(e) => setReportedOnly(e.target.checked)}
                  className="w-4 h-4 accent-rose-600 rounded"
                />
                <span>Reported Forms Only</span>
              </label>
            </div>
            <span className="text-xs text-slate-500">{allForms.length} forms found</span>
          </div>

          <div className="space-y-3">
            {allForms.map((f) => (
              <div
                key={f.id}
                className="p-4 rounded-xl border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                        f.status === 'PUBLISHED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : f.status === 'SUSPENDED'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {f.status}
                    </span>
                    {f.isReported && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded font-bold text-[10px] bg-rose-600 text-white">
                        <Flag className="w-2.5 h-2.5" /> REPORTED: {f.reportReason}
                      </span>
                    )}
                    <span className="font-bold text-slate-900 text-sm">{f.title}</span>
                  </div>
                  <div className="text-slate-500">
                    Creator: <strong className="text-slate-700">{f.ownerName}</strong> ({f.ownerEmail}) •{' '}
                    {f.fields.length} fields • {f.responseCount} responses
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onEditAnyForm(f)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 font-semibold cursor-pointer"
                  >
                    <Pencil className="w-3 h-3" /> Edit
                  </button>
                  {f.status === 'PUBLISHED' && (
                    <button
                      type="button"
                      onClick={() => onOpenPublicPreview(f.publicToken)}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold cursor-pointer"
                    >
                      <ExternalLink className="w-3 h-3" /> Open Public
                    </button>
                  )}
                  {f.status !== 'SUSPENDED' ? (
                    <button
                      type="button"
                      onClick={() => handleFormGovernance(f.id, { status: 'SUSPENDED' })}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-semibold cursor-pointer"
                    >
                      <Ban className="w-3 h-3" /> Suspend
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        handleFormGovernance(f.id, { status: 'PUBLISHED', clearReport: true })
                      }
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-600 text-white font-semibold cursor-pointer"
                    >
                      Restore & Clear
                    </button>
                  )}
                  {confirmDeleteFormId === f.id ? (
                    <div className="inline-flex items-center gap-1 bg-rose-50 px-2 py-1 rounded-lg border border-rose-200">
                      <button
                        type="button"
                        onClick={() => handleDeleteAnyForm(f.id)}
                        className="font-bold text-rose-700 cursor-pointer"
                      >
                        Confirm Delete
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteFormId(null)}
                        className="text-slate-500 ml-1 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteFormId(f.id)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* D. All Responses & Platform Export */}
      {subTab === 'responses' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <select
              value={responseFormFilter}
              onChange={(e) => setResponseFormFilter(e.target.value)}
              className="px-3 py-2 text-xs border border-slate-200 rounded-xl bg-white"
            >
              <option value="">All Forms</option>
              {allForms.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.title} ({f.ownerEmail})
                </option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  apiDownloadFile('/api/admin/responses/export?format=csv', 'admin_all_responses.csv')
                }
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Export All CSV
              </button>
              <button
                type="button"
                onClick={() =>
                  apiDownloadFile(
                    '/api/admin/responses/export?format=xlsx',
                    'admin_all_responses.xlsx'
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" /> Export All Excel (.xlsx)
              </button>
            </div>
          </div>

          <div className="space-y-2.5 max-h-[520px] overflow-y-auto">
            {allResponses.map((r) => (
              <div key={r.id} className="p-3.5 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-900">{r.formTitle}</span>{' '}
                    <span className="text-slate-400">by {r.formOwnerEmail}</span>
                  </div>
                  <span className="text-[11px] text-slate-500">
                    {new Date(r.submittedAt).toLocaleString()}
                  </span>
                </div>
                <div className="text-slate-600">
                  Respondent:{' '}
                  <strong>
                    {r.isAnonymous ? 'Anonymous' : `${r.respondentName} (${r.respondentEmail})`}
                  </strong>{' '}
                  • Sheets: <code className="font-mono">{r.sheetsSyncStatus}</code>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* E. Immutable Audit Logs */}
      {subTab === 'logs' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <input
              type="text"
              value={logActionFilter}
              onChange={(e) => setLogActionFilter(e.target.value)}
              placeholder="Filter action (e.g. USER_PROMOTED_ADMIN)"
              className="px-3 py-2 border border-slate-200 rounded-xl flex-1 min-w-[200px]"
            />
            <input
              type="text"
              value={logActorFilter}
              onChange={(e) => setLogActorFilter(e.target.value)}
              placeholder="Filter actor email..."
              className="px-3 py-2 border border-slate-200 rounded-xl flex-1 min-w-[200px]"
            />
            <button
              type="button"
              onClick={loadAuditLogs}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white font-semibold cursor-pointer"
            >
              Filter Logs
            </button>
          </div>

          <div className="overflow-x-auto max-h-[540px]">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-[11px] uppercase text-slate-500">
                  <th className="py-2 pr-3">Timestamp</th>
                  <th className="py-2 pr-3">Actor</th>
                  <th className="py-2 pr-3">Action</th>
                  <th className="py-2 pr-3">Target</th>
                  <th className="py-2">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td className="py-2 pr-3 text-slate-500 whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString()}
                    </td>
                    <td className="py-2 pr-3 font-medium text-slate-800">
                      {log.actor_email || 'system'}{' '}
                      <span className="text-[10px] text-slate-400">({log.actor_role})</span>
                    </td>
                    <td className="py-2 pr-3">
                      <span className="px-2 py-0.5 rounded bg-slate-100 font-mono text-[10px] font-bold text-slate-800">
                        {log.action}
                      </span>
                    </td>
                    <td className="py-2 pr-3 text-slate-600 font-mono text-[11px]">
                      {log.target_type}:{log.target_id || '-'}
                    </td>
                    <td className="py-2 text-slate-500 font-mono text-[10px] max-w-xs truncate">
                      {log.details || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* F. Platform Settings & Component Availability */}
      {subTab === 'settings' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="flex items-center justify-between p-4 rounded-xl border border-slate-200 cursor-pointer">
              <div>
                <div className="font-bold text-slate-900">Allow Anonymous Public Forms</div>
                <div className="text-slate-500">Let creators share forms without Google login</div>
              </div>
              <input
                type="checkbox"
                checked={settings.allowAnonymousForms}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, allowAnonymousForms: e.target.checked }))
                }
                className="w-4 h-4 accent-indigo-600"
              />
            </label>

            <label className="flex items-center justify-between p-4 rounded-xl border border-slate-200 cursor-pointer">
              <div>
                <div className="font-bold text-slate-900">Maintenance Mode</div>
                <div className="text-slate-500">Display platform notice to standard users</div>
              </div>
              <input
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) =>
                  setSettings((prev) => ({ ...prev, maintenanceMode: e.target.checked }))
                }
                className="w-4 h-4 accent-indigo-600"
              />
            </label>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-slate-900 text-sm">
              Component Availability Governance (27 Form Components)
            </h4>
            <p className="text-slate-500">
              Uncheck any component type below to restrict non-admin creators from adding it to new or updated forms.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
              {COMPONENT_CATALOG.map((comp) => {
                const isDisabled = (settings.disabledComponentTypes || []).includes(comp.type);
                return (
                  <label
                    key={comp.type}
                    className={`flex items-center gap-2 p-2.5 rounded-xl border cursor-pointer ${
                      isDisabled
                        ? 'bg-rose-50 border-rose-200 text-rose-800'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={!isDisabled}
                      onChange={() => toggleComponentAvailability(comp.type)}
                      className="w-3.5 h-3.5 accent-emerald-600"
                    />
                    <span className="font-semibold truncate">{comp.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSaveSettings}
              className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold cursor-pointer"
            >
              Save Platform Settings
            </button>
          </div>
        </div>
      )}

      {/* User Inspection Drawer Modal */}
      {selectedUserDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                {selectedUserDetails.user.profilePictureUrl && (
                  <img
                    src={selectedUserDetails.user.profilePictureUrl}
                    alt={selectedUserDetails.user.fullName}
                    className="w-9 h-9 rounded-full"
                  />
                )}
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {selectedUserDetails.user.fullName}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {selectedUserDetails.user.email} • Google ID: {selectedUserDetails.user.googleId}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedUserDetails(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              <div>
                <h4 className="font-bold text-slate-800 mb-2">
                  User's Forms ({selectedUserDetails.forms.length})
                </h4>
                <div className="space-y-2">
                  {selectedUserDetails.forms.map((f) => (
                    <div
                      key={f.id}
                      className="p-3 rounded-xl border border-slate-200 flex items-center justify-between"
                    >
                      <div>
                        <span className="font-bold text-slate-900">{f.title}</span>
                        <span className="ml-2 text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100">
                          {f.status}
                        </span>
                      </div>
                      <span className="text-slate-500">{f.responseCount} responses</span>
                    </div>
                  ))}
                  {selectedUserDetails.forms.length === 0 && (
                    <p className="text-slate-400">No forms created yet.</p>
                  )}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-800 mb-2">
                  Recent Submissions ({selectedUserDetails.responses.length})
                </h4>
                <div className="space-y-1.5">
                  {selectedUserDetails.responses.map((r) => (
                    <div
                      key={r.id}
                      className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between"
                    >
                      <span className="font-semibold text-slate-800">{r.formTitle}</span>
                      <span className="text-slate-500">
                        {new Date(r.submittedAt).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

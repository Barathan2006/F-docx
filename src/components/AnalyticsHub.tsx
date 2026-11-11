import React, { useState } from 'react';
import { RegistrationSubmission, UserDetailsSubmission, FeedbackSubmission } from '../types';
import {
  BarChart3,
  TrendingUp,
  Users,
  MessageSquare,
  Award,
  Calendar,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  ArrowUpRight
} from 'lucide-react';

interface Props {
  registrations: RegistrationSubmission[];
  userDetails: UserDetailsSubmission[];
  feedbacks: FeedbackSubmission[];
  onExportAllCSV: () => void;
}

export const AnalyticsHub: React.FC<Props> = ({
  registrations,
  userDetails,
  feedbacks,
  onExportAllCSV,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'registration' | 'userDetails' | 'feedback'>('all');

  // Stats calculation
  const totalSubmissions = registrations.length + userDetails.length + feedbacks.length;
  
  const avgRating = feedbacks.length > 0
    ? (feedbacks.reduce((acc, f) => acc + f.rating, 0) / feedbacks.length).toFixed(1)
    : '5.0';

  const avgNps = feedbacks.length > 0
    ? (feedbacks.reduce((acc, f) => acc + f.npsScore, 0) / feedbacks.length).toFixed(1)
    : '10.0';

  // Department counts
  const deptCounts: Record<string, number> = {};
  userDetails.forEach((u) => {
    deptCounts[u.department] = (deptCounts[u.department] || 0) + 1;
  });

  // Ticket tier counts
  const ticketCounts: Record<string, number> = {};
  registrations.forEach((r) => {
    ticketCounts[r.ticketType] = (ticketCounts[r.ticketType] || 0) + 1;
  });

  // Aggregate recent unified timeline
  const timelineEvents = [
    ...registrations.map((r) => ({
      id: r.id,
      type: 'Registration',
      title: r.fullName,
      subtitle: `${r.ticketType} • ${r.organization || 'Attendee'}`,
      time: r.submittedAt,
      tagColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    })),
    ...userDetails.map((u) => ({
      id: u.id,
      type: 'User Account',
      title: u.fullName,
      subtitle: `${u.jobTitle || 'Team Member'} (${u.department})`,
      time: u.submittedAt,
      tagColor: 'bg-blue-100 text-blue-800 border-blue-200',
    })),
    ...feedbacks.map((f) => ({
      id: f.id,
      type: 'Feedback',
      title: `${f.rating}★ Review from ${f.customerName || 'Customer'}`,
      subtitle: f.feedbackMessage,
      time: f.submittedAt,
      tagColor: 'bg-amber-100 text-amber-800 border-amber-200',
    })),
  ].sort((a, b) => b.id.localeCompare(a.id));

  const filteredEvents = timelineEvents.filter((item) => {
    if (filterType === 'registration') return item.type === 'Registration';
    if (filterType === 'userDetails') return item.type === 'User Account';
    if (filterType === 'feedback') return item.type === 'Feedback';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 mb-2">
              <BarChart3 className="w-3.5 h-3.5 text-emerald-600" />
              Live Submissions Analytics & Insights
            </div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              Real-Time Forms Performance
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Live submission metrics, conversion breakdown, and unified activity stream across all 3 forms.
            </p>
          </div>

          <button
            onClick={onExportAllCSV}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-sm transition-colors cursor-pointer self-start sm:self-auto"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Export Submissions Data</span>
          </button>
        </div>

        {/* Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Total Submissions
              </span>
              <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{totalSubmissions}</span>
              <span className="text-xs text-emerald-700 font-semibold flex items-center">
                <ArrowUpRight className="w-3 h-3" /> Live
              </span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Synced across 3 form channels
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Registrations
              </span>
              <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                <Users className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{registrations.length}</span>
              <span className="text-xs text-slate-500">Attendees</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Event & workshop tickets
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                User Profiles
              </span>
              <span className="p-1.5 rounded-lg bg-blue-100 text-blue-700">
                <Award className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{userDetails.length}</span>
              <span className="text-xs text-slate-500">Profiles</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Staff & customer accounts
            </span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Customer Satisfaction
              </span>
              <span className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                <MessageSquare className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{avgRating} / 5</span>
              <span className="text-xs text-amber-700 font-semibold">NPS {avgNps}</span>
            </div>
            <span className="text-[11px] text-slate-400 mt-1 block">
              Based on {feedbacks.length} reviews
            </span>
          </div>
        </div>
      </div>

      {/* Two Column Section: Category Distribution & Activity Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Distribution Breakdown */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm mb-4">
              Ticket Tier Breakdown
            </h3>
            <div className="space-y-3">
              {Object.entries(ticketCounts).map(([tier, count]) => {
                const percentage = registrations.length > 0 ? Math.round((count / registrations.length) * 100) : 0;
                return (
                  <div key={tier}>
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>{tier}</span>
                      <span>{count} ({percentage}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm mb-4">
              Department Distribution
            </h3>
            <div className="space-y-3">
              {Object.entries(deptCounts).map(([dept, count]) => {
                const percentage = userDetails.length > 0 ? Math.round((count / userDetails.length) * 100) : 0;
                return (
                  <div key={dept}>
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-1">
                      <span>{dept}</span>
                      <span>{count} ({percentage}%)</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Live Activity Stream */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Unified Submissions Stream</h3>
              <p className="text-xs text-slate-500">Live feed of data received across all forms</p>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1 text-xs">
              <button
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                  filterType === 'all'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                All
              </button>
              <button
                onClick={() => setFilterType('registration')}
                className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                  filterType === 'registration'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Registrations
              </button>
              <button
                onClick={() => setFilterType('userDetails')}
                className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                  filterType === 'userDetails'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Users
              </button>
              <button
                onClick={() => setFilterType('feedback')}
                className={`px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors ${
                  filterType === 'feedback'
                    ? 'bg-amber-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                Feedback
              </button>
            </div>
          </div>

          <div className="space-y-3 max-h-[480px] overflow-y-auto pr-1">
            {filteredEvents.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Clock className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-medium">No activity in this view yet</p>
              </div>
            ) : (
              filteredEvents.map((event) => (
                <div
                  key={event.id}
                  className="p-3.5 rounded-xl border border-slate-200/70 hover:border-slate-300 bg-slate-50/50 hover:bg-white transition-all flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${event.tagColor}`}>
                        {event.type}
                      </span>
                      <span className="font-semibold text-slate-900 text-xs">
                        {event.title}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1">
                      {event.subtitle}
                    </p>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 shrink-0">
                    {event.time}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

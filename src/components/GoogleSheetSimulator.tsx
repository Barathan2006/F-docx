import React, { useState } from 'react';
import { RegistrationSubmission, UserDetailsSubmission, FeedbackSubmission, FormType } from '../types';
import {
  FileSpreadsheet,
  Download,
  Trash2,
  Plus,
  Search,
  Check,
  Share2,
  Table,
  Sparkles,
  ExternalLink,
  ChevronDown
} from 'lucide-react';

interface Props {
  registrations: RegistrationSubmission[];
  userDetails: UserDetailsSubmission[];
  feedbacks: FeedbackSubmission[];
  activeSheetTab: FormType;
  onSelectTab: (tab: FormType) => void;
  onClearCurrentSheet: (tab: FormType) => void;
  onAddDummyRow: (tab: FormType) => void;
}

export const GoogleSheetSimulator: React.FC<Props> = ({
  registrations,
  userDetails,
  feedbacks,
  activeSheetTab,
  onSelectTab,
  onClearCurrentSheet,
  onAddDummyRow,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number; value: string } | null>({
    row: 1,
    col: 1,
    value: 'Timestamp',
  });
  const [copiedNotification, setCopiedNotification] = useState(false);

  // Column definitions per sheet
  const sheetConfig = {
    registration: {
      title: 'Registrations',
      columns: [
        'Timestamp',
        'Full Name',
        'Email',
        'Phone',
        'Organization',
        'Ticket Type',
        'Track',
        'Dietary',
        'Accommodation',
        'Notes',
      ],
      data: registrations.map((r) => [
        r.submittedAt,
        r.fullName,
        r.email,
        r.phone || '—',
        r.organization || '—',
        r.ticketType,
        r.track,
        r.dietary,
        r.needAccommodation ? 'Yes' : 'No',
        r.notes || '—',
      ]),
    },
    userDetails: {
      title: 'UserDetails',
      columns: [
        'Timestamp',
        'Username',
        'Full Name',
        'Work Email',
        'Department',
        'Job Title',
        'Access Level',
        'Region',
        '2FA Enforced',
        'Internal Notes',
      ],
      data: userDetails.map((u) => [
        u.submittedAt,
        u.username,
        u.fullName,
        u.workEmail,
        u.department,
        u.jobTitle || '—',
        u.accessLevel,
        u.region,
        u.twoFactorEnabled ? 'Enabled' : 'Disabled',
        u.internalNotes || '—',
      ]),
    },
    feedback: {
      title: 'Feedbacks',
      columns: [
        'Timestamp',
        'Customer Name',
        'Email',
        'Category',
        'Rating',
        'NPS Score',
        'Feedback Message',
        'Recommend',
        'Priority',
      ],
      data: feedbacks.map((f) => [
        f.submittedAt,
        f.customerName || 'Anonymous',
        f.email,
        f.category,
        `${f.rating} ★`,
        `${f.npsScore}/10`,
        f.feedbackMessage,
        f.wouldRecommend,
        f.priority,
      ]),
    },
  };

  const currentConfig = sheetConfig[activeSheetTab];

  // Filter rows based on search
  const filteredData = currentConfig.data.filter((row) =>
    row.some((cell) => String(cell).toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getColLetter = (index: number) => String.fromCharCode(65 + index);

  // Export current sheet to CSV
  const handleExportCSV = () => {
    const headers = currentConfig.columns.join(',');
    const rows = currentConfig.data.map((r) =>
      r.map((val) => `"${String(val).replace(/"/g, '""')}"`).join(',')
    );
    const csvContent = [headers, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `f-docx_${currentConfig.title}_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyJSON = () => {
    const jsonStr = JSON.stringify(
      activeSheetTab === 'registration'
        ? registrations
        : activeSheetTab === 'userDetails'
        ? userDetails
        : feedbacks,
      null,
      2
    );
    navigator.clipboard.writeText(jsonStr);
    setCopiedNotification(true);
    setTimeout(() => setCopiedNotification(false), 2000);
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-300 shadow-md overflow-hidden flex flex-col">
      {/* Google Sheets Authentic Header */}
      <div className="bg-[#f9fbfd] border-b border-slate-200 px-4 py-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-800 text-sm sm:text-base">
                  f-docx Submissions Database 2026
                </h3>
                <span className="text-[11px] font-medium text-emerald-700 bg-emerald-100/70 px-2 py-0.5 rounded-full border border-emerald-300/50">
                  Live Sync Active
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                <span>File</span>
                <span>Edit</span>
                <span>View</span>
                <span>Insert</span>
                <span>Format</span>
                <span>Data</span>
                <span>Tools</span>
                <span className="text-emerald-700 font-semibold cursor-pointer">Extensions → Apps Script</span>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search spreadsheet..."
                className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-500 w-36 sm:w-48 text-slate-800"
              />
            </div>

            <button
              onClick={() => onAddDummyRow(activeSheetTab)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition-colors cursor-pointer"
              title="Append a sample test row"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>+ Add Row</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
              title="Download as CSV file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <button
              onClick={handleCopyJSON}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              {copiedNotification ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-600 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Table className="w-3.5 h-3.5" />
                  <span>Copy JSON</span>
                </>
              )}
            </button>

            <button
              onClick={() => {
                if (confirm(`Are you sure you want to clear all rows in "${currentConfig.title}"?`)) {
                  onClearCurrentSheet(activeSheetTab);
                }
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors cursor-pointer"
              title="Clear current sheet rows"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Formula Bar */}
        <div className="mt-2 pt-2 border-t border-slate-200/70 flex items-center gap-2 text-xs">
          <div className="bg-white border border-slate-200 px-2.5 py-1 rounded font-mono font-medium text-slate-700 w-16 text-center">
            {selectedCell ? `${getColLetter(selectedCell.col)}${selectedCell.row}` : 'A1'}
          </div>
          <div className="font-serif italic font-bold text-slate-400 select-none px-1">
            fx
          </div>
          <div className="flex-1 bg-white border border-slate-200 px-3 py-1 rounded font-mono text-slate-800 truncate">
            {selectedCell?.value ?? ''}
          </div>
        </div>
      </div>

      {/* Spreadsheet Grid Table */}
      <div className="overflow-x-auto max-h-[460px] relative bg-white">
        <table className="w-full border-collapse text-xs select-text">
          {/* Top row: Column Letters A, B, C, D... */}
          <thead className="sticky top-0 z-20">
            <tr className="bg-slate-100 text-slate-600 border-b border-slate-300">
              <th className="w-12 px-2 py-1.5 border-r border-slate-300 bg-slate-200/80 font-mono text-center font-semibold text-slate-600 select-none">
                #
              </th>
              {currentConfig.columns.map((colName, index) => (
                <th
                  key={index}
                  className="px-3 py-1.5 border-r border-slate-300 font-mono font-medium text-slate-600 text-center select-none bg-slate-100 min-w-[140px]"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>{getColLetter(index)}</span>
                  </div>
                </th>
              ))}
            </tr>

            {/* Row 1: Header names formatted like Google Sheets green header */}
            <tr className="bg-emerald-50 text-emerald-950 border-b-2 border-emerald-300 font-bold shadow-sm">
              <td className="w-12 px-2 py-2 border-r border-slate-300 bg-slate-200/90 font-mono text-center text-slate-700 select-none">
                1
              </td>
              {currentConfig.columns.map((colName, index) => (
                <td
                  key={index}
                  onClick={() => setSelectedCell({ row: 1, col: index, value: colName })}
                  className={`px-3 py-2 border-r border-slate-200 cursor-cell font-semibold text-emerald-900 transition-colors ${
                    selectedCell?.row === 1 && selectedCell?.col === index
                      ? 'ring-2 ring-emerald-500 bg-emerald-100'
                      : 'hover:bg-emerald-100/50'
                  }`}
                >
                  {colName}
                </td>
              ))}
            </tr>
          </thead>

          {/* Data Rows */}
          <tbody>
            {filteredData.length === 0 ? (
              <tr>
                <td
                  colSpan={currentConfig.columns.length + 1}
                  className="py-12 text-center text-slate-400 bg-slate-50/50"
                >
                  <FileSpreadsheet className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                  <p className="font-medium text-slate-600">No submissions in this sheet yet</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Submit the form on the left or click "+ Add Row" above.
                  </p>
                </td>
              </tr>
            ) : (
              filteredData.map((row, rowIndex) => {
                const sheetRowNum = rowIndex + 2; // header is row 1
                const isNewest = rowIndex === filteredData.length - 1;

                return (
                  <tr
                    key={rowIndex}
                    className={`border-b border-slate-200/80 transition-colors ${
                      isNewest ? 'bg-emerald-50/40' : 'hover:bg-slate-50'
                    }`}
                  >
                    {/* Row Number */}
                    <td className="w-12 px-2 py-2 border-r border-slate-300 bg-slate-100 font-mono text-center text-slate-500 select-none">
                      {sheetRowNum}
                    </td>

                    {/* Data Cells */}
                    {row.map((val, colIndex) => {
                      const isSelected =
                        selectedCell?.row === sheetRowNum && selectedCell?.col === colIndex;

                      return (
                        <td
                          key={colIndex}
                          onClick={() =>
                            setSelectedCell({
                              row: sheetRowNum,
                              col: colIndex,
                              value: String(val),
                            })
                          }
                          className={`px-3 py-2 border-r border-slate-200 truncate max-w-[260px] font-sans text-slate-700 cursor-cell transition-all ${
                            isSelected
                              ? 'ring-2 ring-emerald-500 bg-emerald-50/80 font-medium'
                              : ''
                          }`}
                          title={String(val)}
                        >
                          {colIndex === 0 ? (
                            <span className="font-mono text-[11px] text-slate-500">{val}</span>
                          ) : String(val).startsWith('+') ? (
                            <span className="font-mono text-slate-600">{val}</span>
                          ) : val === 'VIP' ? (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-purple-100 text-purple-700">
                              VIP
                            </span>
                          ) : val === 'Administrator' ? (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-100 text-rose-700">
                              Admin
                            </span>
                          ) : String(val).includes('★') ? (
                            <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-100 text-amber-800">
                              {val}
                            </span>
                          ) : (
                            String(val)
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Google Sheets Bottom Tabs Bar */}
      <div className="bg-[#f0f3f6] border-t border-slate-300 px-3 py-1.5 flex items-center justify-between gap-3 text-xs select-none">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => onSelectTab('registration')}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-t-md font-medium border-t-2 transition-all cursor-pointer ${
              activeSheetTab === 'registration'
                ? 'bg-white text-emerald-800 border-emerald-600 shadow-sm font-semibold'
                : 'text-slate-600 hover:bg-slate-200 border-transparent'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Registrations</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700">
              {registrations.length}
            </span>
          </button>

          <button
            onClick={() => onSelectTab('userDetails')}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-t-md font-medium border-t-2 transition-all cursor-pointer ${
              activeSheetTab === 'userDetails'
                ? 'bg-white text-blue-800 border-blue-600 shadow-sm font-semibold'
                : 'text-slate-600 hover:bg-slate-200 border-transparent'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>UserDetails</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700">
              {userDetails.length}
            </span>
          </button>

          <button
            onClick={() => onSelectTab('feedback')}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-t-md font-medium border-t-2 transition-all cursor-pointer ${
              activeSheetTab === 'feedback'
                ? 'bg-white text-amber-900 border-amber-600 shadow-sm font-semibold'
                : 'text-slate-600 hover:bg-slate-200 border-transparent'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span>Feedbacks</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700">
              {feedbacks.length}
            </span>
          </button>
        </div>

        <div className="flex items-center gap-3 text-slate-500 text-[11px] shrink-0 font-medium">
          <span>{filteredData.length} row(s) loaded</span>
          <span>•</span>
          <span className="text-emerald-700 font-semibold">100% Real-time Reactive</span>
        </div>
      </div>
    </div>
  );
};

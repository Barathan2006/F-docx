import React, { useState } from 'react';
import { COMPONENT_CATALOG, ComponentCatalogItem } from '../../data/formBuilderCatalog';
import { FormComponentType } from '../../types';
import {
  Type,
  AlignLeft,
  Hash,
  Mail,
  Phone,
  Link,
  Calendar,
  Clock,
  CalendarClock,
  Paperclip,
  ImagePlus,
  CircleDot,
  CheckSquare,
  ChevronDownSquare,
  ListChecks,
  SlidersHorizontal,
  Star,
  ToggleRight,
  Grid3X3,
  Table2,
  Heading,
  FileText,
  FolderKanban,
  Minus,
  Image,
  Video,
  SplitSquareHorizontal,
  Search,
  Plus,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  Type,
  AlignLeft,
  Hash,
  Mail,
  Phone,
  Link,
  Calendar,
  Clock,
  CalendarClock,
  Paperclip,
  ImagePlus,
  CircleDot,
  CheckSquare,
  ChevronDownSquare,
  ListChecks,
  SlidersHorizontal,
  Star,
  ToggleRight,
  Grid3X3,
  Table2,
  Heading,
  FileText,
  FolderKanban,
  Minus,
  Image,
  Video,
  SplitSquareHorizontal,
};

interface Props {
  onAddComponent: (type: FormComponentType) => void;
}

const SHEET_TYPE_BADGE_COLORS: Record<string, string> = {
  TEXT: 'bg-slate-100 text-slate-600',
  NUMBER: 'bg-blue-50 text-blue-700',
  DATE: 'bg-indigo-50 text-indigo-700',
  TIME: 'bg-indigo-50 text-indigo-700',
  DATETIME: 'bg-indigo-50 text-indigo-700',
  BOOLEAN: 'bg-amber-50 text-amber-700',
  'FILE URL': 'bg-emerald-50 text-emerald-700',
  'IMAGE URL': 'bg-emerald-50 text-emerald-700',
  'SEPARATE COLUMNS': 'bg-purple-50 text-purple-700',
  'COMBINED OR SEPARATE': 'bg-purple-50 text-purple-700',
  'LAYOUT ONLY': 'bg-slate-100 text-slate-400',
};

export const ComponentPanel: React.FC<Props> = ({ onAddComponent }) => {
  const [search, setSearch] = useState('');
  const [openCategories, setOpenCategories] = useState<Record<'basic' | 'choice' | 'layout', boolean>>({
    basic: true,
    choice: true,
    layout: true,
  });

  const categories: { id: 'basic' | 'choice' | 'layout'; title: string; count: number }[] = [
    { id: 'basic', title: 'A. Basic Input Components', count: 11 },
    { id: 'choice', title: 'B. Choice Components', count: 9 },
    { id: 'layout', title: 'C. Content & Layout', count: 7 },
  ];

  const filterItem = (item: ComponentCatalogItem) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      item.label.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.sheetType.toLowerCase().includes(q)
    );
  };

  const toggleCategory = (cat: 'basic' | 'choice' | 'layout') => {
    setOpenCategories((prev) => ({ ...prev, [cat]: !prev[cat] }));
  };

  return (
    <aside className="bg-white rounded-2xl border border-slate-200/90 shadow-sm flex flex-col overflow-hidden h-full">
      <div className="p-4 border-b border-slate-100 bg-slate-50/70">
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Add Component
          </h3>
          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
            27 Types
          </span>
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search inputs, grids, layout..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-800"
          />
        </div>
      </div>

      <div className="p-3 overflow-y-auto space-y-4 max-h-[680px]">
        {categories.map((cat) => {
          const items = COMPONENT_CATALOG.filter((i) => i.category === cat.id && filterItem(i));
          if (items.length === 0) return null;
          const isOpen = openCategories[cat.id] || search.trim().length > 0;

          return (
            <div key={cat.id} className="space-y-1.5">
              <button
                type="button"
                onClick={() => toggleCategory(cat.id)}
                className="w-full flex items-center justify-between px-2 py-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 uppercase tracking-wider cursor-pointer"
              >
                <span>{cat.title}</span>
                <span className="inline-flex items-center gap-1 text-slate-400">
                  <span>{items.length}</span>
                  {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                </span>
              </button>

              {isOpen && (
                <div className="grid grid-cols-1 gap-1.5">
                  {items.map((item) => {
                    const Icon = ICON_MAP[item.iconName] || Type;
                    const badgeColor = SHEET_TYPE_BADGE_COLORS[item.sheetType] || 'bg-slate-100 text-slate-600';

                    return (
                      <button
                        key={item.type}
                        type="button"
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('application/x-fdx-component', item.type);
                          e.dataTransfer.effectAllowed = 'copy';
                        }}
                        onClick={() => onAddComponent(item.type)}
                        className="group w-full text-left p-2.5 rounded-xl border border-slate-200/80 bg-white hover:border-emerald-400 hover:bg-emerald-50/40 transition-all flex items-start gap-2.5 cursor-pointer"
                      >
                        <div className="w-7 h-7 rounded-lg bg-slate-100 group-hover:bg-emerald-100 text-slate-600 group-hover:text-emerald-700 flex items-center justify-center shrink-0 transition-colors mt-0.5">
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-semibold text-slate-800 group-hover:text-emerald-950 truncate">
                              {item.label}
                            </span>
                            <Plus className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-600 shrink-0 transition-colors" />
                          </div>
                          <div className="flex items-center justify-between gap-1 mt-0.5">
                            <span className="text-[10px] text-slate-500 truncate">{item.description}</span>
                            <span
                              className={`text-[9px] font-mono font-semibold px-1.5 py-0.2 rounded shrink-0 ${badgeColor}`}
                            >
                              {item.sheetType === 'SEPARATE COLUMNS'
                                ? 'COLS'
                                : item.sheetType === 'COMBINED OR SEPARATE'
                                ? 'GRID'
                                : item.sheetType === 'LAYOUT ONLY'
                                ? 'LAYOUT'
                                : item.sheetType}
                            </span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
};

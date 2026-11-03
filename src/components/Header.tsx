import React from 'react';
import { formatDateReadable, addDays, isSameDay } from '../utils/time';
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CalendarIcon,
  DownloadIcon,
  UploadIcon,
  SettingsIcon,
  SidebarIcon,
  FileTextIcon,
} from './Icons';

interface HeaderProps {
  activeDate: string;
  onChangeDate: (newDate: string) => void;
  onGoToday: () => void;
  totalBlocks: number;
  completedBlocks: number;
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  scratchpadOpen: boolean;
  onToggleScratchpad: () => void;
  onOpenSettings: () => void;
  onExportData: () => void;
  onImportData: () => void;
  onOpenCommandPalette: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeDate,
  onChangeDate,
  onGoToday,
  totalBlocks,
  completedBlocks,
  sidebarOpen,
  onToggleSidebar,
  scratchpadOpen,
  onToggleScratchpad,
  onOpenSettings,
  onExportData,
  onImportData,
  onOpenCommandPalette,
}) => {
  const isCurrentDay = isSameDay(activeDate);
  const progressPercent = totalBlocks > 0 ? Math.round((completedBlocks / totalBlocks) * 100) : 0;

  return (
    <header className="h-14 border-b border-zinc-800 bg-zinc-950 px-4 flex items-center justify-between select-none z-30">
      {/* Left: Brand + Sidebar toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className={`p-1.5 rounded hover:bg-zinc-800 transition-colors ${
            sidebarOpen ? 'text-blue-400' : 'text-zinc-400'
          }`}
          title="Toggle Backlog Sidebar"
        >
          <SidebarIcon size={16} />
        </button>

        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
          <span className="font-bold text-sm tracking-tight text-zinc-100">FocusFlow</span>
        </div>
      </div>

      {/* Center: Date Navigation */}
      <div className="flex items-center gap-1.5 bg-zinc-900 border border-zinc-800 rounded-lg p-1">
        <button
          type="button"
          onClick={() => onChangeDate(addDays(activeDate, -1))}
          className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
          title="Previous Day"
        >
          <ChevronLeftIcon size={14} />
        </button>

        <div className="flex items-center gap-1.5 px-2">
          <CalendarIcon size={13} className="text-blue-400" />
          <span className="text-xs font-semibold text-zinc-200">
            {formatDateReadable(activeDate)}
          </span>
          {isCurrentDay && (
            <span className="text-[10px] bg-blue-500/20 text-blue-300 font-mono px-1.5 py-0.2 rounded font-medium">
              Today
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={() => onChangeDate(addDays(activeDate, 1))}
          className="p-1 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
          title="Next Day"
        >
          <ChevronRightIcon size={14} />
        </button>

        {!isCurrentDay && (
          <button
            type="button"
            onClick={onGoToday}
            className="ml-1 text-[11px] font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-2 py-0.5 rounded transition-colors"
          >
            Jump to Today
          </button>
        )}
      </div>

      {/* Right: Progress stats + Actions */}
      <div className="flex items-center gap-3">
        {/* Progress indicator */}
        {totalBlocks > 0 && (
          <div className="hidden md:flex items-center gap-2 pr-2 border-r border-zinc-800">
            <div className="w-20 bg-zinc-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-blue-500 h-full rounded-full transition-all duration-300"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <span className="text-[11px] font-mono text-zinc-400">
              {completedBlocks}/{totalBlocks} ({progressPercent}%)
            </span>
          </div>
        )}

        {/* Global Command Palette Trigger */}
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="hidden sm:flex items-center gap-1.5 text-xs text-zinc-400 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 px-2.5 py-1 rounded-md transition-colors"
        >
          <span>Quick Find</span>
          <kbd className="text-[10px] bg-zinc-800 px-1.5 py-0.5 rounded font-mono text-zinc-400 border border-zinc-700">
            Ctrl+K
          </kbd>
        </button>

        {/* Export / Import Data */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={onExportData}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Export full data backup (JSON)"
          >
            <DownloadIcon size={15} />
          </button>
          <button
            type="button"
            onClick={onImportData}
            className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Import data backup (JSON)"
          >
            <UploadIcon size={15} />
          </button>
        </div>

        {/* Settings button */}
        <button
          type="button"
          onClick={onOpenSettings}
          className="p-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
          title="Timeline & Work Hour Settings"
        >
          <SettingsIcon size={15} />
        </button>

        {/* Scratchpad Toggle */}
        <button
          type="button"
          onClick={onToggleScratchpad}
          className={`p-1.5 rounded hover:bg-zinc-800 transition-colors ${
            scratchpadOpen ? 'text-blue-400' : 'text-zinc-400'
          }`}
          title="Toggle Scratchpad / Notes Drawer"
        >
          <FileTextIcon size={16} />
        </button>
      </div>
    </header>
  );
};

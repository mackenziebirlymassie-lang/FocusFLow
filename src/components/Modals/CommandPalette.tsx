import React, { useState, useEffect, useRef } from 'react';
import { Task, TimeBlock } from '../../types';
import { SearchIcon, XIcon, CalendarIcon, PlusIcon, DownloadIcon, SettingsIcon, CheckIcon } from '../Icons';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  blocks: TimeBlock[];
  onGoToday: () => void;
  onOpenSettings: () => void;
  onExportData: () => void;
  onFocusTask: (taskId: string) => void;
  onSelectBlock: (blockId: string) => void;
}

interface CommandItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  action: () => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  tasks,
  blocks,
  onGoToday,
  onOpenSettings,
  onExportData,
  onSelectBlock,
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  const defaultCommands: CommandItem[] = [
    {
      id: 'today',
      title: 'Jump to Today',
      subtitle: 'View today’s timeline and blocks',
      icon: <CalendarIcon size={14} className="text-blue-400" />,
      action: () => {
        onGoToday();
        onClose();
      },
    },
    {
      id: 'settings',
      title: 'Open Settings',
      subtitle: 'Configure work hours, snap interval, and zoom',
      icon: <SettingsIcon size={14} className="text-amber-400" />,
      action: () => {
        onOpenSettings();
        onClose();
      },
    },
    {
      id: 'export',
      title: 'Export Backup (JSON)',
      subtitle: 'Download complete offline snapshot',
      icon: <DownloadIcon size={14} className="text-emerald-400" />,
      action: () => {
        onExportData();
        onClose();
      },
    },
  ];

  // Search matching tasks and blocks
  const matchedTasks: CommandItem[] = tasks
    .filter((t) => t.title.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 4)
    .map((t) => ({
      id: `task-${t.id}`,
      title: `Task: ${t.title}`,
      subtitle: `Backlog • ${t.priority.toUpperCase()} • ${t.estimatedMinutes}m`,
      icon: <CheckIcon size={14} className="text-zinc-400" />,
      action: () => {
        onClose();
      },
    }));

  const matchedBlocks: CommandItem[] = blocks
    .filter((b) => b.title.toLowerCase().includes(query.toLowerCase()))
    .slice(0, 4)
    .map((b) => ({
      id: `block-${b.id}`,
      title: `Block: ${b.title}`,
      subtitle: `Scheduled • ${b.date} • ${b.durationMinutes}m`,
      icon: <PlusIcon size={14} className="text-purple-400" />,
      action: () => {
        onSelectBlock(b.id);
        onClose();
      },
    }));

  const filteredCommands = query
    ? [...defaultCommands.filter((c) => c.title.toLowerCase().includes(query.toLowerCase())), ...matchedTasks, ...matchedBlocks]
    : defaultCommands;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredCommands.length) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredCommands[selectedIndex]) {
        filteredCommands[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/75 backdrop-blur-xs select-none"
      onClick={onClose}
    >
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input */}
        <div className="p-3 border-b border-zinc-800 flex items-center gap-2.5">
          <SearchIcon size={15} className="text-zinc-500 ml-1" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search tasks..."
            className="w-full bg-transparent text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-zinc-500 hover:text-zinc-300"
          >
            <XIcon size={14} />
          </button>
        </div>

        {/* Command List */}
        <div className="max-h-80 overflow-y-auto p-1.5 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="text-center py-6 text-xs text-zinc-500">No matching commands or tasks</div>
          ) : (
            filteredCommands.map((item, idx) => (
              <div
                key={item.id}
                onMouseEnter={() => setSelectedIndex(idx)}
                onClick={item.action}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                  idx === selectedIndex ? 'bg-blue-600/20 text-white' : 'text-zinc-300 hover:bg-zinc-800/60'
                }`}
              >
                <div className="flex-shrink-0">{item.icon}</div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium truncate">{item.title}</div>
                  {item.subtitle && (
                    <div className="text-[10px] text-zinc-500 truncate">{item.subtitle}</div>
                  )}
                </div>
                {idx === selectedIndex && (
                  <span className="text-[10px] font-mono text-blue-400">↵ Enter</span>
                )}
              </div>
            ))
          )}
        </div>

        <div className="p-2 border-t border-zinc-800 bg-zinc-950/80 text-[10px] text-zinc-500 flex items-center justify-between px-3">
          <span>Navigate with ↑ ↓ • Select with ↵</span>
          <span>Esc to exit</span>
        </div>
      </div>
    </div>
  );
};

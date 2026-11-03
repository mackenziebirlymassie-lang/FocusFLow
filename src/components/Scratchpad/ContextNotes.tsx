import React, { useState, useEffect } from 'react';
import { VisualBlock, DailyNote } from '../../types';
import { parseMarkdown, toggleMarkdownCheckbox } from '../../utils/markdown';
import { formatDateReadable, minutesToTimeString } from '../../utils/time';
import { FileTextIcon, EditIcon, CheckIcon, XIcon } from '../Icons';

interface ContextNotesProps {
  activeDate: string;
  selectedBlock: VisualBlock | null;
  dailyNote: DailyNote | null;
  onUpdateBlockNotes: (blockId: string, notes: string, title?: string, color?: string) => void;
  onUpdateDailyNote: (date: string, content: string) => void;
  onClose: () => void;
}

const ACCENT_COLORS = [
  '#3b82f6', // blue
  '#10b981', // emerald
  '#f59e0b', // amber
  '#ef4444', // rose
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
];

export const ContextNotes: React.FC<ContextNotesProps> = ({
  activeDate,
  selectedBlock,
  dailyNote,
  onUpdateBlockNotes,
  onUpdateDailyNote,
  onClose,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState('');
  const [blockTitle, setBlockTitle] = useState('');
  const [blockColor, setBlockColor] = useState('#3b82f6');

  // Synchronize state when selected block or daily note changes
  useEffect(() => {
    if (selectedBlock) {
      setContent(selectedBlock.notes || '');
      setBlockTitle(selectedBlock.title);
      setBlockColor(selectedBlock.color || '#3b82f6');
    } else {
      setContent(dailyNote ? dailyNote.content : '');
      setBlockTitle('');
    }
  }, [selectedBlock, dailyNote]);

  const handleContentChange = (newVal: string) => {
    setContent(newVal);
    if (selectedBlock) {
      onUpdateBlockNotes(selectedBlock.id, newVal, blockTitle, blockColor);
    } else {
      onUpdateDailyNote(activeDate, newVal);
    }
  };

  const handleTitleChange = (newTitle: string) => {
    setBlockTitle(newTitle);
    if (selectedBlock) {
      onUpdateBlockNotes(selectedBlock.id, content, newTitle, blockColor);
    }
  };

  const handleColorChange = (newColor: string) => {
    setBlockColor(newColor);
    if (selectedBlock) {
      onUpdateBlockNotes(selectedBlock.id, content, blockTitle, newColor);
    }
  };

  const handlePreviewClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const button = target.closest('button[data-check-idx]');
    if (button) {
      const idxStr = button.getAttribute('data-check-idx');
      if (idxStr !== null) {
        const idx = parseInt(idxStr, 10);
        const updated = toggleMarkdownCheckbox(content, idx);
        handleContentChange(updated);
      }
    }
  };

  const formattedHtml = parseMarkdown(content);

  return (
    <div className="w-88 border-l border-zinc-800 bg-zinc-950 flex flex-col h-full overflow-hidden select-none">
      {/* Drawer Header */}
      <div className="p-3.5 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <FileTextIcon size={14} className="text-blue-400 flex-shrink-0" />
          <div className="min-w-0">
            <h3 className="text-xs font-bold text-zinc-200 truncate">
              {selectedBlock ? 'Time Block Notes' : 'Daily Scratchpad'}
            </h3>
            <p className="text-[10px] text-zinc-500 font-mono">
              {selectedBlock
                ? `${minutesToTimeString(selectedBlock.startMinutes)} - ${minutesToTimeString(
                    selectedBlock.startMinutes + selectedBlock.durationMinutes
                  )} (${selectedBlock.durationMinutes}m)`
                : formatDateReadable(activeDate)}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIsEditing(!isEditing)}
            className={`p-1.5 rounded text-xs flex items-center gap-1 transition-colors ${
              isEditing
                ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
            }`}
            title={isEditing ? 'View formatted preview' : 'Edit raw markdown'}
          >
            {isEditing ? <CheckIcon size={12} /> : <EditIcon size={12} />}
            <span className="text-[10px] font-medium">{isEditing ? 'Done' : 'Edit'}</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
            title="Collapse drawer"
          >
            <XIcon size={13} />
          </button>
        </div>
      </div>

      {/* Selected Block Metadata Controls */}
      {selectedBlock && (
        <div className="p-3 border-b border-zinc-800/80 bg-zinc-900/30 space-y-2">
          <div>
            <label className="text-[10px] font-semibold text-zinc-500 uppercase">Block Title</label>
            <input
              type="text"
              value={blockTitle}
              onChange={(e) => handleTitleChange(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-700/60 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="text-[10px] font-semibold text-zinc-500 uppercase">Accent Color</label>
            <div className="flex items-center gap-1.5 mt-1">
              {ACCENT_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleColorChange(c)}
                  style={{ backgroundColor: c }}
                  className={`w-5 h-5 rounded-full transition-transform ${
                    blockColor === c ? 'scale-110 ring-2 ring-white' : 'opacity-80 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Editor / Preview Body */}
      <div className="flex-1 p-3.5 overflow-y-auto">
        {isEditing ? (
          <textarea
            value={content}
            onChange={(e) => handleContentChange(e.target.value)}
            placeholder={
              selectedBlock
                ? "Write notes, links, or task lists for this block...\n- [ ] Example todo\n- Item 2"
                : "Daily journal, reflections, scratchpad...\n# Goals for today\n- [ ] Main highlight"
            }
            className="w-full h-full min-h-[300px] bg-transparent resize-none font-mono text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none leading-relaxed"
          />
        ) : (
          <div
            onClick={handlePreviewClick}
            dangerouslySetInnerHTML={{ __html: formattedHtml }}
            className="prose prose-invert max-w-none text-zinc-300 select-text leading-relaxed cursor-default"
          />
        )}
      </div>

      <div className="p-2 border-t border-zinc-800/80 bg-zinc-950 text-[10px] text-zinc-500 flex items-center justify-between">
        <span>Markdown: `#`, `**bold**`, `- [ ] todo`</span>
        <span>{isEditing ? 'Live editing' : 'Interactive preview'}</span>
      </div>
    </div>
  );
};

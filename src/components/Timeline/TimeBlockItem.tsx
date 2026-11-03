import React, { useRef, useState } from 'react';
import { VisualBlock, UserSettings } from '../../types';
import { minutesToTimeString, snapToInterval } from '../../utils/time';
import { CheckIcon, TrashIcon } from '../Icons';

interface TimeBlockItemProps {
  block: VisualBlock;
  settings: UserSettings;
  isSelected: boolean;
  getGridRect: () => DOMRect | null;
  onSelect: (block: VisualBlock) => void;
  onUpdate: (block: VisualBlock) => void;
  onDelete: (blockId: string) => void;
  onToggleComplete: (blockId: string) => void;
}

export const TimeBlockItem: React.FC<TimeBlockItemProps> = ({
  block,
  settings,
  isSelected,
  getGridRect,
  onSelect,
  onUpdate,
  onDelete,
  onToggleComplete,
}) => {
  const [isInteracting, setIsInteracting] = useState(false);
  const [dragPreview, setDragPreview] = useState<{ start: number; duration: number } | null>(null);

  const blockRef = useRef<HTMLDivElement>(null);

  const startMinutes = dragPreview ? dragPreview.start : block.startMinutes;
  const durationMinutes = dragPreview ? dragPreview.duration : block.durationMinutes;

  const topPx = ((startMinutes - settings.startHour * 60) / 60) * settings.hourHeightPx;
  const heightPx = Math.max(22, (durationMinutes / 60) * settings.hourHeightPx);

  // Column width calculations
  const widthPercent = 100 / block.colCount;
  const leftPercent = block.colIndex * widthPercent;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Left-click only
    if (e.button !== 0) return;

    e.stopPropagation();
    onSelect(block);

    const handle = (e.target as HTMLElement).getAttribute('data-resize-handle');
    const gridRect = getGridRect();
    if (!gridRect) return;

    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    setIsInteracting(true);

    const initialStart = block.startMinutes;
    const initialDuration = block.durationMinutes;
    const initialPointerY = e.clientY;

    const snap = settings.snapMinutes;
    const minBound = settings.startHour * 60;
    const maxBound = settings.endHour * 60;

    let currentPreview = { start: initialStart, duration: initialDuration };

    const onPointerMove = (moveEvent: PointerEvent) => {
      const deltaY = moveEvent.clientY - initialPointerY;
      const deltaMinutes = (deltaY / settings.hourHeightPx) * 60;

      if (handle === 'top') {
        const rawNewStart = initialStart + deltaMinutes;
        const snappedStart = snapToInterval(rawNewStart, snap);
        const originalEnd = initialStart + initialDuration;
        const boundedStart = Math.max(minBound, Math.min(originalEnd - snap, snappedStart));
        const newDuration = originalEnd - boundedStart;

        currentPreview = { start: boundedStart, duration: newDuration };
        setDragPreview(currentPreview);
      } else if (handle === 'bottom') {
        const rawDuration = initialDuration + deltaMinutes;
        const snappedDuration = Math.max(snap, snapToInterval(rawDuration, snap));
        const boundedDuration = Math.min(maxBound - initialStart, snappedDuration);

        currentPreview = { start: initialStart, duration: boundedDuration };
        setDragPreview(currentPreview);
      } else {
        // Move entire block
        const rawNewStart = initialStart + deltaMinutes;
        const snappedStart = snapToInterval(rawNewStart, snap);
        const boundedStart = Math.max(minBound, Math.min(maxBound - initialDuration, snappedStart));

        currentPreview = { start: boundedStart, duration: initialDuration };
        setDragPreview(currentPreview);
      }
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(upEvent.pointerId);
      } catch {
        // Safe fallback
      }

      setIsInteracting(false);
      setDragPreview(null);

      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);

      if (
        currentPreview.start !== block.startMinutes ||
        currentPreview.duration !== block.durationMinutes
      ) {
        onUpdate({
          ...block,
          startMinutes: currentPreview.start,
          durationMinutes: currentPreview.duration,
        });
      }
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const startTimeStr = minutesToTimeString(startMinutes);
  const endTimeStr = minutesToTimeString(startMinutes + durationMinutes);

  return (
    <div
      ref={blockRef}
      onPointerDown={handlePointerDown}
      className={`absolute select-none cursor-move rounded-md p-1.5 transition-shadow flex flex-col justify-between overflow-hidden border ${
        isSelected
          ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-500/20 z-30'
          : 'z-10 hover:shadow-md'
      } ${
        block.isCompleted
          ? 'bg-zinc-900/80 border-zinc-700/60 opacity-60'
          : 'bg-zinc-900/95 border-zinc-700/80 hover:border-zinc-500'
      } ${isInteracting ? 'opacity-90 ring-1 ring-blue-400' : ''}`}
      style={{
        top: `${topPx}px`,
        height: `${heightPx}px`,
        left: `calc(${leftPercent}% + 2px)`,
        width: `calc(${widthPercent}% - 4px)`,
        borderLeftWidth: '4px',
        borderLeftColor: block.color || '#3b82f6',
      }}
    >
      {/* Top resize handle */}
      <div
        data-resize-handle="top"
        className="absolute top-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-blue-500/30 transition-colors z-20"
      />

      {/* Block Content */}
      <div className="flex items-start justify-between gap-1 min-w-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span
              className={`text-xs font-semibold truncate ${
                block.isCompleted ? 'line-through text-zinc-400' : 'text-zinc-100'
              }`}
            >
              {block.title || 'Untitled Block'}
            </span>
            {block.notes && (
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400 flex-shrink-0" title="Has notes" />
            )}
          </div>
          <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
            {startTimeStr} - {endTimeStr} ({durationMinutes}m)
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-0.5 flex-shrink-0" onPointerDown={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleComplete(block.id);
            }}
            className={`p-1 rounded hover:bg-zinc-800 transition-colors ${
              block.isCompleted ? 'text-emerald-400' : 'text-zinc-500 hover:text-zinc-300'
            }`}
            title={block.isCompleted ? 'Mark incomplete' : 'Mark completed'}
          >
            <CheckIcon size={12} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(block.id);
            }}
            className="p-1 rounded hover:bg-zinc-800 text-zinc-500 hover:text-rose-400 transition-colors"
            title="Delete block"
          >
            <TrashIcon size={12} />
          </button>
        </div>
      </div>

      {/* Bottom resize handle */}
      <div
        data-resize-handle="bottom"
        className="absolute bottom-0 left-0 right-0 h-2 cursor-ns-resize hover:bg-blue-500/30 transition-colors z-20 flex justify-center items-center"
      >
        <div className="w-6 h-0.5 bg-zinc-600/60 rounded-full" />
      </div>
    </div>
  );
};

import React, { useRef, useState, useEffect } from 'react';
import { TimeBlock, UserSettings, Task, VisualBlock } from '../../types';
import { computeVisualColumns } from '../../utils/layout';
import { snapToInterval, minutesToTimeString, getCurrentMinutes, isSameDay } from '../../utils/time';
import { TimeBlockItem } from './TimeBlockItem';
import { CurrentTimeLine } from './CurrentTimeLine';

interface TimelineCanvasProps {
  activeDate: string;
  blocks: TimeBlock[];
  settings: UserSettings;
  selectedBlockId: string | null;
  draggedTask: Task | null;
  onSelectBlock: (block: VisualBlock | null) => void;
  onCreateBlock: (block: Partial<TimeBlock>) => void;
  onUpdateBlock: (block: VisualBlock) => void;
  onDeleteBlock: (blockId: string) => void;
  onToggleCompleteBlock: (blockId: string) => void;
  onDropTaskOnTimeline: (task: Task, startMinutes: number) => void;
}

export const TimelineCanvas: React.FC<TimelineCanvasProps> = ({
  activeDate,
  blocks,
  settings,
  selectedBlockId,
  draggedTask,
  onSelectBlock,
  onCreateBlock,
  onUpdateBlock,
  onDeleteBlock,
  onToggleCompleteBlock,
  onDropTaskOnTimeline,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  const [createPreview, setCreatePreview] = useState<{ start: number; duration: number } | null>(null);
  const [dropHoverMinutes, setDropHoverMinutes] = useState<number | null>(null);

  const hours: number[] = [];
  for (let h = settings.startHour; h <= settings.endHour; h++) {
    hours.push(h);
  }

  const totalHeightPx = (settings.endHour - settings.startHour) * settings.hourHeightPx;
  const visualBlocks = computeVisualColumns(blocks);

  // Auto-scroll to current hour on load if active date is today
  useEffect(() => {
    if (containerRef.current && isSameDay(activeDate)) {
      const currentMin = getCurrentMinutes();
      const startMin = settings.startHour * 60;
      if (currentMin >= startMin && currentMin <= settings.endHour * 60) {
        const targetScroll =
          ((currentMin - startMin) / 60) * settings.hourHeightPx - 150;
        containerRef.current.scrollTop = Math.max(0, targetScroll);
      }
    }
  }, [activeDate, settings.startHour, settings.hourHeightPx, settings.endHour]);

  // Handle pointer down on empty grid to create block
  const handleGridPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || !gridRef.current) return;

    // Deselect active block if clicking canvas
    onSelectBlock(null);

    const rect = gridRef.current.getBoundingClientRect();
    const offsetY = e.clientY - rect.top;
    const rawMinutes = (offsetY / settings.hourHeightPx) * 60 + settings.startHour * 60;
    const startSnapped = snapToInterval(rawMinutes, settings.snapMinutes);

    const minBound = settings.startHour * 60;
    const maxBound = settings.endHour * 60;
    const boundedStart = Math.max(minBound, Math.min(maxBound - settings.snapMinutes, startSnapped));

    gridRef.current.setPointerCapture(e.pointerId);

    let preview: { start: number; duration: number } = {
      start: boundedStart,
      duration: settings.snapMinutes,
    };
    setCreatePreview(preview);

    const onPointerMove = (moveEvent: PointerEvent) => {
      const currentY = moveEvent.clientY - rect.top;
      const currentMinutes = (currentY / settings.hourHeightPx) * 60 + settings.startHour * 60;
      const diff = currentMinutes - boundedStart;

      const duration = Math.max(
        settings.snapMinutes,
        snapToInterval(diff, settings.snapMinutes)
      );
      const boundedDuration = Math.min(maxBound - boundedStart, duration);

      preview = { start: boundedStart, duration: boundedDuration };
      setCreatePreview(preview);
    };

    const onPointerUp = (upEvent: PointerEvent) => {
      try {
        gridRef.current?.releasePointerCapture(upEvent.pointerId);
      } catch {
        // Safe fallback
      }

      setCreatePreview(null);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);

      onCreateBlock({
        date: activeDate,
        title: 'New Time Block',
        startMinutes: preview.start,
        durationMinutes: preview.duration,
        color: '#3b82f6',
        notes: '',
        isCompleted: false,
      });
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  // Monitor dragged task from inbox hovering over the timeline grid
  useEffect(() => {
    if (!draggedTask) {
      setDropHoverMinutes(null);
      return;
    }

    const handlePointerMove = (e: PointerEvent) => {
      if (!gridRef.current) return;
      const rect = gridRef.current.getBoundingClientRect();

      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        const offsetY = e.clientY - rect.top;
        const rawMinutes = (offsetY / settings.hourHeightPx) * 60 + settings.startHour * 60;
        const snapped = snapToInterval(rawMinutes, settings.snapMinutes);
        const bounded = Math.max(
          settings.startHour * 60,
          Math.min(settings.endHour * 60 - (draggedTask.estimatedMinutes || 30), snapped)
        );
        setDropHoverMinutes(bounded);
      } else {
        setDropHoverMinutes(null);
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      if (!gridRef.current) return;
      const rect = gridRef.current.getBoundingClientRect();

      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        const offsetY = e.clientY - rect.top;
        const rawMinutes = (offsetY / settings.hourHeightPx) * 60 + settings.startHour * 60;
        const snapped = snapToInterval(rawMinutes, settings.snapMinutes);
        const bounded = Math.max(
          settings.startHour * 60,
          Math.min(settings.endHour * 60 - (draggedTask.estimatedMinutes || 30), snapped)
        );
        onDropTaskOnTimeline(draggedTask, bounded);
      }
      setDropHoverMinutes(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [draggedTask, settings, onDropTaskOnTimeline]);

  return (
    <div
      ref={containerRef}
      className="flex-1 overflow-y-auto overflow-x-hidden relative bg-zinc-950 flex flex-col select-none"
    >
      <div className="flex relative" style={{ minHeight: `${totalHeightPx + 40}px` }}>
        {/* Time labels column */}
        <div className="w-16 flex-shrink-0 border-r border-zinc-800/80 bg-zinc-950/60 sticky left-0 z-20">
          {hours.map((hour) => {
            const topPx = (hour - settings.startHour) * settings.hourHeightPx;
            const timeStr = `${String(hour).padStart(2, '0')}:00`;
            return (
              <div
                key={hour}
                className="absolute right-2 -translate-y-2 text-[11px] font-mono font-medium text-zinc-500 select-none"
                style={{ top: `${topPx}px` }}
              >
                {timeStr}
              </div>
            );
          })}
        </div>

        {/* The main schedule grid */}
        <div
          ref={gridRef}
          onPointerDown={handleGridPointerDown}
          className="flex-1 relative cursor-crosshair"
          style={{ height: `${totalHeightPx}px` }}
        >
          {/* Horizontal hour lines and half-hour dashed lines */}
          {hours.map((hour) => {
            const topPx = (hour - settings.startHour) * settings.hourHeightPx;
            const halfTopPx = topPx + settings.hourHeightPx / 2;
            return (
              <React.Fragment key={hour}>
                <div
                  className="absolute left-0 right-0 border-b border-zinc-800/70 pointer-events-none"
                  style={{ top: `${topPx}px` }}
                />
                {hour < settings.endHour && (
                  <div
                    className="absolute left-0 right-0 border-b border-zinc-800/25 border-dashed pointer-events-none"
                    style={{ top: `${halfTopPx}px` }}
                  />
                )}
              </React.Fragment>
            );
          })}

          {/* Current time indicator */}
          <CurrentTimeLine activeDate={activeDate} settings={settings} />

          {/* Time blocks */}
          {visualBlocks.map((block) => (
            <TimeBlockItem
              key={block.id}
              block={block}
              settings={settings}
              isSelected={block.id === selectedBlockId}
              getGridRect={() => gridRef.current?.getBoundingClientRect() ?? null}
              onSelect={onSelectBlock}
              onUpdate={onUpdateBlock}
              onDelete={onDeleteBlock}
              onToggleComplete={onToggleCompleteBlock}
            />
          ))}

          {/* Live Drag-to-Create Preview */}
          {createPreview && (
            <div
              className="absolute left-2 right-2 rounded-md border-2 border-blue-400 border-dashed bg-blue-500/15 pointer-events-none z-30 flex items-center px-3 text-xs text-blue-300 font-mono"
              style={{
                top: `${((createPreview.start - settings.startHour * 60) / 60) * settings.hourHeightPx}px`,
                height: `${(createPreview.duration / 60) * settings.hourHeightPx}px`,
              }}
            >
              New Block: {minutesToTimeString(createPreview.start)} -{' '}
              {minutesToTimeString(createPreview.start + createPreview.duration)} ({createPreview.duration}m)
            </div>
          )}

          {/* Task Drop Target Slot Preview */}
          {dropHoverMinutes !== null && draggedTask && (
            <div
              className="absolute left-2 right-2 rounded-md border-2 border-emerald-400 border-dashed bg-emerald-500/15 pointer-events-none z-30 flex items-center px-3 text-xs text-emerald-300 font-medium"
              style={{
                top: `${((dropHoverMinutes - settings.startHour * 60) / 60) * settings.hourHeightPx}px`,
                height: `${((draggedTask.estimatedMinutes || 30) / 60) * settings.hourHeightPx}px`,
              }}
            >
              Schedule "{draggedTask.title}" at {minutesToTimeString(dropHoverMinutes)} (
              {draggedTask.estimatedMinutes || 30}m)
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

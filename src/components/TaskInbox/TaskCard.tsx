import React from 'react';
import { Task, Priority } from '../../types';
import { CheckIcon, TrashIcon } from '../Icons';

interface TaskCardProps {
  task: Task;
  onPointerDownDrag: (task: Task, e: React.PointerEvent<HTMLDivElement>) => void;
  onToggleComplete: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onQuickSchedule: (task: Task) => void;
}

const PRIORITY_BADGES: Record<Priority, { label: string; bg: string; text: string }> = {
  urgent: { label: 'Urgent', bg: 'bg-rose-500/20 border-rose-500/40', text: 'text-rose-300' },
  high: { label: 'High', bg: 'bg-amber-500/20 border-amber-500/40', text: 'text-amber-300' },
  medium: { label: 'Med', bg: 'bg-blue-500/20 border-blue-500/40', text: 'text-blue-300' },
  low: { label: 'Low', bg: 'bg-zinc-700/30 border-zinc-700/50', text: 'text-zinc-400' },
};

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onPointerDownDrag,
  onToggleComplete,
  onDelete,
  onQuickSchedule,
}) => {
  const priorityInfo = PRIORITY_BADGES[task.priority] || PRIORITY_BADGES.medium;
  const isDone = task.status === 'completed';

  return (
    <div
      onPointerDown={(e) => onPointerDownDrag(task, e)}
      className={`group relative p-2.5 rounded-lg border transition-all select-none cursor-grab active:cursor-grabbing ${
        isDone
          ? 'bg-zinc-900/40 border-zinc-800/60 opacity-60'
          : 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700 hover:shadow-sm'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0 flex-1">
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => onToggleComplete(task)}
            className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors flex-shrink-0 ${
              isDone
                ? 'bg-emerald-600 border-emerald-500 text-white'
                : 'border-zinc-700 hover:border-emerald-500 text-transparent'
            }`}
          >
            <CheckIcon size={11} className={isDone ? 'stroke-white' : 'opacity-0'} />
          </button>
          <div className="min-w-0 flex-1">
            <h4
              className={`text-xs font-medium leading-snug break-words ${
                isDone ? 'line-through text-zinc-500' : 'text-zinc-200'
              }`}
            >
              {task.title}
            </h4>
            <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
              <span
                className={`text-[9px] px-1.5 py-0.2 rounded border font-medium ${priorityInfo.bg} ${priorityInfo.text}`}
              >
                {priorityInfo.label}
              </span>
              <span className="text-[10px] font-mono text-zinc-500">
                {task.estimatedMinutes}m
              </span>
              {task.category && (
                <span className="text-[9px] text-zinc-400 bg-zinc-800/80 px-1 rounded">
                  {task.category}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Actions on hover */}
        <div
          className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button
            type="button"
            onClick={() => onQuickSchedule(task)}
            title="Auto-place on next open slot"
            className="text-[10px] text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 px-1.5 py-0.5 rounded transition-colors"
          >
            + Slot
          </button>
          <button
            type="button"
            onClick={() => onDelete(task.id)}
            title="Delete task"
            className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
          >
            <TrashIcon size={12} />
          </button>
        </div>
      </div>
    </div>
  );
};

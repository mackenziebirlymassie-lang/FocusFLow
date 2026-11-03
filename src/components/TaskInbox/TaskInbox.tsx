import React, { useState } from 'react';
import { Task, Priority } from '../../types';
import { TaskCard } from './TaskCard';
import { PlusIcon, SearchIcon } from '../Icons';

interface TaskInboxProps {
  tasks: Task[];
  onAddTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onPointerDownDrag: (task: Task, e: React.PointerEvent<HTMLDivElement>) => void;
  onQuickSchedule: (task: Task) => void;
}

export const TaskInbox: React.FC<TaskInboxProps> = ({
  tasks,
  onAddTask,
  onUpdateTask,
  onDeleteTask,
  onPointerDownDrag,
  onQuickSchedule,
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [showCompleted, setShowCompleted] = useState(false);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    onAddTask({
      title: newTitle.trim(),
      priority,
      estimatedMinutes,
      category: 'General',
      status: 'inbox',
    });

    setNewTitle('');
  };

  const filteredTasks = tasks.filter((t) => {
    if (!showCompleted && t.status === 'completed') return false;
    if (showCompleted && t.status !== 'completed') return false;
    if (filterPriority !== 'all' && t.priority !== filterPriority) return false;
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const pendingCount = tasks.filter((t) => t.status !== 'completed').length;
  const completedCount = tasks.filter((t) => t.status === 'completed').length;

  return (
    <div className="w-80 border-r border-zinc-800 bg-zinc-950 flex flex-col h-full overflow-hidden select-none">
      {/* Header & Quick Add */}
      <div className="p-3.5 border-b border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Task Backlog</h2>
            <span className="text-[11px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-full font-mono">
              {pendingCount}
            </span>
          </div>
          <button
            type="button"
            onClick={() => setShowCompleted(!showCompleted)}
            className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors"
          >
            {showCompleted ? 'Show Active' : `Done (${completedCount})`}
          </button>
        </div>

        {/* Task Input */}
        <form onSubmit={handleCreate} className="space-y-2">
          <div className="relative">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Add a new task... (Enter to add)"
              className="w-full bg-zinc-900 border border-zinc-700/80 rounded-md px-3 py-1.5 text-xs text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 transition-colors"
            />
            <button
              type="submit"
              className="absolute right-1.5 top-1.5 p-1 rounded bg-blue-600 hover:bg-blue-500 text-white transition-colors"
              title="Add task"
            >
              <PlusIcon size={12} />
            </button>
          </div>

          <div className="flex items-center justify-between gap-1 text-[11px]">
            {/* Priority Selector */}
            <div className="flex items-center gap-1">
              {(['low', 'medium', 'high', 'urgent'] as Priority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-medium uppercase transition-colors ${
                    priority === p
                      ? 'bg-zinc-700 text-zinc-100 border border-zinc-500'
                      : 'text-zinc-500 hover:text-zinc-400'
                  }`}
                >
                  {p[0]}
                </button>
              ))}
            </div>

            {/* Estimated Duration Selector */}
            <div className="flex items-center gap-1">
              {[15, 30, 45, 60].map((mins) => (
                <button
                  key={mins}
                  type="button"
                  onClick={() => setEstimatedMinutes(mins)}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                    estimatedMinutes === mins
                      ? 'bg-blue-600/30 text-blue-300 border border-blue-500/50'
                      : 'text-zinc-500 hover:text-zinc-400'
                  }`}
                >
                  {mins}m
                </button>
              ))}
            </div>
          </div>
        </form>
      </div>

      {/* Search & Filter Bar */}
      <div className="p-2 border-b border-zinc-800/80 flex items-center gap-2">
        <div className="relative flex-1">
          <SearchIcon size={12} className="absolute left-2.5 top-2 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search backlog..."
            className="w-full bg-zinc-900/60 border border-zinc-800/80 rounded pl-7 pr-2 py-1 text-[11px] text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-zinc-600"
          />
        </div>
        <select
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
          aria-label="Filter tasks by priority"
          className="bg-zinc-900 border border-zinc-800 rounded px-1.5 py-1 text-[11px] text-zinc-400 focus:outline-none cursor-pointer"
        >
          <option value="all">All</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-8 px-4 text-zinc-500 text-xs">
            {showCompleted
              ? 'No completed tasks yet.'
              : 'Inbox is clean. Drag tasks to the timeline or add one above.'}
          </div>
        ) : (
          filteredTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onPointerDownDrag={onPointerDownDrag}
              onToggleComplete={(t) =>
                onUpdateTask({
                  ...t,
                  status: t.status === 'completed' ? 'inbox' : 'completed',
                })
              }
              onDelete={onDeleteTask}
              onQuickSchedule={onQuickSchedule}
            />
          ))
        )}
      </div>

      <div className="p-2.5 border-t border-zinc-800/80 text-[10px] text-zinc-500 text-center">
        Tip: Drag tasks straight into the timeline grid
      </div>
    </div>
  );
};

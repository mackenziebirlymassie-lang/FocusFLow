import { useState, useEffect, useRef } from 'react';
import { Task, TimeBlock, DailyNote, UserSettings, VisualBlock } from './types';
import { idb } from './storage/idb';
import {
  loadSettings,
  saveSettings,
  loadActiveDate,
  saveActiveDate,
  loadUIState,
  saveUIState,
  getTodayDateString,
} from './storage/localSettings';
import { getInitialSampleData } from './storage/defaultData';
import { Header } from './components/Header';
import { TimelineCanvas } from './components/Timeline/TimelineCanvas';
import { TaskInbox } from './components/TaskInbox/TaskInbox';
import { ContextNotes } from './components/Scratchpad/ContextNotes';
import { SettingsModal } from './components/Modals/SettingsModal';
import { CommandPalette } from './components/Modals/CommandPalette';

export function App() {
  const [activeDate, setActiveDate] = useState<string>(loadActiveDate);
  const [settings, setSettings] = useState<UserSettings>(loadSettings);
  const [uiState, setUiState] = useState(loadUIState);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>([]);
  const [dailyNote, setDailyNote] = useState<DailyNote | null>(null);

  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Custom pointer drag state for inbox-to-timeline projection
  const [draggedTask, setDraggedTask] = useState<Task | null>(null);
  const [floatingPointer, setFloatingPointer] = useState<{ x: number; y: number } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Initial hydration from IndexedDB
  useEffect(() => {
    async function hydrate() {
      try {
        let loadedTasks = await idb.getAll<Task>('tasks');
        let loadedBlocks = await idb.getAll<TimeBlock>('timeBlocks');
        let loadedNotes = await idb.getAll<DailyNote>('dailyNotes');

        // First run initialization with sample data if empty
        if (loadedTasks.length === 0 && loadedBlocks.length === 0) {
          const sample = getInitialSampleData();
          await idb.importAll(sample);
          loadedTasks = sample.tasks;
          loadedBlocks = sample.timeBlocks;
          loadedNotes = sample.dailyNotes;
        }

        setTasks(loadedTasks);
        setTimeBlocks(loadedBlocks);

        const currentNote = loadedNotes.find((n) => n.date === activeDate) || null;
        setDailyNote(currentNote);
      } catch (err) {
        console.error('Failed to hydrate IndexedDB data', err);
      }
    }
    hydrate();
  }, [activeDate]);

  // Save settings when changed
  const handleSaveSettings = (newSettings: UserSettings) => {
    setSettings(newSettings);
    saveSettings(newSettings);
  };

  // Change active date
  const handleChangeDate = (newDate: string) => {
    setActiveDate(newDate);
    saveActiveDate(newDate);
    setSelectedBlockId(null);
  };

  const handleGoToday = () => {
    const today = getTodayDateString();
    handleChangeDate(today);
  };

  // Toggle UI drawers
  const handleToggleSidebar = () => {
    const next = { ...uiState, sidebarOpen: !uiState.sidebarOpen };
    setUiState(next);
    saveUIState(next);
  };

  const handleToggleScratchpad = () => {
    const next = { ...uiState, scratchpadOpen: !uiState.scratchpadOpen };
    setUiState(next);
    saveUIState(next);
  };

  // Global Keyboard shortcuts (Ctrl+K, Esc, Delete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        if (isSettingsOpen) setIsSettingsOpen(false);
        if (isCommandPaletteOpen) setIsCommandPaletteOpen(false);
        setSelectedBlockId(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isSettingsOpen, isCommandPaletteOpen]);

  // --- Task Operations ---
  const handleAddTask = async (taskData: Omit<Task, 'id' | 'createdAt'>) => {
    const newTask: Task = {
      ...taskData,
      id: `task-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: Date.now(),
    };
    await idb.put('tasks', newTask);
    setTasks((prev) => [newTask, ...prev]);
  };

  const handleUpdateTask = async (updated: Task) => {
    await idb.put('tasks', updated);
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  };

  const handleDeleteTask = async (taskId: string) => {
    await idb.delete('tasks', taskId);
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  // --- TimeBlock Operations ---
  const handleCreateBlock = async (blockData: Partial<TimeBlock>) => {
    const newBlock: TimeBlock = {
      id: `block-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      date: activeDate,
      title: blockData.title || 'New Block',
      startMinutes: blockData.startMinutes ?? 540,
      durationMinutes: blockData.durationMinutes ?? 30,
      color: blockData.color || '#3b82f6',
      notes: blockData.notes || '',
      isCompleted: false,
      taskId: blockData.taskId,
    };
    await idb.put('timeBlocks', newBlock);
    setTimeBlocks((prev) => [...prev, newBlock]);
    setSelectedBlockId(newBlock.id);
  };

  const handleUpdateBlock = async (updated: VisualBlock | TimeBlock) => {
    const cleanBlock: TimeBlock = {
      id: updated.id,
      taskId: updated.taskId,
      title: updated.title,
      date: updated.date,
      startMinutes: updated.startMinutes,
      durationMinutes: updated.durationMinutes,
      color: updated.color,
      notes: updated.notes,
      isCompleted: updated.isCompleted,
    };
    await idb.put('timeBlocks', cleanBlock);
    setTimeBlocks((prev) => prev.map((b) => (b.id === cleanBlock.id ? cleanBlock : b)));
  };

  const handleDeleteBlock = async (blockId: string) => {
    await idb.delete('timeBlocks', blockId);
    setTimeBlocks((prev) => prev.filter((b) => b.id !== blockId));
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
  };

  const handleToggleCompleteBlock = async (blockId: string) => {
    const target = timeBlocks.find((b) => b.id === blockId);
    if (!target) return;
    const updated = { ...target, isCompleted: !target.isCompleted };
    await handleUpdateBlock(updated);

    // If linked to a task, update the task status as well
    if (updated.taskId) {
      const linked = tasks.find((t) => t.id === updated.taskId);
      if (linked) {
        handleUpdateTask({
          ...linked,
          status: updated.isCompleted ? 'completed' : 'scheduled',
        });
      }
    }
  };

  const handleUpdateBlockNotes = async (
    blockId: string,
    notes: string,
    title?: string,
    color?: string
  ) => {
    const target = timeBlocks.find((b) => b.id === blockId);
    if (!target) return;
    const updated: TimeBlock = {
      ...target,
      notes,
      title: title !== undefined ? title : target.title,
      color: color !== undefined ? color : target.color,
    };
    await handleUpdateBlock(updated);
  };

  // --- Daily Note Operations ---
  const handleUpdateDailyNote = async (date: string, content: string) => {
    const note: DailyNote = {
      date,
      content,
      updatedAt: Date.now(),
    };
    await idb.put('dailyNotes', note);
    setDailyNote(note);
  };

  // --- Inbox Task Quick Schedule onto Timeline ---
  const handleQuickScheduleTask = (task: Task) => {
    const existingDayBlocks = timeBlocks
      .filter((b) => b.date === activeDate)
      .sort((a, b) => a.startMinutes - b.startMinutes);

    let candidateStart = settings.startHour * 60;
    const duration = task.estimatedMinutes || 30;

    for (const b of existingDayBlocks) {
      if (candidateStart + duration <= b.startMinutes) {
        break;
      }
      candidateStart = Math.max(candidateStart, b.startMinutes + b.durationMinutes);
    }

    if (candidateStart + duration <= settings.endHour * 60) {
      handleCreateBlock({
        date: activeDate,
        title: task.title,
        taskId: task.id,
        startMinutes: candidateStart,
        durationMinutes: duration,
        color: '#10b981',
      });
      handleUpdateTask({ ...task, status: 'scheduled' });
    } else {
      alert('No free slot found within work hours today.');
    }
  };

  // --- Deterministic Pointer Drag for Task Card ---
  const handleStartTaskDrag = (task: Task, e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    setDraggedTask(task);
    setFloatingPointer({ x: e.clientX, y: e.clientY });

    const onPointerMove = (moveEvent: PointerEvent) => {
      setFloatingPointer({ x: moveEvent.clientX, y: moveEvent.clientY });
    };

    const onPointerUp = () => {
      setDraggedTask(null);
      setFloatingPointer(null);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
  };

  const handleDropTaskOnTimeline = (task: Task, startMinutes: number) => {
    handleCreateBlock({
      date: activeDate,
      title: task.title,
      taskId: task.id,
      startMinutes,
      durationMinutes: task.estimatedMinutes || 30,
      color: '#3b82f6',
    });
    handleUpdateTask({ ...task, status: 'scheduled' });
  };

  // --- Backup & Restore ---
  const handleExportData = async () => {
    const backup = await idb.exportAll();
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `focusflow-backup-${getTodayDateString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileImported = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed.tasks) || Array.isArray(parsed.timeBlocks)) {
        await idb.importAll(parsed);
        const newTasks = await idb.getAll<Task>('tasks');
        const newBlocks = await idb.getAll<TimeBlock>('timeBlocks');
        const newNotes = await idb.getAll<DailyNote>('dailyNotes');
        setTasks(newTasks);
        setTimeBlocks(newBlocks);
        setDailyNote(newNotes.find((n) => n.date === activeDate) || null);
        alert('Data imported successfully!');
      } else {
        alert('Invalid FocusFlow backup file.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to parse JSON file.');
    } finally {
      if (e.target) e.target.value = '';
    }
  };

  // Blocks for current active date
  const dayBlocks = timeBlocks.filter((b) => b.date === activeDate);
  const selectedBlock = (dayBlocks.find((b) => b.id === selectedBlockId) as VisualBlock) || null;
  const completedBlocks = dayBlocks.filter((b) => b.isCompleted).length;

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-zinc-950 text-zinc-100 font-sans">
      {/* Hidden file input for backup restore */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileImported}
        className="hidden"
      />

      {/* Main Top Header */}
      <Header
        activeDate={activeDate}
        onChangeDate={handleChangeDate}
        onGoToday={handleGoToday}
        totalBlocks={dayBlocks.length}
        completedBlocks={completedBlocks}
        sidebarOpen={uiState.sidebarOpen}
        onToggleSidebar={handleToggleSidebar}
        scratchpadOpen={uiState.scratchpadOpen}
        onToggleScratchpad={handleToggleScratchpad}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onExportData={handleExportData}
        onImportData={handleImportClick}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* Workspace Tri-Pane Layout */}
      <div className="flex flex-1 min-h-0 overflow-hidden relative">
        {/* Left: Task Inbox & Backlog */}
        {uiState.sidebarOpen && (
          <TaskInbox
            tasks={tasks}
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
            onDeleteTask={handleDeleteTask}
            onPointerDownDrag={handleStartTaskDrag}
            onQuickSchedule={handleQuickScheduleTask}
          />
        )}

        {/* Center: Structured Visual Timeline Canvas */}
        <TimelineCanvas
          activeDate={activeDate}
          blocks={dayBlocks}
          settings={settings}
          selectedBlockId={selectedBlockId}
          draggedTask={draggedTask}
          onSelectBlock={(b) => setSelectedBlockId(b ? b.id : null)}
          onCreateBlock={handleCreateBlock}
          onUpdateBlock={handleUpdateBlock}
          onDeleteBlock={handleDeleteBlock}
          onToggleCompleteBlock={handleToggleCompleteBlock}
          onDropTaskOnTimeline={handleDropTaskOnTimeline}
        />

        {/* Right: Task-Linked Markdown Scratchpad */}
        {uiState.scratchpadOpen && (
          <ContextNotes
            activeDate={activeDate}
            selectedBlock={selectedBlock}
            dailyNote={dailyNote}
            onUpdateBlockNotes={handleUpdateBlockNotes}
            onUpdateDailyNote={handleUpdateDailyNote}
            onClose={() => handleToggleScratchpad()}
          />
        )}
      </div>

      {/* Floating Ghost Card during Pointer Drag */}
      {draggedTask && floatingPointer && (
        <div
          className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-1/2 bg-blue-950/90 border border-blue-400 text-blue-100 rounded-lg p-2.5 shadow-2xl backdrop-blur-sm opacity-90 max-w-xs flex items-center gap-2"
          style={{ left: `${floatingPointer.x}px`, top: `${floatingPointer.y}px` }}
        >
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
          <div>
            <div className="text-xs font-semibold truncate">{draggedTask.title}</div>
            <div className="text-[10px] text-blue-300 font-mono">
              {draggedTask.estimatedMinutes}m • Drop on timeline
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        settings={settings}
        onSave={handleSaveSettings}
        onClose={() => setIsSettingsOpen(false)}
      />

      {/* Quick Command Palette (Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        tasks={tasks}
        blocks={dayBlocks}
        onGoToday={handleGoToday}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onExportData={handleExportData}
        onFocusTask={() => {}}
        onSelectBlock={(bId) => setSelectedBlockId(bId)}
      />
    </div>
  );
}

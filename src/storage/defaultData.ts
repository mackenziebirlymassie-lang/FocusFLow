import { Task, TimeBlock, DailyNote } from '../types';
import { getTodayDateString } from './localSettings';

export function getInitialSampleData(): {
  tasks: Task[];
  timeBlocks: TimeBlock[];
  dailyNotes: DailyNote[];
} {
  const today = getTodayDateString();

  const tasks: Task[] = [
    {
      id: 'task-1',
      title: 'Deep Work: Core Engine & Pointer Interactions',
      priority: 'urgent',
      estimatedMinutes: 60,
      category: 'Engineering',
      status: 'scheduled',
      createdAt: Date.now() - 3600000,
    },
    {
      id: 'task-2',
      title: 'Review Sprint Roadmap & Architecture Specs',
      priority: 'high',
      estimatedMinutes: 30,
      category: 'Planning',
      status: 'inbox',
      createdAt: Date.now() - 7200000,
    },
    {
      id: 'task-3',
      title: 'Inbox Zero & Clean Code Review',
      priority: 'medium',
      estimatedMinutes: 45,
      category: 'Maintenance',
      status: 'inbox',
      createdAt: Date.now() - 10800000,
    },
    {
      id: 'task-4',
      title: 'Hydration & 15m Fresh Air Walk',
      priority: 'low',
      estimatedMinutes: 15,
      category: 'Health',
      status: 'inbox',
      createdAt: Date.now() - 14400000,
    },
  ];

  const timeBlocks: TimeBlock[] = [
    {
      id: 'block-1',
      taskId: 'task-1',
      title: 'Deep Work: Core Engine & Pointer Interactions',
      date: today,
      startMinutes: 540, // 09:00 AM
      durationMinutes: 60,
      color: '#3b82f6',
      notes: `# Morning Focus Session\n- [x] Verified zero background CPU consumption\n- [x] Aligned minute timer teardown on document.hidden\n- [ ] Implement deterministic pointer drag-and-drop`,
      isCompleted: true,
    },
    {
      id: 'block-2',
      title: 'Standup & Priority Sync',
      date: today,
      startMinutes: 630, // 10:30 AM
      durationMinutes: 30,
      color: '#10b981',
      notes: `Review daily schedule and block out uninterrupted time slots for deep work.`,
      isCompleted: false,
    },
    {
      id: 'block-3',
      title: 'Architecture Review & Benchmark Profiling',
      date: today,
      startMinutes: 840, // 14:00 (2:00 PM)
      durationMinutes: 90,
      color: '#8b5cf6',
      notes: `Ensure production bundle is strictly under 120KB gzip.\n- [ ] Run production build\n- [ ] Check Chrome DevTools Performance monitor`,
      isCompleted: false,
    },
  ];

  const dailyNotes: DailyNote[] = [
    {
      date: today,
      content: `# Daily Reflection & Scratchpad\n\n### Core Objective for Today\nMaintain focus on timeline-driven execution without getting overwhelmed.\n\n### Checkpoints\n- [x] Cold start loaded in <100ms\n- [ ] Finish all 3 time blocks\n- [ ] Export full snapshot at end of day`,
      updatedAt: Date.now(),
    },
  ];

  return { tasks, timeBlocks, dailyNotes };
}

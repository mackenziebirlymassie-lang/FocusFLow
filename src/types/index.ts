export type Priority = 'low' | 'medium' | 'high' | 'urgent';
export type TaskStatus = 'inbox' | 'scheduled' | 'in-progress' | 'completed';

export interface Task {
  id: string;
  title: string;
  estimatedMinutes: number; // Defaults to 30, stepped by 15
  priority: Priority;
  category: string;
  status: TaskStatus;
  createdAt: number;
}

export interface TimeBlock {
  id: string;
  taskId?: string; // Optional link to an existing task in backlog
  title: string;
  date: string; // ISO format: YYYY-MM-DD
  startMinutes: number; // Minutes from midnight (e.g., 540 = 09:00 AM)
  durationMinutes: number; // Must be multiples of snapMinutes (min: 15)
  color: string; // Tailwind-compatible or HEX accent
  notes: string; // Markdown content
  isCompleted: boolean;
}

export interface DailyNote {
  date: string; // Primary key: YYYY-MM-DD
  content: string; // Markdown text
  updatedAt: number;
}

export interface UserSettings {
  startHour: number; // Default 07 (07:00)
  endHour: number; // Default 22 (22:00)
  snapMinutes: 15 | 30; // Snapping interval
  hourHeightPx: number; // Height of 1 hour in pixels (default: 64)
  theme: 'dark' | 'light';
}

export interface TimelinePosition {
  startMinutes: number;
  durationMinutes: number;
}

export interface VisualBlock extends TimeBlock {
  colIndex: number;
  colCount: number;
}

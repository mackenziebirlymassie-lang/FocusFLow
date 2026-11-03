import { UserSettings } from '../types';

const SETTINGS_KEY = 'focusflow_settings';
const ACTIVE_DATE_KEY = 'focusflow_active_date';
const UI_STATE_KEY = 'focusflow_ui_state';

export const DEFAULT_SETTINGS: UserSettings = {
  startHour: 7,
  endHour: 22,
  snapMinutes: 15,
  hourHeightPx: 64,
  theme: 'dark',
};

export interface UIState {
  sidebarOpen: boolean;
  scratchpadOpen: boolean;
}

export const DEFAULT_UI_STATE: UIState = {
  sidebarOpen: true,
  scratchpadOpen: true,
};

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function loadSettings(): UserSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: UserSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn('Failed to save settings to localStorage', err);
  }
}

export function loadActiveDate(): string {
  try {
    return localStorage.getItem(ACTIVE_DATE_KEY) || getTodayDateString();
  } catch {
    return getTodayDateString();
  }
}

export function saveActiveDate(date: string): void {
  try {
    localStorage.setItem(ACTIVE_DATE_KEY, date);
  } catch (err) {
    console.warn('Failed to save active date', err);
  }
}

export function loadUIState(): UIState {
  try {
    const raw = localStorage.getItem(UI_STATE_KEY);
    if (!raw) return DEFAULT_UI_STATE;
    return { ...DEFAULT_UI_STATE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_UI_STATE;
  }
}

export function saveUIState(uiState: UIState): void {
  try {
    localStorage.setItem(UI_STATE_KEY, JSON.stringify(uiState));
  } catch (err) {
    console.warn('Failed to save UI state', err);
  }
}

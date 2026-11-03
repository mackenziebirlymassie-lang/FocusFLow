import React, { useState } from 'react';
import { UserSettings } from '../../types';
import { XIcon } from '../Icons';

interface SettingsModalProps {
  isOpen: boolean;
  settings: UserSettings;
  onSave: (settings: UserSettings) => void;
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  settings,
  onSave,
  onClose,
}) => {
  const [localSettings, setLocalSettings] = useState<UserSettings>(settings);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs select-none">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-md p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
          <h2 className="text-sm font-bold text-zinc-100">Timeline & Workspace Settings</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
          >
            <XIcon size={14} />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* Work Hours Range */}
          <div>
            <label className="font-semibold text-zinc-300 block mb-1">
              Active Timeline Hours
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-zinc-500 block mb-1">Start Hour</span>
                <select
                  value={localSettings.startHour}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, startHour: parseInt(e.target.value, 10) })
                  }
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-200"
                >
                  {[4, 5, 6, 7, 8, 9, 10].map((h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="text-[11px] text-zinc-500 block mb-1">End Hour</span>
                <select
                  value={localSettings.endHour}
                  onChange={(e) =>
                    setLocalSettings({ ...localSettings, endHour: parseInt(e.target.value, 10) })
                  }
                  className="w-full bg-zinc-950 border border-zinc-700 rounded px-2.5 py-1.5 text-zinc-200"
                >
                  {[18, 19, 20, 21, 22, 23, 24].map((h) => (
                    <option key={h} value={h}>
                      {String(h).padStart(2, '0')}:00
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Snapping Interval */}
          <div>
            <label className="font-semibold text-zinc-300 block mb-1">
              Grid Snap Interval
            </label>
            <div className="flex gap-3">
              {[15, 30].map((snap) => (
                <label
                  key={snap}
                  className={`flex-1 p-2 rounded-lg border cursor-pointer text-center transition-colors ${
                    localSettings.snapMinutes === snap
                      ? 'border-blue-500 bg-blue-500/10 text-blue-300'
                      : 'border-zinc-800 bg-zinc-950 text-zinc-400'
                  }`}
                >
                  <input
                    type="radio"
                    name="snap"
                    className="sr-only"
                    checked={localSettings.snapMinutes === snap}
                    onChange={() =>
                      setLocalSettings({ ...localSettings, snapMinutes: snap as 15 | 30 })
                    }
                  />
                  <div className="font-bold">{snap} Minutes</div>
                  <div className="text-[10px] text-zinc-500">
                    {snap === 15 ? 'Precise scheduling' : 'Coarser blocks'}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Hour Height / Zoom */}
          <div>
            <label className="font-semibold text-zinc-300 block mb-1">
              Timeline Zoom Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Compact', px: 52 },
                { label: 'Standard', px: 64 },
                { label: 'Spacious', px: 80 },
              ].map((opt) => (
                <button
                  key={opt.px}
                  type="button"
                  onClick={() => setLocalSettings({ ...localSettings, hourHeightPx: opt.px })}
                  className={`py-1.5 rounded border text-center transition-colors ${
                    localSettings.hourHeightPx === opt.px
                      ? 'border-blue-500 bg-blue-500/10 text-blue-300 font-bold'
                      : 'border-zinc-800 bg-zinc-950 text-zinc-400'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 rounded hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 font-semibold text-white transition-colors"
            >
              Save Settings
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React from 'react';
import { useAlignedMinuteTimer } from '../../hooks/useAlignedMinuteTimer';
import { isSameDay, minutesToTimeString } from '../../utils/time';
import { UserSettings } from '../../types';

interface CurrentTimeLineProps {
  activeDate: string;
  settings: UserSettings;
}

export const CurrentTimeLine: React.FC<CurrentTimeLineProps> = ({ activeDate, settings }) => {
  const now = useAlignedMinuteTimer();

  // Only render on the current calendar day
  if (!isSameDay(activeDate, now)) {
    return null;
  }

  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = settings.startHour * 60;
  const endMinutes = settings.endHour * 60;

  if (currentMinutes < startMinutes || currentMinutes > endMinutes) {
    return null;
  }

  const topPx = ((currentMinutes - startMinutes) / 60) * settings.hourHeightPx;
  const timeString = minutesToTimeString(currentMinutes);

  return (
    <div
      className="absolute left-0 right-0 z-20 pointer-events-none flex items-center"
      style={{ top: `${topPx}px` }}
    >
      <div className="flex items-center -ml-2">
        <span className="w-3.5 h-3.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50 flex items-center justify-center">
          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        </span>
        <span className="text-[10px] font-mono font-bold bg-rose-500 text-white px-1.5 py-0.5 rounded shadow ml-1">
          {timeString}
        </span>
      </div>
      <div className="flex-1 h-[2px] bg-rose-500 shadow-sm shadow-rose-500/30 ml-1" />
    </div>
  );
};

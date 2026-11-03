import { useState, useEffect } from 'react';

/**
 * High-precision, zero-CPU minute timer.
 * - Suspends completely when tab is hidden (document.hidden).
 * - Fires once at the next exact whole minute boundary, then repeats every 60,000ms.
 * - Idles at 0.0% CPU between ticks.
 */
export function useAlignedMinuteTimer(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const stopTimer = () => {
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      if (intervalId !== null) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    const scheduleNextMinute = () => {
      stopTimer();
      const current = new Date();
      setNow(current);

      const msToNextMinute =
        (60 - current.getSeconds()) * 1000 - current.getMilliseconds();

      timeoutId = setTimeout(() => {
        setNow(new Date());
        intervalId = setInterval(() => {
          setNow(new Date());
        }, 60000);
      }, Math.max(50, msToNextMinute));
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopTimer();
      } else {
        scheduleNextMinute();
      }
    };

    if (!document.hidden) {
      scheduleNextMinute();
    }

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      stopTimer();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  return now;
}

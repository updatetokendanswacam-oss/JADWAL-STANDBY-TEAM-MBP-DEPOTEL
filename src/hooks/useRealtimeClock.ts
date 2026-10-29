import { useState, useEffect } from 'react';
import { getIndonesianDayName } from '../utils/dateUtils';

export interface RealtimeClockState {
  timeStr: string; // e.g. "14:32:05 WIB"
  dateStrDDMMYYYY: string; // e.g. "29-10-2026"
  dayName: string; // e.g. "Kamis"
  fullDisplay: string; // e.g. "KAMIS, 29-10-2026 14:32:05 WIB"
  now: Date;
}

export function useRealtimeClock(): RealtimeClockState {
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const dayStr = String(now.getDate()).padStart(2, '0');
  const monthStr = String(now.getMonth() + 1).padStart(2, '0');
  const yearStr = now.getFullYear();

  const dateStrDDMMYYYY = `${dayStr}-${monthStr}-${yearStr}`;
  const dayName = getIndonesianDayName(dateStrDDMMYYYY);

  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  const timeStr = `${hours}:${minutes}:${seconds} WIB`;
  const fullDisplay = `${dayName.toUpperCase()}, ${dateStrDDMMYYYY} • ${timeStr}`;

  return {
    timeStr,
    dateStrDDMMYYYY,
    dayName,
    fullDisplay,
    now
  };
}

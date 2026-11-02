import { useState, useEffect } from 'react';

export interface RealtimeClockState {
  timeStr: string; // e.g. "14:32:05 WIB"
  dateStrDDMMYYYY: string; // e.g. "29-10-2026"
  dayName: string; // e.g. "Kamis"
  fullDisplay: string; // e.g. "KAMIS, 29-10-2026 • 14:32:05 WIB"
  now: Date;
}

export function getWIBDateParts(date = new Date()) {
  const formatter = new Intl.DateTimeFormat('id-ID', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    weekday: 'long',
    hour12: false
  });

  const parts = formatter.formatToParts(date);
  const partMap: Record<string, string> = {};
  parts.forEach((p) => {
    partMap[p.type] = p.value;
  });

  const year = parseInt(partMap.year || '2026', 10);
  const month = parseInt(partMap.month || '10', 10);
  const day = parseInt(partMap.day || '29', 10);
  const hoursStr = (partMap.hour || '00').padStart(2, '0');
  const minutesStr = (partMap.minute || '00').padStart(2, '0');
  const secondsStr = (partMap.second || '00').padStart(2, '0');

  const dayStr = String(day).padStart(2, '0');
  const monthStr = String(month).padStart(2, '0');
  const dateStrDDMMYYYY = `${dayStr}-${monthStr}-${year}`;

  const rawDayName = partMap.weekday || 'Senin';
  const dayName = rawDayName.charAt(0).toUpperCase() + rawDayName.slice(1).toLowerCase();

  const timeStr = `${hoursStr}:${minutesStr}:${secondsStr} WIB`;
  const fullDisplay = `${dayName.toUpperCase()}, ${dateStrDDMMYYYY} • ${timeStr}`;

  return {
    year,
    month,
    day,
    hours: parseInt(hoursStr, 10),
    minutes: parseInt(minutesStr, 10),
    seconds: parseInt(secondsStr, 10),
    dayName,
    dateStrDDMMYYYY,
    timeStr,
    fullDisplay
  };
}

export function useRealtimeClock(): RealtimeClockState {
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const wib = getWIBDateParts(now);

  return {
    timeStr: wib.timeStr,
    dateStrDDMMYYYY: wib.dateStrDDMMYYYY,
    dayName: wib.dayName,
    fullDisplay: wib.fullDisplay,
    now
  };
}

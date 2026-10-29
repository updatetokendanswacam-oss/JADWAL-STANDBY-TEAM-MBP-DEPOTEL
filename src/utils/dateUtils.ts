/**
 * Utility functions for date setting, day calculation, and formatting in MBP Standby app.
 */

// Get Indonesian day name from date object or ISO string
export function getIndonesianDayName(dateObjOrIso: Date | string): string {
  let d: Date;
  if (typeof dateObjOrIso === 'string') {
    const iso = formatToYYYYMMDD(dateObjOrIso);
    d = new Date(iso);
  } else {
    d = dateObjOrIso;
  }

  if (isNaN(d.getTime())) return '';

  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return dayNames[d.getDay()];
}

// Convert YYYY-MM-DD to DD-MM-YYYY
export function formatToDDMMYYYY(isoDate: string): string {
  if (!isoDate) return '';
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    if (parts[0].length === 4) {
      return `${parts[2]}-${parts[1]}-${parts[0]}`;
    }
    return isoDate;
  }
  return isoDate;
}

// Convert DD-MM-YYYY to YYYY-MM-DD for <input type="date" /> and Date parsing
export function formatToYYYYMMDD(ddmmyyyy: string): string {
  if (!ddmmyyyy) return new Date().toISOString().split('T')[0];
  const parts = ddmmyyyy.split('-');
  if (parts.length === 3) {
    if (parts[2].length === 4) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    return ddmmyyyy;
  }
  return new Date().toISOString().split('T')[0];
}

// Shift date by offset in days and return DD-MM-YYYY
export function addDaysToDDMMYYYY(ddmmyyyy: string, days: number): string {
  const iso = formatToYYYYMMDD(ddmmyyyy);
  const d = new Date(iso);
  if (isNaN(d.getTime())) return ddmmyyyy;
  d.setDate(d.getDate() + days);

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

// Format date into human Indonesian format (e.g., "Kamis, 29 Oktober 2026")
export function formatIndonesianDateFull(ddmmyyyy: string): string {
  const iso = formatToYYYYMMDD(ddmmyyyy);
  const d = new Date(iso);
  if (isNaN(d.getTime())) return ddmmyyyy;

  return d.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

// Automatically construct schedule title including Indonesian Day Name and Date
export function buildScheduleTitleWithDay(ddmmyyyy: string, baseTitle: string = 'JADWAL STANDBY TEAM MBP DEPOTEL INNER JAKTIM'): string {
  const dayName = getIndonesianDayName(ddmmyyyy).toUpperCase();
  if (dayName) {
    return `${baseTitle} ${dayName}, ${ddmmyyyy}`;
  }
  return `${baseTitle} ${ddmmyyyy}`;
}

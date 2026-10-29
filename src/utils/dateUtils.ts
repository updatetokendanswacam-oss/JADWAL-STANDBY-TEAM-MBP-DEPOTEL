/**
 * Utility functions for date setting, day calculation, and formatting in MBP Standby app.
 */

// Safe robust parser for DD-MM-YYYY, YYYY-MM-DD, DD/MM/YYYY or Date inputs
export function parseDDMMYYYY(input: string | Date | null | undefined): Date {
  if (!input) return new Date();
  if (input instanceof Date) {
    return isNaN(input.getTime()) ? new Date() : input;
  }

  const str = String(input).trim();
  if (!str) return new Date();

  // Extract first date pattern if str contains extra characters like "29-10-2026 (KAMIS)"
  const match = str.match(/\b(\d{1,4})[-/.\s](\d{1,2})[-/.\s](\d{1,4})\b/);
  if (match) {
    const p1 = parseInt(match[1], 10);
    const p2 = parseInt(match[2], 10);
    const p3 = parseInt(match[3], 10);

    let day = 1;
    let month = 1;
    let year = 2026;

    // Check if YYYY-MM-DD
    if (match[1].length === 4) {
      year = p1;
      month = p2;
      day = p3;
    } else {
      // DD-MM-YYYY
      day = p1;
      month = p2;
      year = p3;
    }

    if (
      !isNaN(day) &&
      !isNaN(month) &&
      !isNaN(year) &&
      year > 1900 &&
      year < 2100 &&
      month >= 1 &&
      month <= 12 &&
      day >= 1 &&
      day <= 31
    ) {
      // Set time to 12:00:00 (noon) to avoid timezone shifts!
      return new Date(year, month - 1, day, 12, 0, 0);
    }
  }

  // Fallback try standard Date parsing
  const d = new Date(str);
  if (!isNaN(d.getTime())) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 12, 0, 0);
  }

  return new Date();
}

// Get Indonesian day name from date object or string
export function getIndonesianDayName(dateObjOrIso: Date | string): string {
  const d = parseDDMMYYYY(dateObjOrIso);
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return dayNames[d.getDay()] || 'Senin';
}

// Convert YYYY-MM-DD to DD-MM-YYYY
export function formatToDDMMYYYY(isoOrDdmmyyyy: string): string {
  if (!isoOrDdmmyyyy) return '';
  const d = parseDDMMYYYY(isoOrDdmmyyyy);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

// Convert DD-MM-YYYY to YYYY-MM-DD for <input type="date" /> and Date parsing
export function formatToYYYYMMDD(ddmmyyyy: string): string {
  const d = parseDDMMYYYY(ddmmyyyy);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${year}-${month}-${day}`;
}

// Shift date by offset in days and return DD-MM-YYYY
export function addDaysToDDMMYYYY(ddmmyyyy: string, days: number): string {
  const d = parseDDMMYYYY(ddmmyyyy);
  d.setDate(d.getDate() + days);

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}-${month}-${year}`;
}

// Format date into human Indonesian format (e.g., "Kamis, 29 Oktober 2026")
export function formatIndonesianDateFull(ddmmyyyy: string): string {
  const d = parseDDMMYYYY(ddmmyyyy);
  try {
    return d.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  } catch {
    const dayName = getIndonesianDayName(d);
    return `${dayName}, ${formatToDDMMYYYY(ddmmyyyy)}`;
  }
}

// Automatically construct schedule title including Indonesian Day Name and Date
export function buildScheduleTitleWithDay(
  ddmmyyyy: string,
  baseTitle: string = 'JADWAL STANDBY TEAM MBP DEPOTEL INNER JAKTIM'
): string {
  const cleanDate = formatToDDMMYYYY(ddmmyyyy);
  const dayName = getIndonesianDayName(cleanDate).toUpperCase();
  if (dayName) {
    return `${baseTitle} ${dayName}, ${cleanDate}`;
  }
  return `${baseTitle} ${cleanDate}`;
}

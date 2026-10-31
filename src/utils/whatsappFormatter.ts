import { StandbySchedule, MemberStatus } from '../types';
import { getIndonesianDayName, formatToDDMMYYYY } from './dateUtils';

export function getStatusEmoji(status: MemberStatus): string {
  switch (status) {
    case 'off':
      return '🔴';
    case 'ijin_sakit':
      return '🟡';
    case 'standby':
      return '🟢';
    default:
      return '🟢';
  }
}

export function getStatusLabel(status: MemberStatus): string {
  switch (status) {
    case 'off':
      return 'off';
    case 'ijin_sakit':
      return 'ijin/sakit';
    case 'standby':
      return 'standby';
    default:
      return 'standby';
  }
}

// Extract base title without trailing day and date
export function extractBaseWATitle(title: string | undefined, defaultAreaName: string): string {
  const fallback = `JADWAL STANDBY TEAM MBP *DEPOTEL* ${defaultAreaName}`;
  if (!title) return fallback;

  // Remove trailing day & date patterns, e.g. "KAMIS, 29-10-2026", "JUMAT 30-10-2026", "29-10-2026", "(KAMIS, 29-10-2026)"
  const cleaned = title
    .replace(/\s*\(?\b(SENIN|SELASA|RABU|KAMIS|JUMAT|SABTU|MINGGU)\b[,\s]*\d{1,2}[-/.]\d{1,2}[-/.]\d{4}\)?\s*$/i, '')
    .replace(/\s*\(?\b(SENIN|SELASA|RABU|KAMIS|JUMAT|SABTU|MINGGU)\b\)?\s*$/i, '')
    .replace(/\s*\(?\b\d{1,2}[-/.]\d{1,2}[-/.]\d{4}\)?\s*$/, '')
    .trim();

  return cleaned || fallback;
}

// Automatically construct WhatsApp title following calendar day and date
export function buildAutoWATitle(
  schedule: StandbySchedule,
  style: 'day_comma_date' | 'day_space_date' | 'date_only' = schedule.titleFormatStyle || 'day_comma_date'
): string {
  const defaultArea = schedule.id.includes('inner') ? 'INNER JAKTIM' : 'BEKASI';
  const base = extractBaseWATitle(schedule.title, defaultArea);
  const dateStr = formatToDDMMYYYY(schedule.date || '29-10-2026');
  const dayName = (schedule.dayName || getIndonesianDayName(dateStr)).toUpperCase();

  switch (style) {
    case 'day_space_date':
      return `${base} ${dayName} ${dateStr}`;
    case 'date_only':
      return `${base} ${dateStr}`;
    case 'day_comma_date':
    default:
      return `${base} ${dayName}, ${dateStr}`;
  }
}

// Update the day and date inside an existing title while strictly preserving all custom words and formatting
export function updateTitleDateAndDay(
  currentTitle: string | undefined,
  newDayName: string,
  newDateDDMMYYYY: string,
  defaultAreaName: string
): string {
  const dayUpper = newDayName.toUpperCase();
  if (!currentTitle || !currentTitle.trim()) {
    return `JADWAL STANDBY TEAM MBP *DEPOTEL* ${defaultAreaName} ${dayUpper}, ${newDateDDMMYYYY}`;
  }

  // 1. If title already has "HARI, DD-MM-YYYY" or "HARI DD-MM-YYYY"
  const dayAndDatePattern = /\b(SENIN|SELASA|RABU|KAMIS|JUMAT|SABTU|MINGGU)\b[,\s]*\d{1,2}[-/.]\d{1,2}[-/.]\d{4}/i;
  if (dayAndDatePattern.test(currentTitle)) {
    return currentTitle.replace(dayAndDatePattern, `${dayUpper}, ${newDateDDMMYYYY}`);
  }

  // 2. If title has only "DD-MM-YYYY"
  const dateOnlyPattern = /\b\d{1,2}[-/.]\d{1,2}[-/.]\d{4}\b/;
  if (dateOnlyPattern.test(currentTitle)) {
    return currentTitle.replace(dateOnlyPattern, `${dayUpper}, ${newDateDDMMYYYY}`);
  }

  // 3. If title has day only
  const dayOnlyPattern = /\b(SENIN|SELASA|RABU|KAMIS|JUMAT|SABTU|MINGGU)\b/i;
  if (dayOnlyPattern.test(currentTitle)) {
    return currentTitle.replace(dayOnlyPattern, `${dayUpper}, ${newDateDDMMYYYY}`);
  }

  // 4. Otherwise append to existing title
  return `${currentTitle.trim()} ${dayUpper}, ${newDateDDMMYYYY}`;
}

// Format phone number into international WhatsApp format (e.g. 0812... -> 62812...)
export function formatPhoneToWA(phone: string): string {
  const clean = phone.replace(/[^0-9]/g, '');
  if (clean.startsWith('0')) {
    return `62${clean.slice(1)}`;
  }
  if (clean.startsWith('62')) {
    return clean;
  }
  return clean;
}

// Generate direct WhatsApp chat URL for a specific personnel
export function getPersonelWALink(phone: string, name: string, status: MemberStatus, dateStr: string): string {
  const waPhone = formatPhoneToWA(phone);
  const statusTxt = getStatusLabel(status);
  const emoji = getStatusEmoji(status);
  const msg = `Halo Sdr. ${name},\nKonfirmasi Jadwal Standby MBP Depotel tanggal ${dateStr}.\nStatus Anda saat ini: ${emoji} ${statusTxt.toUpperCase()}.\nTerima kasih.`;
  return `https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`;
}

// Generate full schedule report text for WhatsApp broadcast
export function formatStandbyScheduleToWA(schedule: StandbySchedule): string {
  const lines: string[] = [];

  // Title line
  lines.push(schedule.title);
  lines.push('______________________');
  lines.push('');

  // NOP Name
  lines.push(`*${schedule.nopName}*`);
  lines.push('');

  // Groups & Members
  schedule.groups.forEach((group) => {
    lines.push(`${group.groupName} :`);
    lines.push('');
    group.members.forEach((member, idx) => {
      const emoji = getStatusEmoji(member.status);
      lines.push(`${idx + 1}. ${emoji}${member.name}☆${member.phone}`);
    });
    lines.push(''); // Empty line between groups
  });

  lines.push('_______________________');
  lines.push('');

  // Keterangan / Legend
  lines.push('Keterangan :');
  lines.push('🔴 : off');
  lines.push('🟡 : ijin/sakit');
  lines.push('🟢 : standby');

  return lines.join('\n');
}

// Combined report for both schedules (DEPOTEL INNER JAKTIM & DEPOTEL BEKASI)
export function formatCombinedStandbyScheduleToWA(
  innerSchedule: StandbySchedule,
  outerSchedule: StandbySchedule
): string {
  return `${formatStandbyScheduleToWA(innerSchedule)}\n\n\n${formatStandbyScheduleToWA(outerSchedule)}`;
}

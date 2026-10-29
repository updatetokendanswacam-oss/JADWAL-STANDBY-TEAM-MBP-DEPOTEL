import { StandbySchedule, MemberStatus } from '../types';

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
  const msg = `Halo Sdr. ${name},\nKonfirmasi Jadwal Standby MBP Depotel Inner Jaktim tanggal ${dateStr}.\nStatus Anda saat ini: ${emoji} ${statusTxt.toUpperCase()}.\nTerima kasih.`;
  return `https://wa.me/${waPhone}?text=${encodeURIComponent(msg)}`;
}

// Generate full schedule report text for WhatsApp broadcast
export function formatStandbyScheduleToWA(schedule: StandbySchedule): string {
  let lines: string[] = [];

  // Title line
  lines.push(schedule.title);
  lines.push('');
  lines.push('__________________________________________');
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

  lines.push('______________________________________');
  lines.push('');

  // Keterangan / Legend
  lines.push('Keterangan :');
  lines.push('🔴 : off');
  lines.push('🟡 : ijin/sakit');
  lines.push('🟢 : standby');

  return lines.join('\n');
}


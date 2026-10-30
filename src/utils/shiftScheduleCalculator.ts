import { Personnel, TeamGroup, MemberStatus, ShiftPatternType, StandbySchedule } from '../types';
import { parseDDMMYYYY } from './dateUtils';

// Reference anchor dates from initial specifications:
// Inner Jaktim: 29-10-2026
// Bekasi: 28-10-2026
export const ANCHOR_DATE_INNER = '29-10-2026';
export const ANCHOR_DATE_BEKASI = '28-10-2026';

export interface ShiftInfo {
  pattern: ShiftPatternType;
  patternLabel: string;
  isWorkDay: boolean;
  computedStatus: MemberStatus;
  cycleDayText: string;
  remainingDaysText: string;
}

/**
 * Calculate difference in whole calendar days (targetDate - referenceDate)
 */
export function getDiffInDays(targetDateStr: string, refDateStr: string): number {
  const dTarget = parseDDMMYYYY(targetDateStr);
  const dRef = parseDDMMYYYY(refDateStr);

  const utcTarget = Date.UTC(dTarget.getFullYear(), dTarget.getMonth(), dTarget.getDate());
  const utcRef = Date.UTC(dRef.getFullYear(), dRef.getMonth(), dRef.getDate());

  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((utcTarget - utcRef) / msPerDay);
}

/**
 * Determine default pattern from group name
 */
export function getDefaultPatternForGroup(groupName: string): ShiftPatternType {
  const upper = (groupName || '').toUpperCase();
  if (upper.includes('JAKTIM')) {
    return '4_2'; // 4 Hari Kerja, 2 Hari Libur
  }
  if (upper.includes('DEPOK')) {
    return 'depok_monthly_1week'; // 1 Minggu Libur Bergilir / Bulan
  }
  if (upper.includes('BEKASI TIMUR') || upper.includes('BEKASI BARAT')) {
    return '6_2'; // 6 Hari Kerja, 2 Hari Libur
  }
  return '4_2';
}

/**
 * Initial base offsets on reference dates so that the initial statuses match the user's brief:
 *
 * INNER JAKTIM (Anchor 29-10-2026, 4K-2L, Cycle 6: [0,1,2,3]=Kerja, [4,5]=Libur):
 * TO JAKTIM 1:
 * - DIKI SOLIHIN: 'off' (Libur H-1 -> step 4)
 * - SADDAMHUSEN: 'standby' (Kerja H-2 -> step 1)
 * - KUSNAEDI: 'standby' (Kerja H-4 -> step 3)
 * TO JAKTIM 2:
 * - AGUSTIAN: 'off' (Libur H-1 -> step 4)
 * - BUDIMAN: 'standby' (Kerja H-2 -> step 1)
 * - MUSLIM: 'standby' (Kerja H-4 -> step 3)
 *
 * OUTER BEKASI (Anchor 28-10-2026):
 * TO BEKASI TIMUR (6K-2L, Cycle 8: [0,1,2,3,4,5]=Kerja, [6,7]=Libur):
 * - IWANSUWANDANA: 'ijin_sakit' (Scheduled work H-6 -> step 5 or off step 6)
 * - SIMAN: 'standby' (Kerja H-2 -> step 1)
 * - HERMAN: 'standby' (Kerja H-3 -> step 2)
 * - ASEP AHMAD: 'standby' (Kerja H-4 -> step 3)
 * TO BEKASI BARAT (6K-2L):
 * - PURNOMO: 'standby' (Kerja H-2 -> step 1)
 * - JUNAEDI: 'standby' (Kerja H-4 -> step 3)
 * - A.ROHMAN: 'off' (Libur H-1 -> step 6)
 * - ASEP SUNANDAR: 'standby' (Kerja H-5 -> step 4)
 * TO DEPOK (1 Mgg Libur / Bulan Bergilir, Cycle 28: 4 person x 7 days):
 * - ASEP: Off week 1 (step 0..6) -> base 0
 * - ROHMAT: Off week 2 (step 7..13) -> base 7
 * - UCU SUTISNA: Off week 3 (step 14..20) -> base 14
 * - ABU FIRMAN: Off week 4 (step 21..27) -> base 21
 */
export function getDefaultMemberOffset(
  groupName: string,
  memberName: string,
  memberIndex: number
): number {
  const upperGroup = (groupName || '').toUpperCase();
  const upperName = (memberName || '').toUpperCase().trim();

  // Pattern: 4K - 2L (Cycle 6)
  if (upperGroup.includes('JAKTIM')) {
    if (upperName.includes('DIKI') || upperName.includes('AGUSTIAN')) return 4; // Libur H-1
    if (upperName.includes('SADDAM') || upperName.includes('BUDIMAN')) return 1; // Kerja H-2
    if (upperName.includes('KUSNAEDI') || upperName.includes('MUSLIM')) return 3; // Kerja H-4
    return (memberIndex * 2) % 6;
  }

  // Pattern: 6K - 2L (Cycle 8)
  if (upperGroup.includes('BEKASI TIMUR') || upperGroup.includes('BEKASI BARAT')) {
    if (upperName.includes('A.ROHMAN') || upperName.includes('ROHMAN')) return 6; // Libur H-1
    if (upperName.includes('IWAN')) return 7; // Libur H-2 / Ijin
    if (upperName.includes('PURNOMO') || upperName.includes('SIMAN')) return 1; // Kerja H-2
    if (upperName.includes('JUNAEDI') || upperName.includes('HERMAN')) return 3; // Kerja H-4
    if (upperName.includes('ASEP SUNANDAR')) return 4; // Kerja H-5
    if (upperName.includes('ASEP AHMAD')) return 5; // Kerja H-6
    return (memberIndex * 2) % 8;
  }

  // Pattern: TO DEPOK (Cycle 28: 21 Hari Masuk Kerja & 7 Hari Libur per Bulan)
  if (upperGroup.includes('DEPOK')) {
    if (upperName === 'ASEP') return 0; // Libur Minggu 1 (Hari 0..6)
    if (upperName.includes('ROHMAT')) return 21; // Libur Minggu 2 (Hari 7..13): (21 + 7) % 28 = 0
    if (upperName.includes('UCU')) return 14; // Libur Minggu 3 (Hari 14..20): (14 + 14) % 28 = 0
    if (upperName.includes('ABU FIRMAN') || upperName.includes('ABU')) return 7; // Libur Minggu 4 (Hari 21..27): (7 + 21) % 28 = 0
    return ((28 - (memberIndex * 7)) % 28);
  }

  return (memberIndex * 2) % 6;
}

/**
 * Calculate shift status and informative breakdown for a given personnel on target date
 */
export function calculateShiftInfo(
  targetDateStr: string,
  groupName: string,
  member: Personnel,
  memberIndex: number
): ShiftInfo {
  const pattern = member.shiftPattern || getDefaultPatternForGroup(groupName);
  const isJaktim = pattern === '4_2';
  const isDepok = pattern === 'depok_monthly_1week';

  const anchorDate = isJaktim ? ANCHOR_DATE_INNER : ANCHOR_DATE_BEKASI;
  const diffDays = getDiffInDays(targetDateStr, anchorDate);

  const baseOffset =
    member.shiftOffset !== undefined
      ? member.shiftOffset
      : getDefaultMemberOffset(groupName, member.name, memberIndex);

  // 1. PATTERN 4 HARI KERJA & 2 HARI LIBUR (Cycle 6)
  if (pattern === '4_2') {
    const cycleLen = 6;
    const rawStep = (baseOffset + diffDays) % cycleLen;
    const currentStep = (rawStep + cycleLen) % cycleLen; // 0..5

    const isWorkDay = currentStep < 4;
    const computedStatus: MemberStatus = isWorkDay ? 'standby' : 'off';

    let cycleDayText = '';
    let remainingDaysText = '';

    if (isWorkDay) {
      const workDayNum = currentStep + 1;
      cycleDayText = `Kerja Ke-${workDayNum}/4`;
      const sisaKerja = 4 - workDayNum;
      remainingDaysText = sisaKerja === 0 ? 'Besok Libur 🔴' : `${sisaKerja} hr lg libur`;
    } else {
      const offDayNum = currentStep - 4 + 1;
      cycleDayText = `Libur Ke-${offDayNum}/2`;
      const sisaLibur = 2 - offDayNum;
      remainingDaysText = sisaLibur === 0 ? 'Besok Masuk 🟢' : 'Masuk lusa';
    }

    return {
      pattern: '4_2',
      patternLabel: '4K - 2L',
      isWorkDay,
      computedStatus,
      cycleDayText,
      remainingDaysText
    };
  }

  // 2. PATTERN 6 HARI KERJA & 2 HARI LIBUR (Cycle 8)
  if (pattern === '6_2') {
    const cycleLen = 8;
    const rawStep = (baseOffset + diffDays) % cycleLen;
    const currentStep = (rawStep + cycleLen) % cycleLen; // 0..7

    const isWorkDay = currentStep < 6;
    const computedStatus: MemberStatus = isWorkDay ? 'standby' : 'off';

    let cycleDayText = '';
    let remainingDaysText = '';

    if (isWorkDay) {
      const workDayNum = currentStep + 1;
      cycleDayText = `Kerja Ke-${workDayNum}/6`;
      const sisaKerja = 6 - workDayNum;
      remainingDaysText = sisaKerja === 0 ? 'Besok Libur 🔴' : `${sisaKerja} hr lg libur`;
    } else {
      const offDayNum = currentStep - 6 + 1;
      cycleDayText = `Libur Ke-${offDayNum}/2`;
      const sisaLibur = 2 - offDayNum;
      remainingDaysText = sisaLibur === 0 ? 'Besok Masuk 🟢' : 'Masuk lusa';
    }

    return {
      pattern: '6_2',
      patternLabel: '6K - 2L',
      isWorkDay,
      computedStatus,
      cycleDayText,
      remainingDaysText
    };
  }

  // 3. PATTERN TO DEPOK: 1 BULAN LIBUR 1 MINGGU DIURUT (Siklus 28 Hari)
  // Perhitungan: Dalam 1 bulan terdapat 21 Hari Masuk Kerja & 7 Hari Libur Penuh
  if (pattern === 'depok_monthly_1week') {
    const cycleLen = 28;
    const rawStep = (baseOffset + diffDays) % cycleLen;
    const currentStep = (rawStep + cycleLen) % cycleLen; // 0..27

    // Steps 0..6: 7 Hari Libur (1 Minggu Libur)
    // Steps 7..27: 21 Hari Masuk Kerja (3 Minggu Masuk Kerja)
    const isOffWeek = currentStep < 7;
    const isWorkDay = !isOffWeek;
    const computedStatus: MemberStatus = isWorkDay ? 'standby' : 'off';

    let cycleDayText = '';
    let remainingDaysText = '';

    if (isOffWeek) {
      const offDayNum = currentStep + 1; // 1..7
      cycleDayText = `Libur Ke-${offDayNum}/7 Hari (1 Mgg Libur)`;
      const sisaOff = 7 - offDayNum;
      remainingDaysText = sisaOff === 0 ? 'Besok Masuk Kerja 🟢' : `${sisaOff} hr libur lg`;
    } else {
      const workDayNum = currentStep - 7 + 1; // 1..21 (Hari Masuk dalam 1 Bulan)
      const workWeekNum = Math.floor((currentStep - 7) / 7) + 1; // Minggu Masuk 1..3
      cycleDayText = `Masuk Ke-${workDayNum}/21 Hari (Mgg ${workWeekNum}/3)`;
      const sisaKerja = 21 - workDayNum;
      remainingDaysText = sisaKerja === 0 ? 'Besok Libur 1 Mgg 🔴' : `${sisaKerja} hr lg libur 1 mgg`;
    }

    return {
      pattern: 'depok_monthly_1week',
      patternLabel: '21 Masuk - 7 Libur/Bln',
      isWorkDay,
      computedStatus,
      cycleDayText,
      remainingDaysText
    };
  }

  // Default fallback
  return {
    pattern: 'custom',
    patternLabel: 'Manual',
    isWorkDay: member.status === 'standby',
    computedStatus: member.status,
    cycleDayText: member.status.toUpperCase(),
    remainingDaysText: '-'
  };
}

/**
 * Apply automatic shift calculation to all members in a StandbySchedule for its date
 * Note: If a member was specifically marked 'ijin_sakit' manually, preserve it unless reset requested!
 */
export function applyAutoShiftToSchedule(
  schedule: StandbySchedule,
  forceResetManualOverrides = false
): StandbySchedule {
  const targetDateStr = schedule.date;
  if (!targetDateStr) return schedule;

  const updatedGroups: TeamGroup[] = schedule.groups.map((group) => {
    const defaultPattern = getDefaultPatternForGroup(group.groupName);

    const updatedMembers: Personnel[] = group.members.map((member, idx) => {
      const pattern = member.shiftPattern || defaultPattern;
      const offset =
        member.shiftOffset !== undefined
          ? member.shiftOffset
          : getDefaultMemberOffset(group.groupName, member.name, idx);

      const shiftInfo = calculateShiftInfo(targetDateStr, group.groupName, {
        ...member,
        shiftPattern: pattern,
        shiftOffset: offset
      }, idx);

      // Preserve manual override or 'ijin_sakit' if not force reset
      let finalStatus: MemberStatus = shiftInfo.computedStatus;
      if (!forceResetManualOverrides && (member.status === 'ijin_sakit' || member.isManualOverride)) {
        finalStatus = member.status;
      }

      return {
        ...member,
        shiftPattern: pattern,
        shiftOffset: offset,
        status: finalStatus
      };
    });

    return {
      ...group,
      defaultPattern,
      members: updatedMembers
    };
  });

  return {
    ...schedule,
    groups: updatedGroups
  };
}

/**
 * Calculate the required shift offset so that on targetDateStr, the member is at chosenStep
 */
export function calculateOffsetFromStep(
  pattern: ShiftPatternType,
  targetDateStr: string,
  chosenStep: number
): number {
  if (pattern === '4_2') {
    const diff = getDiffInDays(targetDateStr, ANCHOR_DATE_INNER);
    return ((chosenStep - diff) % 6 + 6) % 6;
  }
  if (pattern === '6_2') {
    const diff = getDiffInDays(targetDateStr, ANCHOR_DATE_BEKASI);
    return ((chosenStep - diff) % 8 + 8) % 8;
  }
  if (pattern === 'depok_monthly_1week') {
    const diff = getDiffInDays(targetDateStr, ANCHOR_DATE_BEKASI);
    return ((chosenStep - diff) % 28 + 28) % 28;
  }
  return 0;
}

/**
 * Get current step (0..N-1) for a member on targetDateStr
 */
export function getCurrentStepForMember(
  targetDateStr: string,
  groupName: string,
  member: Personnel,
  memberIndex: number
): number {
  const pattern = member.shiftPattern || getDefaultPatternForGroup(groupName);
  const isJaktim = pattern === '4_2';
  const anchorDate = isJaktim ? ANCHOR_DATE_INNER : ANCHOR_DATE_BEKASI;
  const diffDays = getDiffInDays(targetDateStr, anchorDate);
  const baseOffset =
    member.shiftOffset !== undefined
      ? member.shiftOffset
      : getDefaultMemberOffset(groupName, member.name, memberIndex);

  if (pattern === '4_2') {
    const rawStep = (baseOffset + diffDays) % 6;
    return (rawStep + 6) % 6;
  }
  if (pattern === '6_2') {
    const rawStep = (baseOffset + diffDays) % 8;
    return (rawStep + 8) % 8;
  }
  if (pattern === 'depok_monthly_1week') {
    const rawStep = (baseOffset + diffDays) % 28;
    return (rawStep + 28) % 28;
  }
  return 0;
}

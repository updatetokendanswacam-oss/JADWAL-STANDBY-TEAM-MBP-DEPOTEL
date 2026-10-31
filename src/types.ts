export type MemberStatus = 'off' | 'ijin_sakit' | 'standby';

export type ShiftPatternType = '4_2' | '6_2' | 'depok_monthly_1week' | 'custom' | 'none';

export interface Personnel {
  id: string;
  name: string;
  phone: string;
  status: MemberStatus;
  notes?: string;
  shiftPattern?: ShiftPatternType;
  shiftOffset?: number;
  isManualOverride?: boolean;
}

export interface TeamGroup {
  id: string;
  groupName: string; // e.g., "TO JAKTIM 1", "TO JAKTIM 2"
  defaultPattern?: ShiftPatternType;
  members: Personnel[];
}

export interface StandbySchedule {
  id: string;
  title: string; // e.g. "JADWAL STANDBY TEAM MBP *DEPOTEL* INNER JAKTIM KAMIS, 29-10-2026"
  headerTitle?: string; // e.g. "JADWAL STANDBY TEAM MBP DEPOTEL INNER JAKTIM"
  subBadgeTitle?: string; // e.g. "DEPOTEL INNER JAKTIM" or "DEPOTEL BEKASI"
  isCustomTitle?: boolean; // True when user manually edits title so date picker preserves custom title format
  titleFormatStyle?: 'day_comma_date' | 'day_space_date' | 'date_only';
  nopName: string; // e.g. "NOP SOUTHERN"
  date: string; // "29-10-2026"
  dayName?: string; // "Kamis", "Jumat", "Sabtu", etc.
  groups: TeamGroup[];
}

export type UserRole = 'Admin' | 'User';
export type UserStatus = 'Aktif' | 'Nonaktif';

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export type ViewMode = 'mbp_standby' | 'broadcast_wa' | 'settings';

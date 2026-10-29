export type MemberStatus = 'off' | 'ijin_sakit' | 'standby';

export interface Personnel {
  id: string;
  name: string;
  phone: string;
  status: MemberStatus;
  notes?: string;
}

export interface TeamGroup {
  id: string;
  groupName: string; // e.g., "TO JAKTIM 1", "TO JAKTIM 2"
  members: Personnel[];
}

export interface StandbySchedule {
  id: string;
  title: string; // e.g. "JADWAL STANDBY TEAM MBP DEPOTEL INNER JAKTIM KAMIS, 29-10-2026"
  isCustomTitle?: boolean; // True when user manually edits title so date picker preserves custom title format
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

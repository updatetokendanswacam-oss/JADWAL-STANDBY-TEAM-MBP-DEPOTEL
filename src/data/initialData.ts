import { StandbySchedule, AppUser } from '../types';

export const INITIAL_STANDBY_SCHEDULE: StandbySchedule = {
  id: 'mbp-jaktim-29102026',
  title: 'JADWAL STANDBY TEAM MBP DEPOTEL INNER JAKTIM KAMIS, 29-10-2026',
  nopName: 'NOP SOUTHERN',
  date: '29-10-2026',
  dayName: 'Kamis',
  groups: [
    {
      id: 'grp-jaktim-1',
      groupName: 'TO JAKTIM 1',
      members: [
        {
          id: 'p1',
          name: 'DIKI SOLIHIN',
          phone: '0813996457698',
          status: 'off'
        },
        {
          id: 'p2',
          name: 'SADDAMHUSEN',
          phone: '082258728570',
          status: 'standby'
        },
        {
          id: 'p3',
          name: 'KUSNAEDI',
          phone: '085715645590',
          status: 'standby'
        }
      ]
    },
    {
      id: 'grp-jaktim-2',
      groupName: 'TO JAKTIM 2',
      members: [
        {
          id: 'p4',
          name: 'AGUSTIAN',
          phone: '081298902927',
          status: 'off'
        },
        {
          id: 'p5',
          name: 'BUDIMAN',
          phone: '081381227922',
          status: 'standby'
        },
        {
          id: 'p6',
          name: 'MUSLIM',
          phone: '082111108875',
          status: 'standby'
        }
      ]
    }
  ]
};

export const INITIAL_APP_USERS: AppUser[] = [
  {
    id: 'usr-1',
    name: 'Administrator Depotel',
    email: 'admin.depotel@gmail.com',
    role: 'Admin',
    status: 'Aktif',
    createdAt: '2026-10-29'
  },
  {
    id: 'usr-2',
    name: 'Diki Solihin (Koordinator)',
    email: 'dikisolihin.mbp@gmail.com',
    role: 'Admin',
    status: 'Aktif',
    createdAt: '2026-10-29'
  },
  {
    id: 'usr-3',
    name: 'Saddam Husen (Team MBP)',
    email: 'saddamhusen.mbp@gmail.com',
    role: 'User',
    status: 'Aktif',
    createdAt: '2026-10-29'
  },
  {
    id: 'usr-4',
    name: 'Agustian (Team MBP)',
    email: 'agustian.mbp@gmail.com',
    role: 'User',
    status: 'Nonaktif',
    createdAt: '2026-10-29'
  }
];

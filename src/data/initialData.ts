import { StandbySchedule, AppUser } from '../types';

export const INITIAL_SCHEDULE_INNER_JAKTIM: StandbySchedule = {
  id: 'mbp-inner-jaktim',
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

export const INITIAL_SCHEDULE_OUTER_BEKASI: StandbySchedule = {
  id: 'mbp-outer-bekasi',
  title: 'JADWAL STANDBY TEAM MBP *DEPOTEL* BEKASI 28-10-2026',
  nopName: 'NOP BEKASI',
  date: '28-10-2026',
  dayName: 'Rabu',
  groups: [
    {
      id: 'grp-bekasi-timur',
      groupName: 'TO BEKASI TIMUR',
      members: [
        {
          id: 'pb1',
          name: 'IWANSUWANDANA',
          phone: '081292754973',
          status: 'ijin_sakit'
        },
        {
          id: 'pb2',
          name: 'SIMAN',
          phone: '081310836896',
          status: 'standby'
        },
        {
          id: 'pb3',
          name: 'HERMAN',
          phone: '081281723449',
          status: 'standby'
        },
        {
          id: 'pb4',
          name: 'ASEP AHMAD',
          phone: '085280255081',
          status: 'standby'
        }
      ]
    },
    {
      id: 'grp-bekasi-barat',
      groupName: 'TO BEKASI BARAT',
      members: [
        {
          id: 'pb5',
          name: 'PURNOMO',
          phone: '081289027001',
          status: 'standby'
        },
        {
          id: 'pb6',
          name: 'JUNAEDI',
          phone: '081222934780',
          status: 'standby'
        },
        {
          id: 'pb7',
          name: 'A.ROHMAN',
          phone: '081218339684',
          status: 'off'
        },
        {
          id: 'pb8',
          name: 'ASEP SUNANDAR',
          phone: '081387150374',
          status: 'standby'
        }
      ]
    },
    {
      id: 'grp-depok',
      groupName: 'TO DEPOK',
      members: [
        {
          id: 'pb9',
          name: 'ASEP',
          phone: '08212043387',
          status: 'off'
        },
        {
          id: 'pb10',
          name: 'ROHMAT',
          phone: '08211873465',
          status: 'standby'
        },
        {
          id: 'pb11',
          name: 'UCU SUTISNA',
          phone: '081293532227',
          status: 'standby'
        },
        {
          id: 'pb12',
          name: 'ABU FIRMAN',
          phone: '08211873465',
          status: 'standby'
        }
      ]
    }
  ]
};

// Legacy fallback export
export const INITIAL_STANDBY_SCHEDULE = INITIAL_SCHEDULE_INNER_JAKTIM;

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
    name: 'Diki Solihin (Koordinator Jaktim)',
    email: 'dikisolihin.mbp@gmail.com',
    role: 'Admin',
    status: 'Aktif',
    createdAt: '2026-10-29'
  },
  {
    id: 'usr-3',
    name: 'Iwan Suwandana (Koordinator Bekasi)',
    email: 'iwansuwandana.mbp@gmail.com',
    role: 'Admin',
    status: 'Aktif',
    createdAt: '2026-10-29'
  },
  {
    id: 'usr-4',
    name: 'Saddam Husen (Team MBP)',
    email: 'saddamhusen.mbp@gmail.com',
    role: 'User',
    status: 'Aktif',
    createdAt: '2026-10-29'
  }
];


import React, { useState, useEffect } from 'react';
import {
  StandbySchedule,
  ViewMode,
  Personnel,
  AppUser
} from './types';
import {
  INITIAL_SCHEDULE_INNER_JAKTIM,
  INITIAL_SCHEDULE_OUTER_BEKASI,
  INITIAL_APP_USERS
} from './data/initialData';
import { Header } from './components/Header';
import { MBPStandbyView } from './components/MBPStandbyView';
import { BroadcastWAView } from './components/BroadcastWAView';
import { SettingsView } from './components/SettingsView';
import { PersonnelModal } from './components/PersonnelModal';
import { AccountModal } from './components/AccountModal';
import {
  formatStandbyScheduleToWA,
  formatCombinedStandbyScheduleToWA,
  buildAutoWATitle
} from './utils/whatsappFormatter';
import { getIndonesianDayName } from './utils/dateUtils';
import { applyAutoShiftToSchedule } from './utils/shiftScheduleCalculator';
import {
  CheckCircle2,
  Home,
  Settings,
  ShieldCheck,
  MessageCircle
} from 'lucide-react';
import {
  db,
  testFirestoreConnection,
  handleFirestoreError,
  OperationType
} from './firebase';
import {
  doc,
  onSnapshot,
  setDoc,
  getDoc,
  DocumentSnapshot,
  FirestoreError
} from 'firebase/firestore';

const STORAGE_KEY_INNER = 'mbp_schedule_inner_jaktim_v10';
const STORAGE_KEY_OUTER = 'mbp_schedule_outer_bekasi_v10';
const STORAGE_KEY_USERS = 'mbp_app_users_v10';
const STORAGE_KEY_CURRENT_USER = 'mbp_current_user_v10';

// Ensure group names for Inner Jaktim align with user's specification (TO JAKTIM 1 & TO JAKTIM 2)
const normalizeInnerSchedule = (sched: StandbySchedule): StandbySchedule => {
  let nop = sched.nopName || 'NOP SOUTHERN';
  if (nop.includes('&') || (nop.includes('SOUTHERN') && nop.includes('BEKASI'))) {
    nop = 'NOP SOUTHERN';
  }
  const updatedGroups = sched.groups.map((grp) => {
    if (grp.groupName === 'NOP SOUTHERN JAKTIM 1') {
      return { ...grp, groupName: 'TO JAKTIM 1' };
    }
    if (grp.groupName === 'NOP SOUTHERN JAKTIM 2') {
      return { ...grp, groupName: 'TO JAKTIM 2' };
    }
    return grp;
  });

  const dateStr = sched.date || '29-10-2026';
  const dayName = sched.dayName || getIndonesianDayName(dateStr);
  const autoTitle = buildAutoWATitle({
    ...sched,
    date: dateStr,
    dayName: dayName
  }, sched.titleFormatStyle || 'day_comma_date');

  // Strictly preserve saved title so user changes remain permanent even across page refreshes
  const finalTitle = sched.title && sched.title.trim().length > 0 ? sched.title : autoTitle;

  const normalized: StandbySchedule = {
    ...sched,
    date: dateStr,
    dayName: dayName,
    title: finalTitle,
    isCustomTitle: sched.isCustomTitle ?? (sched.title ? true : false),
    headerTitle: sched.headerTitle || 'JADWAL STANDBY TEAM MBP DEPOTEL INNER JAKTIM',
    subBadgeTitle: sched.subBadgeTitle || 'DEPOTEL INNER JAKTIM',
    nopName: nop,
    groups: updatedGroups
  };
  return applyAutoShiftToSchedule(normalized);
};

const normalizeOuterSchedule = (sched: StandbySchedule): StandbySchedule => {
  const dateStr = sched.date || '28-10-2026';
  const dayName = sched.dayName || getIndonesianDayName(dateStr);
  const autoTitle = buildAutoWATitle({
    ...sched,
    date: dateStr,
    dayName: dayName
  }, sched.titleFormatStyle || 'day_comma_date');

  // Strictly preserve saved title so user changes remain permanent even across page refreshes
  const finalTitle = sched.title && sched.title.trim().length > 0 ? sched.title : autoTitle;

  const normalized: StandbySchedule = {
    ...sched,
    date: dateStr,
    dayName: dayName,
    title: finalTitle,
    isCustomTitle: sched.isCustomTitle ?? (sched.title ? true : false),
    headerTitle: sched.headerTitle || 'JADWAL STANDBY TEAM MBP DEPOTEL BEKASI',
    subBadgeTitle: sched.subBadgeTitle || 'DEPOTEL BEKASI',
    nopName: sched.nopName || 'NOP BEKASI'
  };
  return applyAutoShiftToSchedule(normalized);
};

export default function App() {
  const [innerSchedule, setInnerScheduleState] = useState<StandbySchedule>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_INNER);
      return saved ? normalizeInnerSchedule(JSON.parse(saved)) : INITIAL_SCHEDULE_INNER_JAKTIM;
    } catch {
      return INITIAL_SCHEDULE_INNER_JAKTIM;
    }
  });

  const [outerSchedule, setOuterScheduleState] = useState<StandbySchedule>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_OUTER);
      return saved ? normalizeOuterSchedule(JSON.parse(saved)) : INITIAL_SCHEDULE_OUTER_BEKASI;
    } catch {
      return INITIAL_SCHEDULE_OUTER_BEKASI;
    }
  });

  const [users, setUsersState] = useState<AppUser[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USERS);
      return saved ? JSON.parse(saved) : INITIAL_APP_USERS;
    } catch {
      return INITIAL_APP_USERS;
    }
  });

  // Current Active User State (RBAC: Admin vs User)
  const [currentUser, setCurrentUserState] = useState<AppUser | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CURRENT_USER);
      if (saved) return JSON.parse(saved);
      // Default to Saddam Husen (User) so User restrictions can be directly experienced
      return INITIAL_APP_USERS.find((u) => u.role === 'User') || INITIAL_APP_USERS[0];
    } catch {
      return INITIAL_APP_USERS.find((u) => u.role === 'User') || INITIAL_APP_USERS[0];
    }
  });

  const setCurrentUser = (user: AppUser | null) => {
    setCurrentUserState(user);
    try {
      if (user) {
        localStorage.setItem(STORAGE_KEY_CURRENT_USER, JSON.stringify(user));
      } else {
        localStorage.removeItem(STORAGE_KEY_CURRENT_USER);
      }
    } catch {}
  };

  const isAdmin = currentUser?.role === 'Admin';
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);

  const [activeView, setActiveView] = useState<ViewMode>('mbp_standby');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Personnel Modal state
  const [isPersonnelModalOpen, setIsPersonnelModalOpen] = useState(false);
  const [modalScheduleId, setModalScheduleId] = useState<string>(innerSchedule.id);
  const [modalGroupId, setModalGroupId] = useState<string>('grp-jaktim-1');
  const [editingMember, setEditingMember] = useState<Personnel | null>(null);

  // Firestore Real-Time Listener Synchronization
  useEffect(() => {
    testFirestoreConnection();

    // 1. Inner Jaktim Listener
    const unsubscribeInner = onSnapshot(
      doc(db, 'schedules', 'inner_jaktim'),
      (docSnap: DocumentSnapshot) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as StandbySchedule;
          const normalized = normalizeInnerSchedule(data);
          setInnerScheduleState(normalized);
          try {
            localStorage.setItem(STORAGE_KEY_INNER, JSON.stringify(normalized));
          } catch (e) {
            console.error('Failed local storage cache', e);
          }
        } else {
          // Seed initial data if document doesn't exist
          setDoc(doc(db, 'schedules', 'inner_jaktim'), INITIAL_SCHEDULE_INNER_JAKTIM).catch(
            (err: unknown) => handleFirestoreError(err, OperationType.WRITE, 'schedules/inner_jaktim')
          );
        }
      },
      (error: FirestoreError) => {
        console.warn('Firestore inner schedule snapshot error:', error);
      }
    );

    // 2. Outer Bekasi Listener
    const unsubscribeOuter = onSnapshot(
      doc(db, 'schedules', 'outer_bekasi'),
      (docSnap: DocumentSnapshot) => {
        if (docSnap.exists()) {
          const data = docSnap.data() as StandbySchedule;
          const normalized = normalizeOuterSchedule(data);
          setOuterScheduleState(normalized);
          try {
            localStorage.setItem(STORAGE_KEY_OUTER, JSON.stringify(normalized));
          } catch (e) {
            console.error('Failed local storage cache', e);
          }
        } else {
          setDoc(doc(db, 'schedules', 'outer_bekasi'), INITIAL_SCHEDULE_OUTER_BEKASI).catch(
            (err: unknown) => handleFirestoreError(err, OperationType.WRITE, 'schedules/outer_bekasi')
          );
        }
      },
      (error: FirestoreError) => {
        console.warn('Firestore outer schedule snapshot error:', error);
      }
    );

    // 3. App Users Listener
    const unsubscribeUsers = onSnapshot(
      doc(db, 'app_users', 'users_list'),
      (docSnap: DocumentSnapshot) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (Array.isArray(data?.list)) {
            setUsersState(data.list);
            try {
              localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(data.list));
            } catch (e) {
              console.error('Failed local storage cache', e);
            }
          }
        } else {
          setDoc(doc(db, 'app_users', 'users_list'), { list: INITIAL_APP_USERS }).catch((err: unknown) =>
            handleFirestoreError(err, OperationType.WRITE, 'app_users/users_list')
          );
        }
      },
      (error: FirestoreError) => {
        console.warn('Firestore users snapshot error:', error);
      }
    );

    return () => {
      unsubscribeInner();
      unsubscribeOuter();
      unsubscribeUsers();
    };
  }, []);

  // Update Handlers with Firestore Persistence
  const setInnerSchedule = (newSchedule: StandbySchedule) => {
    setInnerScheduleState(newSchedule);
    try {
      localStorage.setItem(STORAGE_KEY_INNER, JSON.stringify(newSchedule));
    } catch {}
    setDoc(doc(db, 'schedules', 'inner_jaktim'), newSchedule).catch((err: unknown) =>
      handleFirestoreError(err, OperationType.WRITE, 'schedules/inner_jaktim')
    );
  };

  const setOuterSchedule = (newSchedule: StandbySchedule) => {
    setOuterScheduleState(newSchedule);
    try {
      localStorage.setItem(STORAGE_KEY_OUTER, JSON.stringify(newSchedule));
    } catch {}
    setDoc(doc(db, 'schedules', 'outer_bekasi'), newSchedule).catch((err: unknown) =>
      handleFirestoreError(err, OperationType.WRITE, 'schedules/outer_bekasi')
    );
  };

  const setUsers = (newUsers: AppUser[]) => {
    setUsersState(newUsers);
    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(newUsers));
    } catch {}
    setDoc(doc(db, 'app_users', 'users_list'), { list: newUsers }).catch((err: unknown) =>
      handleFirestoreError(err, OperationType.WRITE, 'app_users/users_list')
    );
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  const handleOpenAddMember = (scheduleId: string, groupId: string) => {
    setModalScheduleId(scheduleId);
    setModalGroupId(groupId);
    setEditingMember(null);
    setIsPersonnelModalOpen(true);
  };

  const handleEditMember = (scheduleId: string, groupId: string, member: Personnel) => {
    setModalScheduleId(scheduleId);
    setModalGroupId(groupId);
    setEditingMember(member);
    setIsPersonnelModalOpen(true);
  };

  const handleSaveMember = (targetGroupId: string, memberData: Personnel) => {
    const isInner = modalScheduleId === innerSchedule.id;
    const targetSchedule = isInner ? innerSchedule : outerSchedule;
    const updateFn = isInner ? setInnerSchedule : setOuterSchedule;

    const updatedGroups = targetSchedule.groups.map((grp) => {
      const cleanMembers = grp.members.filter((m) => m.id !== memberData.id);

      if (grp.id === targetGroupId) {
        const exists = grp.members.some((m) => m.id === memberData.id);
        if (exists) {
          return {
            ...grp,
            members: grp.members.map((m) => (m.id === memberData.id ? memberData : m))
          };
        } else {
          return {
            ...grp,
            members: [...cleanMembers, memberData]
          };
        }
      }

      return {
        ...grp,
        members: cleanMembers
      };
    });

    updateFn({
      ...targetSchedule,
      groups: updatedGroups
    });

    showToast(
      editingMember
        ? `Data ${memberData.name} berhasil diperbarui!`
        : `${memberData.name} berhasil ditambahkan ke tim!`
    );
  };

  const handleQuickCopyAll = () => {
    const textCombined = formatCombinedStandbyScheduleToWA(innerSchedule, outerSchedule);
    navigator.clipboard.writeText(textCombined);
    showToast('Seluruh Jadwal Standby (Inner Jaktim & Bekasi) berhasil disalin!');
  };

  const handleResetData = () => {
    if (
      window.confirm(
        'Apakah Anda yakin ingin mengembalikan seluruh data ke format standar jadwal (INNER JAKTIM & BEKASI)?'
      )
    ) {
      setInnerSchedule(INITIAL_SCHEDULE_INNER_JAKTIM);
      setOuterSchedule(INITIAL_SCHEDULE_OUTER_BEKASI);
      setUsers(INITIAL_APP_USERS);
      showToast('Data berhasil direset ke standar awal dan disinkronkan ke Cloud!');
    }
  };

  const handleRefreshData = async () => {
    try {
      showToast('Menghubungkan & menyinkronkan data real-time dengan Cloud...');

      // 1. Flush current state to Cloud Firestore
      await Promise.allSettled([
        setDoc(doc(db, 'schedules', 'inner_jaktim'), innerSchedule),
        setDoc(doc(db, 'schedules', 'outer_bekasi'), outerSchedule),
        setDoc(doc(db, 'app_users', 'users_list'), { list: users })
      ]);

      // 2. Fetch fresh snapshots from Cloud Firestore
      const [innerSnap, outerSnap, usersSnap] = await Promise.all([
        getDoc(doc(db, 'schedules', 'inner_jaktim')),
        getDoc(doc(db, 'schedules', 'outer_bekasi')),
        getDoc(doc(db, 'app_users', 'users_list'))
      ]);

      if (innerSnap.exists()) {
        const data = innerSnap.data() as StandbySchedule;
        const normalized = normalizeInnerSchedule(data);
        setInnerScheduleState(normalized);
        try {
          localStorage.setItem(STORAGE_KEY_INNER, JSON.stringify(normalized));
        } catch {}
      }

      if (outerSnap.exists()) {
        const data = outerSnap.data() as StandbySchedule;
        const normalized = normalizeOuterSchedule(data);
        setOuterScheduleState(normalized);
        try {
          localStorage.setItem(STORAGE_KEY_OUTER, JSON.stringify(normalized));
        } catch {}
      }

      if (usersSnap.exists()) {
        const data = usersSnap.data();
        if (Array.isArray(data?.list)) {
          setUsersState(data.list);
          try {
            localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(data.list));
          } catch {}
        }
      }

      // Check for PWA updates if service worker registered
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((reg) => reg.update());
        });
      }

      showToast('✅ Seluruh data jadwal (Inner Jaktim & Bekasi) & akun berhasil diperbarui dari Cloud!');
    } catch (err) {
      console.warn('Refresh data fallback to local sync:', err);
      const normalizedInner = normalizeInnerSchedule(innerSchedule);
      const normalizedOuter = normalizeOuterSchedule(outerSchedule);
      setInnerScheduleState(normalizedInner);
      setOuterScheduleState(normalizedOuter);
      try {
        localStorage.setItem(STORAGE_KEY_INNER, JSON.stringify(normalizedInner));
        localStorage.setItem(STORAGE_KEY_OUTER, JSON.stringify(normalizedOuter));
      } catch {}
      showToast('✅ Data WebApp berhasil diperbarui & disinkronkan secara lokal! 🔄');
    }
  };

  const activeTargetGroups = modalScheduleId === innerSchedule.id ? innerSchedule.groups : outerSchedule.groups;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950 relative overflow-x-hidden">
      {/* Background Watermark Logo (Emblem) */}
      <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center opacity-[0.06] select-none overflow-hidden p-4">
        <img
          src="/logo-emblem.png"
          alt="JADWAL STANDBY TEAM MBP DEPOTEL Background Emblem"
          className="w-[500px] h-[500px] sm:w-[750px] sm:h-[750px] object-contain drop-shadow-[0_0_60px_rgba(234,179,8,0.35)] animate-pulse duration-[6000ms]"
        />
      </div>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-600 text-white font-semibold text-xs px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2 border border-emerald-400/30 animate-bounce">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main App Header */}
      <Header
        activeView={activeView}
        onSelectView={setActiveView}
        onQuickCopy={handleQuickCopyAll}
        onResetData={handleResetData}
        currentUser={currentUser}
        isAdmin={isAdmin}
        onOpenAccountModal={() => setIsAccountModalOpen(true)}
      />

      {/* Main View Container (Mobile-first responsive sizing) */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-2 sm:px-4 md:px-6 py-3 sm:py-6 space-y-4 sm:space-y-6 pb-24 sm:pb-32">
        {/* VIEW 1: MAIN DASHBOARD STANDBY (DISPLAYS BOTH LISTS: INNER JAKTIM & BEKASI) */}
        {activeView === 'mbp_standby' && (
          <MBPStandbyView
            innerSchedule={innerSchedule}
            outerSchedule={outerSchedule}
            onUpdateInnerSchedule={setInnerSchedule}
            onUpdateOuterSchedule={setOuterSchedule}
            onOpenAddMember={handleOpenAddMember}
            onEditMember={handleEditMember}
            onShowToast={showToast}
            isAdmin={isAdmin}
            currentUser={currentUser}
            onOpenAccountModal={() => setIsAccountModalOpen(true)}
          />
        )}

        {/* VIEW 2: BROADCAST WA GENERATOR */}
        {activeView === 'broadcast_wa' && (
          <BroadcastWAView
            innerSchedule={innerSchedule}
            outerSchedule={outerSchedule}
            onShowToast={showToast}
          />
        )}

        {/* VIEW 3: SETTINGS & USER MANAGEMENT */}
        {activeView === 'settings' && (
          <SettingsView
            innerSchedule={innerSchedule}
            outerSchedule={outerSchedule}
            onUpdateInnerSchedule={setInnerSchedule}
            onUpdateOuterSchedule={setOuterSchedule}
            users={users}
            onUpdateUsers={setUsers}
            onResetAllData={handleResetData}
            onRefreshData={handleRefreshData}
            onShowToast={showToast}
            isAdmin={isAdmin}
            currentUser={currentUser}
            onOpenAccountModal={() => setIsAccountModalOpen(true)}
          />
        )}
      </main>

      {/* FOOTER SECTION & STICKY BOTTOM NAVIGATION BAR */}
      <footer className="bg-slate-950 border-t border-slate-800 py-8 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
          {/* Main Footer Navigation Buttons */}
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border border-amber-500/60 p-0.5 bg-slate-950 shrink-0">
                <img src="/logo-emblem.png" alt="Emblem" className="w-full h-full object-cover rounded-full" />
              </div>
              <div>
                <span className="font-black text-slate-100 text-sm block">
                  JADWAL STANDBY TEAM MBP DEPOTEL
                </span>
                <span className="text-amber-400 text-xs font-mono font-bold">
                  (NOP SOUTHERN & NOP BEKASI)
                </span>
              </div>
            </div>

            {/* Footer Navigation Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto p-1 justify-center sm:justify-end">
              <button
                type="button"
                onClick={() => setActiveView('mbp_standby')}
                className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer select-none ${
                  activeView === 'mbp_standby'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/60 ring-2 ring-emerald-500/30'
                    : 'bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <Home className="w-4 h-4 text-emerald-300 pointer-events-none" />
                <span>Beranda Standby MBP</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView('broadcast_wa')}
                className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer select-none ${
                  activeView === 'broadcast_wa'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/60 ring-2 ring-emerald-500/30'
                    : 'bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <MessageCircle className="w-4 h-4 text-emerald-300 pointer-events-none" />
                <span>Broadcast WA</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveView('settings')}
                className={`min-h-[44px] px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center gap-2 shrink-0 cursor-pointer select-none ${
                  activeView === 'settings'
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/60 ring-2 ring-emerald-500/30'
                    : 'bg-slate-950 text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800'
                }`}
              >
                <Settings className="w-4 h-4 text-slate-300 pointer-events-none" />
                <span>Pengaturan</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-6 border-b border-slate-800">
            {/* Col 1: App Info */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-slate-100 font-extrabold text-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>DEPOTEL INNER JAKTIM & BEKASI</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Aplikasi Operasional PWA Jadwal Standby Team MBP Depotel Inner Jakarta Timur (NOP Southern) & Depotel Bekasi (NOP Bekasi).
              </p>
            </div>

            {/* Col 2: Navigation Links */}
            <div className="space-y-2">
              <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px] block">
                Navigasi Cepat
              </span>
              <ul className="space-y-1.5 text-slate-400 text-xs font-medium">
                <li>
                  <button
                    onClick={() => setActiveView('mbp_standby')}
                    className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Home className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Beranda Standby (Semua List)</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveView('broadcast_wa')}
                    className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Generator Format Broadcast WA</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveView('settings')}
                    className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    <span>Pengaturan & Kelola User</span>
                  </button>
                </li>
              </ul>
            </div>

            {/* Col 3: Status Quick Legend */}
            <div className="space-y-2">
              <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px] block">
                Keterangan Status
              </span>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex items-center gap-2 text-slate-300">
                  <span>🟢</span>
                  <span>: standby</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <span>🔴</span>
                  <span>: off</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <span>🟡</span>
                  <span>: ijin/sakit</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500 text-[11px] font-mono">
            <div>
              © 2026 JADWAL STANDBY TEAM MBP DEPOTEL (NOP SOUTHERN & NOP BEKASI).
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>PWA Cloud Real-Time Active</span>
            </div>
          </div>
        </div>
      </footer>

      {/* DOCKED FIXED BOTTOM NAVIGATION BAR */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/90 px-2 sm:px-4 py-1.5 sm:py-2 shadow-2xl flex items-center justify-center">
        <div className="max-w-md w-full flex items-center justify-around gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setActiveView('mbp_standby')}
            className={`min-h-[40px] sm:min-h-[44px] px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none flex-1 active:scale-95 ${
              activeView === 'mbp_standby'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/80 ring-2 ring-emerald-500/30 font-extrabold'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-100 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Home className="w-4 h-4 pointer-events-none" />
            <span>Beranda</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('broadcast_wa')}
            className={`min-h-[40px] sm:min-h-[44px] px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none flex-1 active:scale-95 ${
              activeView === 'broadcast_wa'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/80 ring-2 ring-emerald-500/30 font-extrabold'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-100 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <MessageCircle className="w-4 h-4 pointer-events-none" />
            <span>Broadcast</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveView('settings')}
            className={`min-h-[40px] sm:min-h-[44px] px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none flex-1 active:scale-95 ${
              activeView === 'settings'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/80 ring-2 ring-emerald-500/30 font-extrabold'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-100 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            <Settings className="w-4 h-4 pointer-events-none" />
            <span>Pengaturan</span>
          </button>
        </div>
      </div>

      {/* Personnel Add/Edit Modal */}
      <PersonnelModal
        isOpen={isPersonnelModalOpen}
        onClose={() => setIsPersonnelModalOpen(false)}
        groupId={modalGroupId}
        groups={activeTargetGroups}
        editingMember={editingMember}
        onSave={handleSaveMember}
      />

      {/* Account & Role Switcher Modal (Admin vs User) */}
      <AccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        currentUser={currentUser}
        onSelectUser={(user) => {
          setCurrentUser(user);
          showToast(`Beralih ke akun ${user.name} (${user.role.toUpperCase()})`);
        }}
        users={users}
        onShowToast={showToast}
      />
    </div>
  );
}

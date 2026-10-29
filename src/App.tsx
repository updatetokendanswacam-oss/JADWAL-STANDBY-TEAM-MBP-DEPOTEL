import React, { useState, useEffect } from 'react';
import {
  StandbySchedule,
  ViewMode,
  Personnel,
  AppUser
} from './types';
import { INITIAL_STANDBY_SCHEDULE, INITIAL_APP_USERS } from './data/initialData';
import { Header } from './components/Header';
import { MBPStandbyView } from './components/MBPStandbyView';
import { BroadcastWAView } from './components/BroadcastWAView';
import { SettingsView } from './components/SettingsView';
import { PersonnelModal } from './components/PersonnelModal';
import { formatStandbyScheduleToWA } from './utils/whatsappFormatter';
import {
  CheckCircle2,
  Home,
  Settings,
  ShieldCheck,
  Zap,
  MessageCircle
} from 'lucide-react';

const STORAGE_KEY_SCHEDULE = 'mbp_standby_schedule_v5';
const STORAGE_KEY_USERS = 'mbp_app_users_v5';

export default function App() {
  const [schedule, setSchedule] = useState<StandbySchedule>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SCHEDULE);
      return saved ? JSON.parse(saved) : INITIAL_STANDBY_SCHEDULE;
    } catch (e) {
      return INITIAL_STANDBY_SCHEDULE;
    }
  });

  const [users, setUsers] = useState<AppUser[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USERS);
      return saved ? JSON.parse(saved) : INITIAL_APP_USERS;
    } catch (e) {
      return INITIAL_APP_USERS;
    }
  });

  const [activeView, setActiveView] = useState<ViewMode>('mbp_standby');

  // Toast notification state
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Personnel Modal state
  const [isPersonnelModalOpen, setIsPersonnelModalOpen] = useState(false);
  const [modalGroupId, setModalGroupId] = useState<string>('grp-jaktim-1');
  const [editingMember, setEditingMember] = useState<Personnel | null>(null);

  // Save data to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SCHEDULE, JSON.stringify(schedule));
    } catch (e) {
      console.error('Failed to save schedule', e);
    }
  }, [schedule]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    } catch (e) {
      console.error('Failed to save users', e);
    }
  }, [users]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 3000);
  };

  const handleOpenAddMember = (groupId: string) => {
    setModalGroupId(groupId);
    setEditingMember(null);
    setIsPersonnelModalOpen(true);
  };

  const handleEditMember = (groupId: string, member: Personnel) => {
    setModalGroupId(groupId);
    setEditingMember(member);
    setIsPersonnelModalOpen(true);
  };

  const handleSaveMember = (targetGroupId: string, memberData: Personnel) => {
    const updatedGroups = schedule.groups.map((grp) => {
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

    setSchedule({
      ...schedule,
      groups: updatedGroups
    });

    showToast(
      editingMember
        ? `Data ${memberData.name} berhasil diperbarui!`
        : `${memberData.name} berhasil ditambahkan ke tim!`
    );
  };

  const handleQuickCopy = () => {
    const text = formatStandbyScheduleToWA(schedule);
    navigator.clipboard.writeText(text);
    showToast(`Jadwal ${schedule.dayName || ''} ${schedule.date || '29-10-2026'} disalin ke Clipboard!`);
  };

  const handleResetData = () => {
    if (
      window.confirm(
        'Apakah Anda yakin ingin mengembalikan data ke jadwal awal 29-10-2026?'
      )
    ) {
      setSchedule(INITIAL_STANDBY_SCHEDULE);
      setUsers(INITIAL_APP_USERS);
      localStorage.removeItem(STORAGE_KEY_SCHEDULE);
      localStorage.removeItem(STORAGE_KEY_USERS);
      showToast('Data berhasil direset ke jadwal awal!');
    }
  };

  const handleRefreshData = () => {
    try {
      const savedSchedule = localStorage.getItem(STORAGE_KEY_SCHEDULE);
      if (savedSchedule) {
        setSchedule(JSON.parse(savedSchedule));
      }
      const savedUsers = localStorage.getItem(STORAGE_KEY_USERS);
      if (savedUsers) {
        setUsers(JSON.parse(savedUsers));
      }
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.error('Failed to refresh data', e);
    }
  };

  const currentDateDisplay = schedule.date || '29-10-2026';
  const currentDayDisplay = schedule.dayName ? `${schedule.dayName.toUpperCase()}, ` : '';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950 relative overflow-x-hidden">
      {/* Background Watermark Logo (Emblem) */}
      <div className="fixed inset-0 pointer-events-none z-0 flex items-center justify-center opacity-[0.07] select-none overflow-hidden p-4">
        <img
          src="/logo-emblem.png"
          alt="JADWAL STANDBY TEAM MBP DEPOTEL Background Emblem"
          className="w-[500px] h-[500px] sm:w-[700px] sm:h-[700px] object-contain drop-shadow-[0_0_50px_rgba(234,179,8,0.3)] animate-pulse duration-[5000ms]"
        />
      </div>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-emerald-600 text-white font-semibold text-xs px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 border border-emerald-400/30 animate-bounce">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-200" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main App Header */}
      <Header
        activeView={activeView}
        onSelectView={setActiveView}
        onQuickCopy={handleQuickCopy}
        onResetData={handleResetData}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 pb-24 sm:pb-28">
        {/* View Switcher */}
        {activeView === 'mbp_standby' && (
          <MBPStandbyView
            schedule={schedule}
            onUpdateSchedule={setSchedule}
            onOpenAddMember={handleOpenAddMember}
            onEditMember={handleEditMember}
            onShowToast={showToast}
          />
        )}

        {activeView === 'broadcast_wa' && (
          <BroadcastWAView
            schedule={schedule}
            onShowToast={showToast}
          />
        )}

        {activeView === 'settings' && (
          <SettingsView
            schedule={schedule}
            onUpdateSchedule={setSchedule}
            users={users}
            onUpdateUsers={setUsers}
            onResetAllData={handleResetData}
            onRefreshData={handleRefreshData}
            onShowToast={showToast}
          />
        )}
      </main>

      {/* FOOTER SECTION & STICKY BOTTOM NAVIGATION BAR */}
      <footer className="bg-slate-950 border-t border-slate-800 py-8 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
          {/* Main Footer Navigation Buttons */}
          <div className="p-4 bg-slate-900/90 border border-slate-800 rounded-2xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <span className="font-extrabold text-slate-100 text-sm block">
                  DEPOTEL INNER JAKTIM — MENU UTAMA
                </span>
                <span className="text-slate-400 text-xs font-mono">
                  {schedule.nopName || 'NOP SOUTHERN'} ({currentDayDisplay}{currentDateDisplay})
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
                <span>DEPOTEL INNER JAKTIM</span>
              </div>
              <p className="text-slate-400 text-xs leading-relaxed">
                Aplikasi Operasional Jadwal Standby Team MBP Depotel Inner Jakarta Timur NOP Southern.
              </p>
            </div>

            {/* Col 2: Navigation Links */}
            <div className="space-y-2">
              <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px] block">
                Navigasi Cepat Footer
              </span>
              <ul className="space-y-1.5 text-slate-400 text-xs font-medium">
                <li>
                  <button
                    onClick={() => setActiveView('mbp_standby')}
                    className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <Home className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Beranda Standby MBP</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveView('broadcast_wa')}
                    className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Generator Broadcast WA</span>
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
              © 2026 MBP Depotel Inner Jakarta Timur. All rights reserved.
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Terhubung WhatsApp</span>
            </div>
          </div>
        </div>
      </footer>

      {/* DOCKED FIXED BOTTOM NAVIGATION BAR FOR ALL DEVICES (DESKTOP & HP MOBILE) */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800/90 px-4 py-2 shadow-2xl flex items-center justify-center">
        <div className="max-w-md w-full flex items-center justify-around gap-2">
          <button
            type="button"
            onClick={() => setActiveView('mbp_standby')}
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none flex-1 active:scale-95 ${
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
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none flex-1 active:scale-95 ${
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
            className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer select-none flex-1 active:scale-95 ${
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
        groups={schedule.groups}
        editingMember={editingMember}
        onSave={handleSaveMember}
      />
    </div>
  );
}

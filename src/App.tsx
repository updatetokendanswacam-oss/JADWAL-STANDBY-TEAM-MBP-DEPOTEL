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

  const currentDateDisplay = schedule.date || '29-10-2026';
  const currentDayDisplay = schedule.dayName ? `${schedule.dayName.toUpperCase()}, ` : '';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
        {/* Navigation Tabs Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-2 rounded-2xl border border-slate-800">
          <div className="flex items-center gap-2 overflow-x-auto p-1">
            <button
              onClick={() => setActiveView('mbp_standby')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 ${
                activeView === 'mbp_standby'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Home className="w-4 h-4 text-emerald-300" />
              <span>Beranda Standby MBP ({currentDayDisplay}{currentDateDisplay})</span>
            </button>

            <button
              onClick={() => setActiveView('broadcast_wa')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 ${
                activeView === 'broadcast_wa'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <MessageCircle className="w-4 h-4 text-emerald-300" />
              <span>Generator Broadcast WA</span>
            </button>

            <button
              onClick={() => setActiveView('settings')}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all whitespace-nowrap shrink-0 ${
                activeView === 'settings'
                  ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-950/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <Settings className="w-4 h-4 text-slate-300" />
              <span>Pengaturan & Kelola User</span>
            </button>
          </div>

          <div className="text-xs text-slate-400 px-3 flex items-center gap-2 shrink-0">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-mono">{schedule.nopName || 'NOP SOUTHERN'} — INNER JAKTIM</span>
          </div>
        </div>

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
            onShowToast={showToast}
          />
        )}
      </main>

      {/* FOOTER SECTION */}
      <footer className="bg-slate-950 border-t border-slate-800 py-8 mt-16 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
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
                Navigasi Cepat
              </span>
              <ul className="space-y-1.5 text-slate-400 text-xs font-medium">
                <li>
                  <button
                    onClick={() => setActiveView('mbp_standby')}
                    className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                  >
                    <Home className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Beranda Standby MBP</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveView('broadcast_wa')}
                    className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                  >
                    <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Generator Broadcast WA</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setActiveView('settings')}
                    className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
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

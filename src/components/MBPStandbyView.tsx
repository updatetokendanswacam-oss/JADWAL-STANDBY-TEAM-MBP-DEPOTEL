import React, { useState, useEffect } from 'react';
import { StandbySchedule, MemberStatus, Personnel } from '../types';
import { KeteranganLegend } from './KeteranganLegend';
import { CalendarDatePickerModal } from './CalendarDatePickerModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import { useRealtimeClock } from '../hooks/useRealtimeClock';
import {
  formatStandbyScheduleToWA,
  getStatusEmoji,
  getPersonelWALink
} from '../utils/whatsappFormatter';
import {
  formatIndonesianDateFull,
  getIndonesianDayName
} from '../utils/dateUtils';
import {
  Users,
  Copy,
  Check,
  Plus,
  Phone,
  Trash2,
  Edit2,
  Calendar as CalendarIcon,
  MessageCircle,
  CornerDownLeft,
  Save,
  CheckCheck,
  Clock,
  Building2,
  Layers,
  RefreshCw,
  X
} from 'lucide-react';

interface MBPStandbyViewProps {
  innerSchedule: StandbySchedule;
  outerSchedule: StandbySchedule;
  onUpdateInnerSchedule: (newSchedule: StandbySchedule) => void;
  onUpdateOuterSchedule: (newSchedule: StandbySchedule) => void;
  onOpenAddMember: (scheduleId: string, groupId: string) => void;
  onEditMember: (scheduleId: string, groupId: string, member: Personnel) => void;
  onShowToast: (msg: string) => void;
}

interface PersonnelDeleteTarget {
  scheduleId: string;
  groupId: string;
  memberId: string;
  memberName: string;
}

export const MBPStandbyView: React.FC<MBPStandbyViewProps> = ({
  innerSchedule,
  outerSchedule,
  onUpdateInnerSchedule,
  onUpdateOuterSchedule,
  onOpenAddMember,
  onEditMember,
  onShowToast
}) => {
  const clock = useRealtimeClock();
  const [activeTab, setActiveTab] = useState<'all' | 'inner' | 'outer'>('all');
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [deletePersonnelTarget, setDeletePersonnelTarget] = useState<PersonnelDeleteTarget | null>(null);

  // Apply real-time date change across BOTH schedules automatically
  const handleDateChange = (newDateDDMMYYYY: string) => {
    const newDayName = getIndonesianDayName(newDateDDMMYYYY);

    const updateScheduleWithDate = (sched: StandbySchedule, defaultAreaName: string) => {
      let newTitle = sched.title || '';
      const oldDate = sched.date;

      // 1. Replace date in title
      const datePattern = /\d{1,2}-\d{1,2}-\d{4}/;
      if (oldDate && newTitle.includes(oldDate)) {
        newTitle = newTitle.replace(oldDate, newDateDDMMYYYY);
      } else if (datePattern.test(newTitle)) {
        newTitle = newTitle.replace(datePattern, newDateDDMMYYYY);
      } else {
        newTitle = `JADWAL STANDBY TEAM MBP *DEPOTEL* ${defaultAreaName} ${newDateDDMMYYYY}`;
      }

      return {
        ...sched,
        date: newDateDDMMYYYY,
        dayName: newDayName,
        title: newTitle
      };
    };

    onUpdateInnerSchedule(updateScheduleWithDate(innerSchedule, 'INNER JAKTIM'));
    onUpdateOuterSchedule(updateScheduleWithDate(outerSchedule, 'BEKASI'));

    onShowToast(`Tanggal semua list berhasil diperbarui ke: ${newDayName.toUpperCase()}, ${newDateDDMMYYYY}`);
  };

  const handleSetTodayRealtime = () => {
    handleDateChange(clock.dateStrDDMMYYYY);
  };

  const executeDeletePersonnel = () => {
    if (!deletePersonnelTarget) return;

    const { scheduleId, groupId, memberId, memberName } = deletePersonnelTarget;
    const isInner = scheduleId === innerSchedule.id;
    const targetSched = isInner ? innerSchedule : outerSchedule;
    const updateFn = isInner ? onUpdateInnerSchedule : onUpdateOuterSchedule;

    const updatedGroups = targetSched.groups.map((group) => {
      if (group.id !== groupId) return group;
      return {
        ...group,
        members: group.members.filter((m) => m.id !== memberId)
      };
    });

    updateFn({ ...targetSched, groups: updatedGroups });
    onShowToast(`${memberName} berhasil dihapus dari tim.`);
    setDeletePersonnelTarget(null);
  };

  return (
    <div className="space-y-8">
      {/* GLOBAL REALTIME CLOCK & CALENDAR TOOLBAR */}
      <div className="bg-slate-900/95 border border-amber-500/40 rounded-2xl p-4 sm:p-5 shadow-2xl space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Clock className="w-6 h-6 animate-spin text-amber-400" />
            </div>
            <div>
              <span className="text-[11px] font-extrabold text-amber-400 uppercase tracking-wider block flex items-center gap-1">
                JAM & WAKTU REAL-TIME (WIB):
              </span>
              <h2 className="text-base sm:text-lg font-black text-white font-mono tracking-tight">
                {clock.fullDisplay}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleSetTodayRealtime}
              className="min-h-[42px] px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer select-none"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Set Hari Ini Live ({clock.dateStrDDMMYYYY})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsCalendarModalOpen(true);
              }}
              className="min-h-[42px] px-3.5 py-2 bg-slate-950 border border-emerald-500/80 hover:border-emerald-400 text-emerald-300 font-mono font-bold text-xs rounded-xl transition-colors hover:bg-slate-900 flex items-center gap-2 cursor-pointer select-none"
            >
              <CalendarIcon className="w-4 h-4 text-emerald-400" />
              <span>Atur Tanggal Kalender</span>
            </button>
          </div>
        </div>

        {/* LIST SWITCHER / FILTER TABS */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
            <Layers className="w-4 h-4 text-emerald-400" />
            <span>TAMPILKAN LIST DI BERANDA:</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer select-none ${
                activeTab === 'all'
                  ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400'
                  : 'bg-slate-950 text-slate-300 border border-slate-800 hover:bg-slate-800'
              }`}
            >
              SEMUA LIST (2)
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('inner')}
              className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer select-none ${
                activeTab === 'inner'
                  ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400'
                  : 'bg-slate-950 text-slate-300 border border-slate-800 hover:bg-slate-800'
              }`}
            >
              INNER JAKTIM
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('outer')}
              className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer select-none ${
                activeTab === 'outer'
                  ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400'
                  : 'bg-slate-950 text-slate-300 border border-slate-800 hover:bg-slate-800'
              }`}
            >
              BEKASI
            </button>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 1. JADWAL STANDBY TEAM MBP DEPOTEL INNER JAKTIM */}
      {/* ======================================================== */}
      {(activeTab === 'all' || activeTab === 'inner') && (
        <SingleScheduleSection
          schedule={innerSchedule}
          listTitleLabel="DEPOTEL INNER JAKTIM"
          headingTitle={innerSchedule.headerTitle || "JADWAL STANDBY TEAM MBP DEPOTEL INNER JAKTIM"}
          badgeBg="bg-amber-500/10 border-amber-500/30 text-amber-400"
          onUpdateSchedule={onUpdateInnerSchedule}
          onOpenAddMember={(groupId) => onOpenAddMember(innerSchedule.id, groupId)}
          onEditMember={(groupId, member) => onEditMember(innerSchedule.id, groupId, member)}
          onPromptDelete={(groupId, memberId, memberName) =>
            setDeletePersonnelTarget({ scheduleId: innerSchedule.id, groupId, memberId, memberName })
          }
          onOpenCalendarModal={() => setIsCalendarModalOpen(true)}
          onShowToast={onShowToast}
        />
      )}

      {/* ======================================================== */}
      {/* 2. JADWAL STANDBY TEAM MBP DEPOTEL BEKASI */}
      {/* ======================================================== */}
      {(activeTab === 'all' || activeTab === 'outer') && (
        <SingleScheduleSection
          schedule={outerSchedule}
          listTitleLabel="DEPOTEL BEKASI"
          headingTitle={outerSchedule.headerTitle || "JADWAL STANDBY TEAM MBP DEPOTEL BEKASI"}
          badgeBg="bg-blue-500/10 border-blue-500/30 text-blue-400"
          onUpdateSchedule={onUpdateOuterSchedule}
          onOpenAddMember={(groupId) => onOpenAddMember(outerSchedule.id, groupId)}
          onEditMember={(groupId, member) => onEditMember(outerSchedule.id, groupId, member)}
          onPromptDelete={(groupId, memberId, memberName) =>
            setDeletePersonnelTarget({ scheduleId: outerSchedule.id, groupId, memberId, memberName })
          }
          onOpenCalendarModal={() => setIsCalendarModalOpen(true)}
          onShowToast={onShowToast}
        />
      )}

      <KeteranganLegend />

      {/* Visual Calendar Date Picker Modal */}
      <CalendarDatePickerModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        currentDateDDMMYYYY={innerSchedule.date || clock.dateStrDDMMYYYY}
        onSelectDate={handleDateChange}
      />

      {/* Personnel Delete Modal */}
      <ConfirmDeleteModal
        isOpen={!!deletePersonnelTarget}
        title="Hapus Personel"
        message={`Apakah Anda yakin ingin menghapus personel "${deletePersonnelTarget?.memberName}"?`}
        onConfirm={executeDeletePersonnel}
        onCancel={() => setDeletePersonnelTarget(null)}
      />
    </div>
  );
};

/* COMPONENT UNTUK MASING-MASING LIST (INNER JAKTIM / BEKASI) */
interface SingleScheduleSectionProps {
  schedule: StandbySchedule;
  listTitleLabel: string;
  headingTitle: string;
  badgeBg: string;
  onUpdateSchedule: (newSchedule: StandbySchedule) => void;
  onOpenAddMember: (groupId: string) => void;
  onEditMember: (groupId: string, member: Personnel) => void;
  onPromptDelete: (groupId: string, memberId: string, memberName: string) => void;
  onOpenCalendarModal: () => void;
  onShowToast: (msg: string) => void;
}

const SingleScheduleSection: React.FC<SingleScheduleSectionProps> = ({
  schedule,
  listTitleLabel,
  headingTitle,
  badgeBg,
  onUpdateSchedule,
  onOpenAddMember,
  onEditMember,
  onPromptDelete,
  onOpenCalendarModal,
  onShowToast
}) => {
  const [copied, setCopied] = useState(false);
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const currentHeading = schedule.headerTitle || headingTitle;
  const [isEditingHeading, setIsEditingHeading] = useState(false);
  const [tempHeading, setTempHeading] = useState(currentHeading);

  useEffect(() => {
    setTempHeading(schedule.headerTitle || headingTitle);
  }, [schedule.headerTitle, headingTitle]);

  const handleSaveHeading = () => {
    if (!tempHeading.trim()) return;
    const newHeading = tempHeading.trim();
    onUpdateSchedule({
      ...schedule,
      headerTitle: newHeading
    });
    setIsEditingHeading(false);
    onShowToast(`Judul list berhasil disimpan: "${newHeading}"`);
  };

  // State for editing NOP name (e.g. Semua Kelompok NOP)
  const [isEditingNop, setIsEditingNop] = useState(false);
  const [tempNopName, setTempNopName] = useState(schedule.nopName);

  // State for editing group name
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [tempGroupName, setTempGroupName] = useState('');

  useEffect(() => {
    setTempNopName(schedule.nopName);
  }, [schedule.nopName]);

  const handleSaveNopName = () => {
    if (!tempNopName.trim()) return;
    const newNop = tempNopName.trim().toUpperCase();
    onUpdateSchedule({
      ...schedule,
      nopName: newNop
    });
    setIsEditingNop(false);
    onShowToast(`Nama NOP berhasil disimpan: "${newNop}"`);
  };

  const handleSaveGroupName = () => {
    if (!editingGroupId || !tempGroupName.trim()) return;
    const newName = tempGroupName.trim().toUpperCase();
    const updatedGroups = schedule.groups.map((g) =>
      g.id === editingGroupId ? { ...g, groupName: newName } : g
    );
    onUpdateSchedule({
      ...schedule,
      groups: updatedGroups
    });
    setEditingGroupId(null);
    onShowToast(`Nama kelompok berhasil diubah menjadi: "${newName}"`);
  };

  const allMembers = schedule.groups.flatMap((g) => g.members);
  const totalPersonel = allMembers.length;
  const totalStandby = allMembers.filter((m) => m.status === 'standby').length;
  const totalIjinSakit = allMembers.filter((m) => m.status === 'ijin_sakit').length;
  const totalOff = allMembers.filter((m) => m.status === 'off').length;

  const currentDateStr = schedule.date || '29-10-2026';
  const currentDayName = schedule.dayName || getIndonesianDayName(currentDateStr);

  const handleAddEnterToTitle = () => {
    onUpdateSchedule({
      ...schedule,
      title: `${schedule.title}\n`,
      isCustomTitle: true
    });
    setIsEditingTitle(true);
    onShowToast('Baris baru (Enter) ditambahkan!');
  };

  const handleSaveCustomTitle = (newTitleValue: string) => {
    onUpdateSchedule({
      ...schedule,
      title: newTitleValue,
      isCustomTitle: true
    });
    setIsEditingTitle(false);
    onShowToast('Judul Laporan disimpan secara permanen!');
  };

  const handleSingleClickStatusChange = (
    groupId: string,
    memberId: string,
    newStatus: MemberStatus
  ) => {
    const updatedGroups = schedule.groups.map((group) => {
      if (group.id !== groupId) return group;
      return {
        ...group,
        members: group.members.map((member) => {
          if (member.id !== memberId) return member;
          return { ...member, status: newStatus };
        })
      };
    });

    onUpdateSchedule({ ...schedule, groups: updatedGroups });
    const statusNames: Record<MemberStatus, string> = {
      standby: 'STANDBY 🟢',
      ijin_sakit: 'IJIN/SAKIT 🟡',
      off: 'OFF 🔴'
    };
    onShowToast(`Status ${memberId} diperbarui ke ${statusNames[newStatus]}`);
  };

  const handleCycleStatus = (groupId: string, memberId: string, currentStatus: MemberStatus) => {
    const cycleMap: Record<MemberStatus, MemberStatus> = {
      standby: 'off',
      off: 'ijin_sakit',
      ijin_sakit: 'standby'
    };
    handleSingleClickStatusChange(groupId, memberId, cycleMap[currentStatus]);
  };

  const handleCopyWA = () => {
    const text = formatStandbyScheduleToWA(schedule);
    navigator.clipboard.writeText(text);
    setCopied(true);
    onShowToast(`Jadwal ${schedule.nopName} disalin ke Clipboard!`);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleShareWA = () => {
    const text = formatStandbyScheduleToWA(schedule);
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handleBulkSetStatus = (status: MemberStatus) => {
    const updatedGroups = schedule.groups.map((group) => ({
      ...group,
      members: group.members.map((m) => ({ ...m, status }))
    }));
    onUpdateSchedule({ ...schedule, groups: updatedGroups });
    onShowToast(`Semua personel ${schedule.nopName} diubah ke ${status.toUpperCase()}`);
  };

  const filteredGroups = schedule.groups
    .filter((grp) => filterGroup === 'all' || grp.id === filterGroup)
    .map((grp) => ({
      ...grp,
      members: grp.members.filter((m) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
          m.name.toLowerCase().includes(q) ||
          m.phone.includes(q) ||
          m.status.toLowerCase().includes(q)
        );
      })
    }));

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-7 shadow-2xl space-y-6">
      {/* HEADER TIER BADGE */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl overflow-hidden border border-amber-500/80 p-0.5 bg-slate-950 shadow-lg shrink-0">
            <img
              src="/logo-emblem.png"
              alt="Logo Emblem"
              className="w-full h-full object-cover rounded-xl"
            />
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`px-3 py-0.5 rounded-full text-[11px] font-black tracking-wider uppercase border ${badgeBg}`}
              >
                {listTitleLabel}
              </span>
              <button
                type="button"
                onClick={() => {
                  setTempNopName(schedule.nopName);
                  setIsEditingNop(true);
                }}
                title="Klik untuk ubah nama NOP ini"
                className="text-xs text-amber-400 font-mono font-bold hover:underline flex items-center gap-1 cursor-pointer group"
              >
                <span>({schedule.nopName})</span>
                <Edit2 className="w-3 h-3 opacity-70 group-hover:opacity-100" />
              </button>
            </div>
            {isEditingHeading ? (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 mt-1">
                <input
                  type="text"
                  value={tempHeading}
                  onChange={(e) => setTempHeading(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSaveHeading();
                    } else if (e.key === 'Escape') {
                      setIsEditingHeading(false);
                    }
                  }}
                  autoFocus
                  placeholder="Masukkan judul list..."
                  className="px-3.5 py-2 bg-slate-950 border-2 border-emerald-500 rounded-xl text-sm sm:text-base font-black text-white placeholder-slate-500 focus:outline-none shadow-inner min-w-[280px]"
                />
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleSaveHeading}
                    className="min-h-[38px] px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                  >
                    <Check className="w-4 h-4" />
                    <span>Simpan</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTempHeading(currentHeading);
                      setIsEditingHeading(false);
                    }}
                    className="min-h-[38px] px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all"
                  >
                    <X className="w-4 h-4" />
                    <span>Batal</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2.5 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {currentHeading}
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    setTempHeading(currentHeading);
                    setIsEditingHeading(true);
                  }}
                  title="Ubah Judul List Ini"
                  className="p-1.5 sm:px-2.5 sm:py-1 rounded-xl bg-slate-800/90 hover:bg-emerald-600 text-slate-300 hover:text-white border border-slate-700 hover:border-emerald-500 transition-all cursor-pointer shadow-md active:scale-95 flex items-center gap-1.5 group select-none"
                >
                  <Edit2 className="w-3.5 h-3.5 text-emerald-400 group-hover:text-white transition-colors" />
                  <span className="text-[11px] font-bold text-slate-300 group-hover:text-white">Edit Judul</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* METRICS STATS MINI BAR */}
        <div className="flex items-center gap-2 overflow-x-auto p-1 bg-slate-950 border border-slate-800 rounded-2xl shrink-0">
          <div className="px-3 py-1.5 text-center">
            <span className="text-[10px] text-slate-400 uppercase font-bold block">Total</span>
            <span className="text-sm font-mono font-extrabold text-white">{totalPersonel}</span>
          </div>
          <div className="px-3 py-1.5 text-center border-l border-slate-800">
            <span className="text-[10px] text-emerald-400 uppercase font-bold block">🟢 Standby</span>
            <span className="text-sm font-mono font-extrabold text-emerald-300">{totalStandby}</span>
          </div>
          <div className="px-3 py-1.5 text-center border-l border-slate-800">
            <span className="text-[10px] text-amber-400 uppercase font-bold block">🟡 Ijin</span>
            <span className="text-sm font-mono font-extrabold text-amber-300">{totalIjinSakit}</span>
          </div>
          <div className="px-3 py-1.5 text-center border-l border-slate-800">
            <span className="text-[10px] text-red-400 uppercase font-bold block">🔴 Off</span>
            <span className="text-sm font-mono font-extrabold text-red-300">{totalOff}</span>
          </div>
        </div>
      </div>

      {/* EDITABLE FORMAT WA TITLE BAR & ENTER SUPPORT */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-300">Format Judul WA:</span>
            {schedule.isCustomTitle && (
              <span className="text-[10px] px-2 py-0.5 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded font-mono font-bold flex items-center gap-1">
                <CheckCheck className="w-3 h-3" />
                Permanen
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleAddEnterToTitle}
              className="min-h-[36px] px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-emerald-400 rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-1 transition-colors select-none cursor-pointer"
            >
              <CornerDownLeft className="w-3.5 h-3.5" />
              <span>+ Enter</span>
            </button>

            <button
              type="button"
              onClick={onOpenCalendarModal}
              className="min-h-[36px] px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-200 rounded-xl text-xs font-bold border border-slate-700 flex items-center gap-1 transition-colors select-none cursor-pointer"
            >
              <CalendarIcon className="w-3.5 h-3.5 text-emerald-400" />
              <span>{currentDayName.toUpperCase()}, {currentDateStr}</span>
            </button>
          </div>
        </div>

        {isEditingTitle ? (
          <div className="flex items-center gap-2">
            <textarea
              rows={2}
              value={schedule.title}
              onChange={(e) =>
                onUpdateSchedule({ ...schedule, title: e.target.value, isCustomTitle: true })
              }
              className="px-3.5 py-2.5 bg-slate-900 border border-emerald-500 rounded-xl text-xs font-mono text-emerald-300 flex-1 focus:outline-none resize-y"
            />
            <button
              type="button"
              onClick={() => handleSaveCustomTitle(schedule.title)}
              className="min-h-[42px] px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shrink-0 flex items-center gap-1 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Simpan</span>
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3">
            <div className="text-xs font-mono font-extrabold text-slate-200 bg-slate-900 px-3.5 py-2.5 rounded-xl border border-slate-800 flex-1 whitespace-pre-wrap leading-relaxed">
              {schedule.title}
            </div>
            <button
              type="button"
              onClick={() => setIsEditingTitle(true)}
              className="min-h-[40px] px-3 py-2 text-xs font-bold text-emerald-400 hover:underline shrink-0 flex items-center gap-1 cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit</span>
            </button>
          </div>
        )}

        {/* Action Buttons: Copy WA & Send WA */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={handleCopyWA}
            className="min-h-[40px] px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition-colors cursor-pointer select-none"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-emerald-400" />}
            <span>{copied ? 'Tersalin!' : `Salin ${schedule.nopName}`}</span>
          </button>

          <button
            type="button"
            onClick={handleShareWA}
            className="min-h-[40px] px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/50 flex items-center gap-1.5 transition-colors cursor-pointer select-none"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Kirim Laporan ke WhatsApp</span>
          </button>
        </div>
      </div>

      {/* SEARCH, FILTER, AND BULK STATUS TOOLBAR */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder={`Cari personel di ${schedule.nopName}...`}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="min-h-[40px] px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-full sm:w-56 font-medium"
          />

          <div className="flex items-center gap-1.5">
            <select
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
              className="min-h-[40px] px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-semibold cursor-pointer max-w-[280px] truncate"
            >
              <option value="all">Semua Kelompok ({schedule.nopName})</option>
              {schedule.groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.groupName}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => {
                if (filterGroup === 'all') {
                  setTempNopName(schedule.nopName);
                  setIsEditingNop(!isEditingNop);
                  setEditingGroupId(null);
                } else {
                  const targetGroup = schedule.groups.find((g) => g.id === filterGroup);
                  if (targetGroup) {
                    setEditingGroupId(targetGroup.id);
                    setTempGroupName(targetGroup.groupName);
                    setIsEditingNop(false);
                  }
                }
              }}
              title={
                filterGroup === 'all'
                  ? `Ubah Nama NOP / Judul (${schedule.nopName})`
                  : `Ubah Nama Kelompok Ini`
              }
              className="min-h-[40px] px-2.5 py-2 bg-slate-900 hover:bg-emerald-600 text-slate-300 hover:text-white rounded-xl border border-slate-700 hover:border-emerald-500 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm active:scale-95 select-none shrink-0"
            >
              <Edit2 className="w-3.5 h-3.5 text-emerald-400 group-hover:text-white" />
              <span className="text-xs font-bold hidden sm:inline">
                {filterGroup === 'all' ? 'Edit Judul NOP' : 'Edit Kelompok'}
              </span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-[11px] font-bold text-slate-400 uppercase shrink-0">
            Set Semua ({schedule.nopName}):
          </span>
          <button
            type="button"
            onClick={() => handleBulkSetStatus('standby')}
            className="min-h-[36px] px-3 py-1.5 text-xs font-bold bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/50 text-emerald-300 rounded-lg transition-colors whitespace-nowrap cursor-pointer select-none"
          >
            🟢 Standby
          </button>
          <button
            type="button"
            onClick={() => handleBulkSetStatus('off')}
            className="min-h-[36px] px-3 py-1.5 text-xs font-bold bg-red-950/80 hover:bg-red-900 border border-red-700/50 text-red-300 rounded-lg transition-colors whitespace-nowrap cursor-pointer select-none"
          >
            🔴 Off
          </button>
          <button
            type="button"
            onClick={() => handleBulkSetStatus('ijin_sakit')}
            className="min-h-[36px] px-3 py-1.5 text-xs font-bold bg-amber-950/80 hover:bg-amber-900 border border-amber-700/50 text-amber-300 rounded-lg transition-colors whitespace-nowrap cursor-pointer select-none"
          >
            🟡 Ijin/Sakit
          </button>
        </div>
      </div>

      {/* INLINE EDITOR FOR NOP NAME (SEPERTI DI GAMBAR DROPDOWN) */}
      {isEditingNop && (
        <div className="p-3 bg-slate-950 border-2 border-emerald-500/80 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xl">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xs font-black text-amber-400 font-mono uppercase whitespace-nowrap">
              Ubah Nama NOP:
            </span>
            <input
              type="text"
              value={tempNopName}
              onChange={(e) => setTempNopName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveNopName();
                if (e.key === 'Escape') setIsEditingNop(false);
              }}
              autoFocus
              placeholder="misal: NOP SOUTHERN"
              className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono font-black text-white uppercase focus:outline-none focus:border-emerald-500 flex-1"
            />
          </div>
          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={handleSaveNopName}
              className="min-h-[36px] px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Simpan NOP</span>
            </button>
            <button
              type="button"
              onClick={() => setIsEditingNop(false)}
              className="min-h-[36px] px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
            >
              <X className="w-4 h-4" />
              <span>Batal</span>
            </button>
          </div>
        </div>
      )}

      {/* INLINE EDITOR FOR SELECTED GROUP NAME */}
      {editingGroupId && (
        <div className="p-3 bg-slate-950 border-2 border-emerald-500/80 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-xl">
          <div className="flex items-center gap-2 flex-1">
            <span className="text-xs font-black text-amber-400 font-mono uppercase whitespace-nowrap">
              Ubah Nama Kelompok:
            </span>
            <input
              type="text"
              value={tempGroupName}
              onChange={(e) => setTempGroupName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSaveGroupName();
                if (e.key === 'Escape') setEditingGroupId(null);
              }}
              autoFocus
              placeholder="misal: TO JAKTIM 1"
              className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-mono font-black text-white uppercase focus:outline-none focus:border-emerald-500 flex-1"
            />
          </div>
          <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
            <button
              type="button"
              onClick={handleSaveGroupName}
              className="min-h-[36px] px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Simpan Kelompok</span>
            </button>
            <button
              type="button"
              onClick={() => setEditingGroupId(null)}
              className="min-h-[36px] px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl flex items-center gap-1 cursor-pointer active:scale-95 transition-all"
            >
              <X className="w-4 h-4" />
              <span>Batal</span>
            </button>
          </div>
        </div>
      )}

      {/* GROUPS AND PERSONNEL CARDS */}
      <div className="space-y-5">
        {filteredGroups.map((group) => (
          <div
            key={group.id}
            className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-lg"
          >
            {/* Group Header */}
            <div className="bg-slate-900/90 px-5 py-3 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                <h3 className="text-sm sm:text-base font-black text-slate-100 font-mono tracking-wider uppercase">
                  {group.groupName} :
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    setEditingGroupId(group.id);
                    setTempGroupName(group.groupName);
                    setIsEditingNop(false);
                  }}
                  title={`Ubah nama kelompok ${group.groupName}`}
                  className="p-1 text-slate-400 hover:text-emerald-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs text-slate-400 font-mono bg-slate-950 px-2.5 py-0.5 rounded-full border border-slate-800">
                  {group.members.length} Personel
                </span>
              </div>

              <button
                type="button"
                onClick={() => onOpenAddMember(group.id)}
                className="min-h-[36px] flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-xl transition-colors cursor-pointer select-none"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>+ Personel</span>
              </button>
            </div>

            {/* Member List */}
            <div className="divide-y divide-slate-800/80">
              {group.members.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-xs">
                  Tidak ada personel di kelompok ini.
                </div>
              ) : (
                group.members.map((member, index) => {
                  const statusEmoji = getStatusEmoji(member.status);
                  const waChatLink = getPersonelWALink(
                    member.phone,
                    member.name,
                    member.status,
                    `${currentDayName.toUpperCase()}, ${currentDateStr}`
                  );

                  return (
                    <div
                      key={member.id}
                      className="p-4 hover:bg-slate-900/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-bold font-mono text-slate-500 w-5 shrink-0">
                          {index + 1}.
                        </span>

                        <button
                          type="button"
                          onClick={() => handleCycleStatus(group.id, member.id, member.status)}
                          title="Klik untuk ganti status (STANDBY -> OFF -> IJIN)"
                          className="text-2xl shrink-0 p-1.5 rounded-xl hover:bg-slate-800 transition-transform active:scale-110 select-none min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
                        >
                          {statusEmoji}
                        </button>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-slate-100 text-sm sm:text-base font-sans tracking-tight">
                              {member.name}
                            </span>
                            <span className="text-slate-500 text-xs font-mono">☆</span>

                            <a
                              href={`tel:${member.phone}`}
                              className="text-slate-300 hover:underline font-mono text-xs flex items-center gap-1 py-0.5"
                            >
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              {member.phone}
                            </a>

                            <a
                              href={waChatLink}
                              target="_blank"
                              rel="noreferrer"
                              title={`Chat WA dengan ${member.name}`}
                              className="px-2.5 py-0.5 bg-emerald-950 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-400 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors min-h-[28px]"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>Chat WA</span>
                            </a>
                          </div>

                          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                            <span>Status:</span>
                            <span
                              className={`font-semibold capitalize px-2 py-0.5 rounded text-[10px] ${
                                member.status === 'standby'
                                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800/50'
                                  : member.status === 'off'
                                  ? 'bg-red-950 text-red-300 border border-red-800/50'
                                  : 'bg-amber-950 text-amber-300 border border-amber-800/50'
                              }`}
                            >
                              {member.status === 'ijin_sakit' ? 'ijin/sakit' : member.status}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* 1-CLICK STATUS SWITCHER AND ACTIONS */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleSingleClickStatusChange(group.id, member.id, 'off')}
                          className={`min-h-[42px] px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1 border cursor-pointer select-none ${
                            member.status === 'off'
                              ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-950/50 ring-2 ring-red-500/30'
                              : 'bg-slate-900/80 hover:bg-red-950/50 text-slate-300 border-slate-800'
                          }`}
                        >
                          <span>🔴</span>
                          <span>OFF</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleSingleClickStatusChange(group.id, member.id, 'ijin_sakit')
                          }
                          className={`min-h-[42px] px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1 border cursor-pointer select-none ${
                            member.status === 'ijin_sakit'
                              ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-950/50 ring-2 ring-amber-500/30'
                              : 'bg-slate-900/80 hover:bg-amber-950/50 text-slate-300 border-slate-800'
                          }`}
                        >
                          <span>🟡</span>
                          <span>IJIN</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleSingleClickStatusChange(group.id, member.id, 'standby')
                          }
                          className={`min-h-[42px] px-3 py-1.5 text-xs font-bold rounded-xl transition-all flex items-center gap-1 border cursor-pointer select-none ${
                            member.status === 'standby'
                              ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950/50 ring-2 ring-emerald-500/30'
                              : 'bg-slate-900/80 hover:bg-emerald-950/50 text-slate-300 border-slate-800'
                          }`}
                        >
                          <span>🟢</span>
                          <span>STANDBY</span>
                        </button>

                        <div className="flex items-center gap-1 ml-1 pl-1 border-l border-slate-800">
                          <button
                            type="button"
                            onClick={() => onEditMember(group.id, member)}
                            title="Edit Data Personel"
                            className="min-h-[42px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => onPromptDelete(group.id, member.id, member.name)}
                            title="Hapus Personel"
                            className="min-h-[42px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

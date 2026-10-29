import React, { useState } from 'react';
import { StandbySchedule, MemberStatus, Personnel } from '../types';
import { KeteranganLegend } from './KeteranganLegend';
import { CalendarDatePickerModal } from './CalendarDatePickerModal';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import {
  formatStandbyScheduleToWA,
  getStatusEmoji,
  getPersonelWALink
} from '../utils/whatsappFormatter';
import {
  formatIndonesianDateFull,
  getIndonesianDayName,
  buildScheduleTitleWithDay
} from '../utils/dateUtils';
import {
  Users,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  Plus,
  Phone,
  Trash2,
  Edit2,
  Calendar as CalendarIcon,
  Settings2,
  MessageCircle,
  CornerDownLeft,
  Save,
  CheckCheck
} from 'lucide-react';

interface MBPStandbyViewProps {
  schedule: StandbySchedule;
  onUpdateSchedule: (newSchedule: StandbySchedule) => void;
  onOpenAddMember: (groupId: string) => void;
  onEditMember: (groupId: string, member: Personnel) => void;
  onShowToast: (msg: string) => void;
}

interface PersonnelDeleteTarget {
  groupId: string;
  memberId: string;
  memberName: string;
}

export const MBPStandbyView: React.FC<MBPStandbyViewProps> = ({
  schedule,
  onUpdateSchedule,
  onOpenAddMember,
  onEditMember,
  onShowToast
}) => {
  const [copied, setCopied] = useState(false);
  const [filterGroup, setFilterGroup] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [deletePersonnelTarget, setDeletePersonnelTarget] = useState<PersonnelDeleteTarget | null>(null);

  // Calculate Personel Metrics
  const allMembers = schedule.groups.flatMap((g) => g.members);
  const totalPersonel = allMembers.length;
  const totalStandby = allMembers.filter((m) => m.status === 'standby').length;
  const totalIjinSakit = allMembers.filter((m) => m.status === 'ijin_sakit').length;
  const totalOff = allMembers.filter((m) => m.status === 'off').length;

  // Current formatted date & day
  const currentDateStr = schedule.date || '29-10-2026';
  const currentDayName = schedule.dayName || getIndonesianDayName(currentDateStr);
  const fullIndonesianDate = formatIndonesianDateFull(currentDateStr);

  // SMART DATE UPDATE (PRESERVES CUSTOM PERMANENT TITLE FORMATTING)
  const handleDateChange = (newDateDDMMYYYY: string) => {
    const newDayName = getIndonesianDayName(newDateDDMMYYYY);
    const oldDateStr = schedule.date;
    const oldDayName = schedule.dayName;

    let newTitle = schedule.title;

    if (schedule.isCustomTitle) {
      if (oldDateStr && newTitle.includes(oldDateStr)) {
        newTitle = newTitle.replace(oldDateStr, newDateDDMMYYYY);
      } else {
        const datePattern = /\d{1,2}-\d{1,2}-\d{4}/;
        if (datePattern.test(newTitle)) {
          newTitle = newTitle.replace(datePattern, newDateDDMMYYYY);
        }
      }

      if (oldDayName && newTitle.toLowerCase().includes(oldDayName.toLowerCase())) {
        const regexDay = new RegExp(oldDayName, 'gi');
        newTitle = newTitle.replace(regexDay, newDayName.toUpperCase());
      }
    } else {
      newTitle = buildScheduleTitleWithDay(newDateDDMMYYYY);
    }

    onUpdateSchedule({
      ...schedule,
      date: newDateDDMMYYYY,
      dayName: newDayName,
      title: newTitle
    });

    onShowToast(`Tanggal berhasil diupdate ke: ${newDayName.toUpperCase()}, ${newDateDDMMYYYY}`);
  };

  const handleAddEnterToTitle = () => {
    onUpdateSchedule({
      ...schedule,
      title: `${schedule.title}\n`,
      isCustomTitle: true
    });
    setIsEditingTitle(true);
    onShowToast('Baris baru (Enter) ditambahkan & disimpan permanen!');
  };

  const handleSaveCustomTitle = (newTitleValue: string) => {
    onUpdateSchedule({
      ...schedule,
      title: newTitleValue,
      isCustomTitle: true
    });
    setIsEditingTitle(false);
    onShowToast('Judul Laporan Format WA disimpan secara permanen!');
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
    onShowToast(`Status diperbarui ke ${statusNames[newStatus]}`);
  };

  const handleCycleStatus = (groupId: string, memberId: string, currentStatus: MemberStatus) => {
    const cycleMap: Record<MemberStatus, MemberStatus> = {
      standby: 'off',
      off: 'ijin_sakit',
      ijin_sakit: 'standby'
    };
    handleSingleClickStatusChange(groupId, memberId, cycleMap[currentStatus]);
  };

  const promptDeleteMember = (groupId: string, memberId: string, memberName: string) => {
    setDeletePersonnelTarget({
      groupId,
      memberId,
      memberName
    });
  };

  const executeDeletePersonnel = () => {
    if (!deletePersonnelTarget) return;

    const { groupId, memberId, memberName } = deletePersonnelTarget;
    const updatedGroups = schedule.groups.map((group) => {
      if (group.id !== groupId) return group;
      return {
        ...group,
        members: group.members.filter((m) => m.id !== memberId)
      };
    });

    onUpdateSchedule({ ...schedule, groups: updatedGroups });
    onShowToast(`${memberName} berhasil dihapus dari tim.`);
    setDeletePersonnelTarget(null);
  };

  const handleCopyWA = () => {
    const text = formatStandbyScheduleToWA(schedule);
    navigator.clipboard.writeText(text);
    setCopied(true);
    onShowToast(`Jadwal ${currentDayName} ${currentDateStr} disalin ke Clipboard!`);
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
    onShowToast(`Semua personel diubah ke status ${status.toUpperCase()}`);
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
    <div className="space-y-6">
      {/* DATE SETTING TOOLBAR */}
      <div className="bg-slate-900/90 border border-emerald-500/30 rounded-2xl p-4 sm:p-5 shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCalendarModalOpen(true)}
              className="min-h-[44px] px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 font-bold text-xs shrink-0 select-none cursor-pointer"
              title="Buka Kalender Manual"
            >
              <CalendarIcon className="w-5 h-5 pointer-events-none" />
              <span>Buka Kalender</span>
            </button>
            <div>
              <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
                SETTING TANGGAL & HARI KALENDER
              </span>
              <h3 className="text-base font-bold text-white capitalize">
                {fullIndonesianDate}
              </h3>
            </div>
          </div>

          {/* Calendar Picker Trigger Badge */}
          <div className="flex items-center gap-2 self-start sm:self-center">
            <button
              onClick={() => setIsCalendarModalOpen(true)}
              className="min-h-[44px] px-4 py-2 bg-slate-950 border border-emerald-500/80 hover:border-emerald-400 rounded-xl text-xs font-mono font-bold text-emerald-300 focus:outline-none flex items-center gap-2 shadow-sm transition-colors hover:bg-slate-900 select-none cursor-pointer"
            >
              <Settings2 className="w-4 h-4 text-emerald-400 pointer-events-none" />
              <span>{currentDayName.toUpperCase()}, {currentDateStr}</span>
            </button>
          </div>
        </div>

        {/* JUDUL LAPORAN FORMAT WA WITH ENTER ICON (↵) AND PERMANENT PERSISTENCE */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
          <div className="flex items-center justify-between sm:justify-start gap-2 shrink-0">
            <span className="text-xs font-semibold text-slate-400 flex items-center gap-1">
              <span>Judul Laporan Format WA:</span>
              {schedule.isCustomTitle && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/80 font-mono font-bold flex items-center gap-1">
                  <CheckCheck className="w-3 h-3 text-emerald-400" />
                  Permanen
                </span>
              )}
            </span>

            {/* ENTER / NEWLINE ICON BUTTON */}
            <button
              type="button"
              onClick={handleAddEnterToTitle}
              className="min-h-[36px] px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-lg text-xs font-bold border border-slate-700 flex items-center gap-1 transition-colors select-none cursor-pointer"
              title="Tambah Baris Baru / Enter Ke Bawah"
            >
              <CornerDownLeft className="w-3.5 h-3.5 text-emerald-400 pointer-events-none" />
              <span>+ Enter</span>
            </button>
          </div>

          {isEditingTitle ? (
            <div className="flex items-center gap-2 flex-1">
              <textarea
                rows={2}
                value={schedule.title}
                onChange={(e) =>
                  onUpdateSchedule({ ...schedule, title: e.target.value, isCustomTitle: true })
                }
                className="px-3 py-2 bg-slate-950 border border-emerald-500 rounded-lg text-xs font-mono text-emerald-300 flex-1 focus:outline-none resize-y min-h-[44px]"
              />
              <button
                type="button"
                onClick={() => handleSaveCustomTitle(schedule.title)}
                className="min-h-[44px] px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shrink-0 flex items-center gap-1 shadow-md select-none cursor-pointer"
              >
                <Save className="w-3.5 h-3.5 pointer-events-none" />
                <span>Simpan</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="text-xs font-mono font-bold text-slate-200 bg-slate-950 px-3 py-2 rounded-lg border border-slate-800 flex-1 whitespace-pre-wrap min-h-[40px] flex items-center">
                {schedule.title}
              </div>
              <button
                type="button"
                onClick={() => setIsEditingTitle(true)}
                className="min-h-[40px] text-xs font-semibold text-emerald-400 hover:underline shrink-0 px-2 flex items-center select-none cursor-pointer"
              >
                <Edit2 className="w-3.5 h-3.5 mr-1 pointer-events-none" />
                Edit Judul
              </button>
            </div>
          )}
        </div>
      </div>

      {/* HEADER STATS CARDS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg text-blue-400 shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold tracking-wider text-slate-400 uppercase block">
              TOTAL PERSONEL
            </span>
            <span className="text-2xl font-bold font-mono text-white tracking-tight">
              {totalPersonel} <span className="text-xs font-sans text-slate-400">Orang</span>
            </span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-emerald-900/50 rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-400 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold tracking-wider text-emerald-400 uppercase block">
              🟢 STANDBY
            </span>
            <span className="text-2xl font-bold font-mono text-emerald-300 tracking-tight">
              {totalStandby} <span className="text-xs font-sans text-emerald-400/70">Team</span>
            </span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-amber-900/50 rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold tracking-wider text-amber-400 uppercase block">
              🟡 IJIN / SAKIT
            </span>
            <span className="text-2xl font-bold font-mono text-amber-300 tracking-tight">
              {totalIjinSakit} <span className="text-xs font-sans text-amber-400/70">Team</span>
            </span>
          </div>
        </div>

        <div className="bg-slate-900/90 border border-red-900/50 rounded-xl p-4 flex items-center gap-3.5 shadow-sm">
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 shrink-0">
            <XCircle className="w-6 h-6" />
          </div>
          <div>
            <span className="text-xs font-semibold tracking-wider text-red-400 uppercase block">
              🔴 OFF
            </span>
            <span className="text-2xl font-bold font-mono text-red-300 tracking-tight">
              {totalOff} <span className="text-xs font-sans text-red-400/70">Team</span>
            </span>
          </div>
        </div>
      </div>

      {/* TOP CONTROL BAR & WHATSAPP BROADCAST LINK */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div className="flex items-start gap-3.5">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-amber-500/80 p-0.5 bg-slate-950 shadow-xl shadow-amber-950/50 shrink-0 hidden sm:block">
              <img
                src="/logo-emblem.png"
                alt="Logo Emblem"
                className="w-full h-full object-cover rounded-full"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                  JADWAL AKTIF
                </span>
                <button
                  type="button"
                  onClick={() => setIsCalendarModalOpen(true)}
                  className="text-xs text-slate-300 font-mono font-semibold flex items-center gap-1 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 hover:border-emerald-500/60 transition-colors select-none cursor-pointer"
                >
                  <CalendarIcon className="w-3.5 h-3.5 text-emerald-400 pointer-events-none" />
                  {currentDayName.toUpperCase()}, {currentDateStr}
                </button>
              </div>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight whitespace-pre-wrap">
                {schedule.title}
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                <strong className="text-slate-300">*NOP SOUTHERN*</strong> — Ubah status personel dengan 1-klik atau kirim langsung via WhatsApp.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={handleCopyWA}
              className="min-h-[44px] flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium text-sm rounded-xl transition-colors active:scale-95 select-none cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-emerald-400" />}
              <span>{copied ? 'Tersalin!' : 'Salin Text'}</span>
            </button>

            <button
              type="button"
              onClick={handleShareWA}
              className="min-h-[44px] flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-colors shadow-lg shadow-emerald-950/50 active:scale-95 select-none cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Kirim Laporan ke WhatsApp</span>
            </button>
          </div>
        </div>

        {/* SEARCH & BULK ACTIONS */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              placeholder="Cari nama atau no. hp..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="min-h-[40px] px-3.5 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 w-full sm:w-64 font-medium"
            />

            <select
              value={filterGroup}
              onChange={(e) => setFilterGroup(e.target.value)}
              className="min-h-[40px] px-3 py-2 bg-slate-950 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-semibold cursor-pointer"
            >
              <option value="all">Semua Tim (TO JAKTIM 1 & 2)</option>
              {schedule.groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.groupName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[11px] font-semibold text-slate-400 uppercase shrink-0">
              Set Semua:
            </span>
            <button
              type="button"
              onClick={() => handleBulkSetStatus('standby')}
              className="min-h-[36px] px-3 py-1.5 text-xs font-bold bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-700/50 text-emerald-300 rounded-lg transition-colors whitespace-nowrap select-none cursor-pointer"
            >
              🟢 Standby
            </button>
            <button
              type="button"
              onClick={() => handleBulkSetStatus('off')}
              className="min-h-[36px] px-3 py-1.5 text-xs font-bold bg-red-950/80 hover:bg-red-900 border border-red-700/50 text-red-300 rounded-lg transition-colors whitespace-nowrap select-none cursor-pointer"
            >
              🔴 Off
            </button>
            <button
              type="button"
              onClick={() => handleBulkSetStatus('ijin_sakit')}
              className="min-h-[36px] px-3 py-1.5 text-xs font-bold bg-amber-950/80 hover:bg-amber-900 border border-amber-700/50 text-amber-300 rounded-lg transition-colors whitespace-nowrap select-none cursor-pointer"
            >
              🟡 Ijin/Sakit
            </button>
          </div>
        </div>
      </div>

      {/* TEAM MEMBER GROUPS LIST WITH DIRECT WHATSAPP CHAT LINKS */}
      <div className="space-y-6">
        {filteredGroups.map((group) => (
          <div
            key={group.id}
            className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-lg"
          >
            <div className="bg-slate-950 px-5 py-3.5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></span>
                <h3 className="text-base font-bold text-slate-100 font-mono tracking-wide uppercase">
                  {group.groupName} :
                </h3>
                <span className="text-xs text-slate-400 font-mono bg-slate-900 px-2.5 py-0.5 rounded-full border border-slate-800">
                  {group.members.length} Personel
                </span>
              </div>

              <button
                type="button"
                onClick={() => onOpenAddMember(group.id)}
                className="min-h-[36px] flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg transition-colors select-none cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400 pointer-events-none" />
                <span>Tambah Personel</span>
              </button>
            </div>

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
                      className="p-4 hover:bg-slate-800/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-xs font-bold font-mono text-slate-500 w-5 shrink-0">
                          {index + 1}.
                        </span>

                        <button
                          type="button"
                          onClick={() => handleCycleStatus(group.id, member.id, member.status)}
                          title="Klik untuk ganti status (STANDBY -> OFF -> IJIN)"
                          className="text-2xl shrink-0 p-1.5 rounded-lg hover:bg-slate-800 transition-transform active:scale-110 select-none min-h-[44px] min-w-[44px] flex items-center justify-center cursor-pointer"
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
                              className="text-slate-300 hover:underline font-mono text-xs sm:text-sm flex items-center gap-1 py-1"
                            >
                              <Phone className="w-3.5 h-3.5 text-slate-400" />
                              {member.phone}
                            </a>

                            <a
                              href={waChatLink}
                              target="_blank"
                              rel="noreferrer"
                              title={`Chat WA dengan ${member.name}`}
                              className="px-2.5 py-1 bg-emerald-950/90 hover:bg-emerald-900 border border-emerald-700/80 text-emerald-400 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors select-none min-h-[32px]"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-emerald-400 pointer-events-none" />
                              <span>Chat WA</span>
                            </a>
                          </div>

                          <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                            <span>Status saat ini:</span>
                            <span
                              className={`font-semibold capitalize px-2 py-0.5 rounded-md text-[10px] ${
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

                      {/* 1-CLICK STATUS SWITCHER BUTTONS */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleSingleClickStatusChange(group.id, member.id, 'off')}
                          className={`min-h-[44px] px-3 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1 border select-none cursor-pointer ${
                            member.status === 'off'
                              ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-950/50 ring-2 ring-red-500/30'
                              : 'bg-slate-950/80 hover:bg-red-950/50 text-slate-300 border-slate-700/80 hover:border-red-700/50'
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
                          className={`min-h-[44px] px-3 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1 border select-none cursor-pointer ${
                            member.status === 'ijin_sakit'
                              ? 'bg-amber-600 text-white border-amber-500 shadow-md shadow-amber-950/50 ring-2 ring-amber-500/30'
                              : 'bg-slate-950/80 hover:bg-amber-950/50 text-slate-300 border-slate-700/80 hover:border-amber-700/50'
                          }`}
                        >
                          <span>🟡</span>
                          <span>IJIN/SAKIT</span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            handleSingleClickStatusChange(group.id, member.id, 'standby')
                          }
                          className={`min-h-[44px] px-3 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1 border select-none cursor-pointer ${
                            member.status === 'standby'
                              ? 'bg-emerald-600 text-white border-emerald-500 shadow-md shadow-emerald-950/50 ring-2 ring-emerald-500/30'
                              : 'bg-slate-950/80 hover:bg-emerald-950/50 text-slate-300 border-slate-700/80 hover:border-emerald-700/50'
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
                            className="min-h-[44px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors select-none cursor-pointer"
                          >
                            <Edit2 className="w-4 h-4 pointer-events-none" />
                          </button>
                          <button
                            type="button"
                            onClick={() => promptDeleteMember(group.id, member.id, member.name)}
                            title="Hapus Personel"
                            className="min-h-[44px] min-w-[36px] flex items-center justify-center text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors select-none cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4 pointer-events-none" />
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

      <KeteranganLegend />

      {/* Manual Visual Calendar Modal */}
      <CalendarDatePickerModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        currentDateDDMMYYYY={currentDateStr}
        onSelectDate={handleDateChange}
      />

      {/* Custom Personnel Delete Confirm Modal */}
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

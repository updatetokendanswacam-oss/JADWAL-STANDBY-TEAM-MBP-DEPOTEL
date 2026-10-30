import React, { useState, useEffect } from 'react';
import { Personnel, ShiftPatternType, MemberStatus } from '../types';
import {
  calculateOffsetFromStep,
  getCurrentStepForMember,
  getDefaultPatternForGroup
} from '../utils/shiftScheduleCalculator';
import { X, Check, Sparkles, Calendar, Clock, AlertCircle } from 'lucide-react';

interface EditShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  scheduleDate: string;
  groupName: string;
  groupId: string;
  member: Personnel | null;
  memberIndex: number;
  onSaveShift: (
    groupId: string,
    memberId: string,
    newPattern: ShiftPatternType,
    newOffset: number,
    newStatus: MemberStatus
  ) => void;
  onShowToast: (msg: string) => void;
}

export const EditShiftModal: React.FC<EditShiftModalProps> = ({
  isOpen,
  onClose,
  scheduleDate,
  groupName,
  groupId,
  member,
  memberIndex,
  onSaveShift,
  onShowToast
}) => {
  if (!isOpen || !member) return null;

  const defaultPattern = member.shiftPattern || getDefaultPatternForGroup(groupName);
  const [selectedPattern, setSelectedPattern] = useState<ShiftPatternType>(defaultPattern);
  const [selectedStep, setSelectedStep] = useState<number>(() => {
    return getCurrentStepForMember(scheduleDate, groupName, member, memberIndex);
  });

  // Re-sync when modal opens or member changes
  useEffect(() => {
    if (member) {
      const pat = member.shiftPattern || getDefaultPatternForGroup(groupName);
      setSelectedPattern(pat);
      const step = getCurrentStepForMember(scheduleDate, groupName, member, memberIndex);
      setSelectedStep(step);
    }
  }, [member, scheduleDate, groupName, memberIndex]);

  // Handle pattern change (adjust step if out of bounds)
  const handlePatternChange = (newPat: ShiftPatternType) => {
    setSelectedPattern(newPat);
    if (newPat === '4_2' && selectedStep >= 6) {
      setSelectedStep(0);
    } else if (newPat === '6_2' && selectedStep >= 8) {
      setSelectedStep(0);
    }
  };

  // Compute status on current target date based on selected pattern and step
  let isWorkDay = true;
  let statusText = '🟢 STANDBY';
  let computedStatus: MemberStatus = 'standby';

  if (selectedPattern === '4_2') {
    isWorkDay = selectedStep < 4;
    computedStatus = isWorkDay ? 'standby' : 'off';
    statusText = isWorkDay ? `🟢 STANDBY (Kerja Ke-${selectedStep + 1}/4)` : `🔴 OFF (Libur Ke-${selectedStep - 4 + 1}/2)`;
  } else if (selectedPattern === '6_2') {
    isWorkDay = selectedStep < 6;
    computedStatus = isWorkDay ? 'standby' : 'off';
    statusText = isWorkDay ? `🟢 STANDBY (Kerja Ke-${selectedStep + 1}/6)` : `🔴 OFF (Libur Ke-${selectedStep - 6 + 1}/2)`;
  } else if (selectedPattern === 'depok_monthly_1week') {
    isWorkDay = selectedStep >= 7;
    computedStatus = isWorkDay ? 'standby' : 'off';
    const workDayNum = selectedStep - 7 + 1; // 1..21
    const offDayNum = selectedStep + 1; // 1..7
    statusText = isWorkDay
      ? `🟢 STANDBY (Masuk Ke-${workDayNum}/21 Hari Masuk)`
      : `🔴 OFF (Libur Ke-${offDayNum}/7 Hari Libur)`;
  }

  const handleSave = () => {
    const newOffset = calculateOffsetFromStep(selectedPattern, scheduleDate, selectedStep);
    onSaveShift(groupId, member.id, selectedPattern, newOffset, computedStatus);
    onShowToast(`Pola shift ${member.name} berhasil diperbarui ke: ${statusText}! Terhitung otomatis mengikuti tanggal. ⚡`);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl sm:rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Sparkles className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-lg font-black text-white truncate">
                Atur Pola & Hari Kerja/Libur
              </h2>
              <p className="text-xs text-amber-400 font-mono font-bold truncate">
                {member.name} • {groupName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content body with scrolling */}
        <div className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Target date indicator */}
          <div className="flex items-center gap-2 p-2.5 bg-slate-950 rounded-xl border border-slate-800 text-xs">
            <Calendar className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="text-slate-400">Tanggal Aktif:</span>
            <span className="font-mono font-extrabold text-slate-200">{scheduleDate}</span>
            <span className="ml-auto text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-bold">
              Hitung Otomatis
            </span>
          </div>

          {/* 1. Pilih Tipe Pola */}
          <div className="space-y-2">
            <label className="text-xs font-black text-slate-300 uppercase tracking-wider block">
              1. Pilih Pola Kerja & Libur:
            </label>
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => handlePatternChange('4_2')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  selectedPattern === '4_2'
                    ? 'bg-emerald-950/60 border-emerald-500 text-white ring-1 ring-emerald-500'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="font-bold text-xs sm:text-sm flex items-center gap-1.5">
                    <span>⚡ Pola 4 Hari Kerja / 2 Hari Libur (4K - 2L)</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Siklus 6 hari: 4 hari kerja standby, dilanjutkan 2 hari off
                  </div>
                </div>
                {selectedPattern === '4_2' && <Check className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />}
              </button>

              <button
                type="button"
                onClick={() => handlePatternChange('6_2')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  selectedPattern === '6_2'
                    ? 'bg-emerald-950/60 border-emerald-500 text-white ring-1 ring-emerald-500'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="font-bold text-xs sm:text-sm flex items-center gap-1.5">
                    <span>⚡ Pola 6 Hari Kerja / 2 Hari Libur (6K - 2L)</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Siklus 8 hari: 6 hari kerja standby, dilanjutkan 2 hari off
                  </div>
                </div>
                {selectedPattern === '6_2' && <Check className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />}
              </button>

              <button
                type="button"
                onClick={() => handlePatternChange('depok_monthly_1week')}
                className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-center justify-between ${
                  selectedPattern === 'depok_monthly_1week'
                    ? 'bg-emerald-950/60 border-emerald-500 text-white ring-1 ring-emerald-500'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="font-bold text-xs sm:text-sm flex items-center gap-1.5">
                    <span>⚡ Pola 1 Bulan Libur 1 Minggu Diurut (Depok)</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Siklus 28 hari: Libur 7 hari berturut-turut sekali sebulan secara bergilir
                  </div>
                </div>
                {selectedPattern === 'depok_monthly_1week' && <Check className="w-4 h-4 text-emerald-400 shrink-0 ml-2" />}
              </button>
            </div>
          </div>

          {/* 2. Pilih Hari Kerja / Libur untuk Tanggal ini */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-slate-300 uppercase tracking-wider block">
                2. Tentukan Posisi Hari Pada Tanggal Ini:
              </label>
              <span className="text-[10px] text-amber-400 font-bold">
                Pilih status hari ini
              </span>
            </div>

            {/* OPTIONS FOR 4K - 2L */}
            {selectedPattern === '4_2' && (
              <div className="grid grid-cols-2 gap-2">
                {/* 4 Kerja */}
                <button
                  type="button"
                  onClick={() => setSelectedStep(0)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedStep === 0
                      ? 'bg-emerald-900/60 border-emerald-500 text-white font-bold ring-2 ring-emerald-400/50'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                    <span>🟢</span> <span>Kerja Ke-1 / 4</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Standby hari pertama</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedStep(1)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedStep === 1
                      ? 'bg-emerald-900/60 border-emerald-500 text-white font-bold ring-2 ring-emerald-400/50'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                    <span>🟢</span> <span>Kerja Ke-2 / 4</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Standby hari kedua</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedStep(2)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedStep === 2
                      ? 'bg-emerald-900/60 border-emerald-500 text-white font-bold ring-2 ring-emerald-400/50'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                    <span>🟢</span> <span>Kerja Ke-3 / 4</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Standby hari ketiga</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedStep(3)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedStep === 3
                      ? 'bg-emerald-900/60 border-emerald-500 text-white font-bold ring-2 ring-emerald-400/50'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="text-xs font-bold text-emerald-300 flex items-center gap-1">
                    <span>🟢</span> <span>Kerja Ke-4 / 4</span>
                  </div>
                  <div className="text-[10px] text-amber-300 mt-0.5 font-semibold">Besok Libur 🔴</div>
                </button>

                {/* 2 Libur */}
                <button
                  type="button"
                  onClick={() => setSelectedStep(4)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedStep === 4
                      ? 'bg-red-900/60 border-red-500 text-white font-bold ring-2 ring-red-400/50'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="text-xs font-bold text-red-300 flex items-center gap-1">
                    <span>🔴</span> <span>Libur Ke-1 / 2</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Off hari pertama</div>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedStep(5)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    selectedStep === 5
                      ? 'bg-red-900/60 border-red-500 text-white font-bold ring-2 ring-red-400/50'
                      : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="text-xs font-bold text-red-300 flex items-center gap-1">
                    <span>🔴</span> <span>Libur Ke-2 / 2</span>
                  </div>
                  <div className="text-[10px] text-emerald-300 mt-0.5 font-semibold">Besok Masuk 🟢</div>
                </button>
              </div>
            )}

            {/* OPTIONS FOR 6K - 2L */}
            {selectedPattern === '6_2' && (
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-slate-400 uppercase">Hari Kerja (Standby 🟢):</div>
                <div className="grid grid-cols-3 gap-1.5">
                  {[0, 1, 2, 3, 4, 5].map((st) => (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setSelectedStep(st)}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        selectedStep === st
                          ? 'bg-emerald-900/70 border-emerald-500 text-white font-bold ring-2 ring-emerald-400/50'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      <div className="text-xs font-bold text-emerald-300">
                        Kerja Ke-{st + 1}/6
                      </div>
                      <div className="text-[9px] text-slate-400">
                        {st === 5 ? 'Besok Libur 🔴' : `${5 - st} hr lg`}
                      </div>
                    </button>
                  ))}
                </div>

                <div className="text-[11px] font-bold text-slate-400 uppercase pt-1">Hari Libur (Off 🔴):</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedStep(6)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      selectedStep === 6
                        ? 'bg-red-900/70 border-red-500 text-white font-bold ring-2 ring-red-400/50'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="text-xs font-bold text-red-300">🔴 Libur Ke-1 / 2</div>
                    <div className="text-[10px] text-slate-400">Off hari pertama</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedStep(7)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      selectedStep === 7
                        ? 'bg-red-900/70 border-red-500 text-white font-bold ring-2 ring-red-400/50'
                        : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div className="text-xs font-bold text-red-300">🔴 Libur Ke-2 / 2</div>
                    <div className="text-[10px] text-emerald-300 font-semibold">Besok Masuk 🟢</div>
                  </button>
                </div>
              </div>
            )}

            {/* OPTIONS FOR DEPOK: 1 BULAN LIBUR 1 MINGGU DIURUT (21 HARI MASUK & 7 HARI LIBUR) */}
            {selectedPattern === 'depok_monthly_1week' && (
              <div className="space-y-3">
                {/* Information banner on monthly work/holiday calculation */}
                <div className="p-3 bg-blue-950/40 border border-blue-500/40 rounded-xl space-y-1.5 text-xs text-blue-200">
                  <div className="font-bold flex items-center gap-1.5 text-blue-300">
                    <Clock className="w-4 h-4 text-blue-400 shrink-0" />
                    <span>Rincian Hitungan Bulanan TO DEPOK (Siklus 28 Hari):</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px]">
                    <div className="bg-slate-950/70 p-2 rounded-lg border border-emerald-500/30 text-emerald-300">
                      <span className="block text-[9px] text-slate-400 uppercase font-sans">Total Hari Masuk:</span>
                      <strong className="text-sm">21 Hari Masuk</strong> (3 Minggu Kerja)
                    </div>
                    <div className="bg-slate-950/70 p-2 rounded-lg border border-red-500/30 text-red-300">
                      <span className="block text-[9px] text-slate-400 uppercase font-sans">Total Hari Libur:</span>
                      <strong className="text-sm">7 Hari Libur</strong> (1 Minggu Penuh)
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-400 pt-0.5">
                    *Catatan: Pada bulan kalender 30 hari = 23 hari masuk | Bulan 31 hari = 24 hari masuk.
                  </div>
                </div>

                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
                  <div className="text-xs font-bold text-amber-300">Pilih Status Hari Ini:</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedStep(0)}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                        selectedStep < 7
                          ? 'bg-red-950/80 border-red-500 text-white ring-2 ring-red-500/40'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <div className="text-xs font-bold text-red-400">🔴 Sedang Libur 1 Minggu</div>
                      <div className="text-[10px] text-slate-400">7 hari libur bulanan</div>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSelectedStep(7)}
                      className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all ${
                        selectedStep >= 7
                          ? 'bg-emerald-950/80 border-emerald-500 text-white ring-2 ring-emerald-500/40'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
                      }`}
                    >
                      <div className="text-xs font-bold text-emerald-400">🟢 Sedang Standby Kerja</div>
                      <div className="text-[10px] text-slate-400">Total 21 hari masuk</div>
                    </button>
                  </div>
                </div>

                {selectedStep < 7 ? (
                  <div className="space-y-1.5 p-3 bg-slate-950 border border-slate-800 rounded-xl">
                    <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                      <span>Pilih Hari dalam 1 Minggu Libur (Total 7 Hari Libur):</span>
                      <span className="text-red-400 font-mono">Libur Ke-{selectedStep + 1}/7</span>
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-7 gap-1 pt-1">
                      {[0, 1, 2, 3, 4, 5, 6].map((dayOffset) => (
                        <button
                          key={dayOffset}
                          type="button"
                          onClick={() => setSelectedStep(dayOffset)}
                          className={`p-2 rounded-lg border text-center cursor-pointer text-xs font-mono font-bold transition-all ${
                            selectedStep === dayOffset
                              ? 'bg-red-600 text-white border-red-400 shadow-md ring-2 ring-red-400/40'
                              : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                          }`}
                        >
                          <div className="text-[9px] text-red-300/80">Libur</div>
                          <div>H-{dayOffset + 1}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2.5 p-3 bg-slate-950 border border-slate-800 rounded-xl">
                    <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
                      <span>Pilih Hari Masuk Kerja (Total 21 Hari Masuk):</span>
                      <span className="text-emerald-400 font-mono font-bold">
                        Masuk Ke-{selectedStep - 7 + 1}/21
                      </span>
                    </div>

                    {/* Minggu Masuk 1 (Hari Masuk 1 s/d 7) */}
                    <div className="space-y-1">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">
                        Minggu Masuk 1 (Hari Masuk Ke-1 s/d 7):
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-7 gap-1">
                        {[7, 8, 9, 10, 11, 12, 13].map((step) => {
                          const workDay = step - 7 + 1;
                          return (
                            <button
                              key={step}
                              type="button"
                              onClick={() => setSelectedStep(step)}
                              className={`p-1.5 rounded-lg border text-center text-xs font-mono font-bold transition-all ${
                                selectedStep === step
                                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md ring-2 ring-emerald-400/40'
                                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                              }`}
                            >
                              <div className="text-[9px] text-emerald-300/80">Masuk</div>
                              <div>H-{workDay}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Minggu Masuk 2 (Hari Masuk 8 s/d 14) */}
                    <div className="space-y-1 pt-1 border-t border-slate-800/60">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">
                        Minggu Masuk 2 (Hari Masuk Ke-8 s/d 14):
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-7 gap-1">
                        {[14, 15, 16, 17, 18, 19, 20].map((step) => {
                          const workDay = step - 7 + 1;
                          return (
                            <button
                              key={step}
                              type="button"
                              onClick={() => setSelectedStep(step)}
                              className={`p-1.5 rounded-lg border text-center text-xs font-mono font-bold transition-all ${
                                selectedStep === step
                                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md ring-2 ring-emerald-400/40'
                                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                              }`}
                            >
                              <div className="text-[9px] text-emerald-300/80">Masuk</div>
                              <div>H-{workDay}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Minggu Masuk 3 (Hari Masuk 15 s/d 21) */}
                    <div className="space-y-1 pt-1 border-t border-slate-800/60">
                      <div className="text-[10px] text-slate-400 font-bold uppercase">
                        Minggu Masuk 3 (Hari Masuk Ke-15 s/d 21):
                      </div>
                      <div className="grid grid-cols-4 sm:grid-cols-7 gap-1">
                        {[21, 22, 23, 24, 25, 26, 27].map((step) => {
                          const workDay = step - 7 + 1;
                          return (
                            <button
                              key={step}
                              type="button"
                              onClick={() => setSelectedStep(step)}
                              className={`p-1.5 rounded-lg border text-center text-xs font-mono font-bold transition-all ${
                                selectedStep === step
                                  ? 'bg-emerald-600 text-white border-emerald-400 shadow-md ring-2 ring-emerald-400/40'
                                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                              }`}
                            >
                              <div className="text-[9px] text-emerald-300/80">Masuk</div>
                              <div>H-{workDay}</div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Real-time Result Preview */}
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between gap-3 shadow-inner">
            <div className="space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase font-bold block flex items-center gap-1">
                <Clock className="w-3 h-3 text-emerald-400" />
                Hasil Status Pada {scheduleDate}:
              </span>
              <div className="text-sm font-black text-white">
                {statusText}
              </div>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-emerald-400 font-mono block">
                Otomatis Maju Hari
              </span>
              <span className="text-[11px] font-bold text-slate-300">
                Siklus Terkunci ⚡
              </span>
            </div>
          </div>

          {/* Helper note */}
          <div className="flex items-start gap-2 text-[11px] text-slate-400 bg-slate-950/50 p-2.5 rounded-xl border border-slate-800/80">
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <span>
              Ketika disimpan, status personel akan otomatis mengikuti perubahan kalender tanggal ke depan. Anda juga tetap bisa mengubah status secara manual (OFF/IJIN/STANDBY) sewaktu-waktu.
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950/90 border-t border-slate-800 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[42px] px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition-all cursor-pointer active:scale-95"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="min-h-[42px] px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-950/50 flex items-center gap-1.5 transition-all cursor-pointer active:scale-95"
          >
            <Check className="w-4 h-4" />
            <span>Simpan & Hitung Otomatis</span>
          </button>
        </div>
      </div>
    </div>
  );
};

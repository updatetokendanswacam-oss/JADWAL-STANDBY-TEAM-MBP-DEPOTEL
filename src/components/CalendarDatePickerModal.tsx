import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Check,
  Edit3,
  Clock
} from 'lucide-react';
import {
  formatToYYYYMMDD,
  formatIndonesianDateFull,
  parseDDMMYYYY,
  formatToDDMMYYYY
} from '../utils/dateUtils';
import { useRealtimeClock } from '../hooks/useRealtimeClock';

interface CalendarDatePickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDateDDMMYYYY: string;
  onSelectDate: (newDateDDMMYYYY: string) => void;
}

export const CalendarDatePickerModal: React.FC<CalendarDatePickerModalProps> = ({
  isOpen,
  onClose,
  currentDateDDMMYYYY,
  onSelectDate
}) => {
  const clock = useRealtimeClock();

  const [manualText, setManualText] = useState(() => formatToDDMMYYYY(currentDateDDMMYYYY));
  const [viewDate, setViewDate] = useState<Date>(() => parseDDMMYYYY(currentDateDDMMYYYY));
  const [selectedIsoDate, setSelectedIsoDate] = useState<string>(() =>
    formatToYYYYMMDD(currentDateDDMMYYYY)
  );

  useEffect(() => {
    if (isOpen) {
      const cleanDDMM = formatToDDMMYYYY(currentDateDDMMYYYY);
      setManualText(cleanDDMM);
      const parsed = parseDDMMYYYY(currentDateDDMMYYYY);
      setViewDate(parsed);
      setSelectedIsoDate(formatToYYYYMMDD(cleanDDMM));
    }
  }, [currentDateDDMMYYYY, isOpen]);

  if (!isOpen) return null;

  // Safe Calendar calculations
  const safeViewDate = isNaN(viewDate.getTime()) ? new Date() : viewDate;
  const year = safeViewDate.getFullYear();
  const month = safeViewDate.getMonth(); // 0-indexed

  const monthNames = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember'
  ];

  const daysOfWeek = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

  // First day of current month (Mon = 0, Sun = 6)
  const firstDayOfMonth = new Date(year, month, 1, 12, 0, 0);
  let startingDay = firstDayOfMonth.getDay() - 1;
  if (startingDay < 0) startingDay = 6;
  if (isNaN(startingDay)) startingDay = 0;

  // Total days in current month
  const rawDaysInMonth = new Date(year, month + 1, 0, 12, 0, 0).getDate();
  const daysInMonth = isNaN(rawDaysInMonth) || rawDaysInMonth < 1 ? 31 : rawDaysInMonth;

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1, 12, 0, 0));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1, 12, 0, 0));
  };

  const handleDayClick = (dayNum: number) => {
    const d = new Date(year, month, dayNum, 12, 0, 0);
    const dayStr = String(d.getDate()).padStart(2, '0');
    const monthStr = String(d.getMonth() + 1).padStart(2, '0');
    const yearStr = d.getFullYear();

    const ddmmyyyy = `${dayStr}-${monthStr}-${yearStr}`;
    const iso = `${yearStr}-${monthStr}-${dayStr}`;

    setSelectedIsoDate(iso);
    setManualText(ddmmyyyy);
  };

  const handleApply = () => {
    if (!manualText.trim()) return;
    const cleanFormatted = formatToDDMMYYYY(manualText.trim());
    onSelectDate(cleanFormatted || manualText.trim());
    onClose();
  };

  const handleManualInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseDDMMYYYY(manualText);
    if (!isNaN(parsed.getTime())) {
      setViewDate(parsed);
      setSelectedIsoDate(formatToYYYYMMDD(manualText));
    }
    handleApply();
  };

  // Build calendar matrix safely
  const daysArray: (number | null)[] = [];
  for (let i = 0; i < startingDay; i++) {
    daysArray.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    daysArray.push(d);
  }

  const todayIso = formatToYYYYMMDD(clock.dateStrDDMMYYYY);

  const handleSetRealtimeToday = () => {
    const todayDDMM = clock.dateStrDDMMYYYY;
    setManualText(todayDDMM);
    setSelectedIsoDate(formatToYYYYMMDD(todayDDMM));
    setViewDate(parseDDMMYYYY(todayDDMM));
  };

  const yearOptions = Array.from(
    new Set([
      year - 2,
      year - 1,
      year,
      year + 1,
      year + 2,
      2024,
      2025,
      2026,
      2027,
      2028,
      2029,
      2030
    ])
  ).sort((a, b) => a - b);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-slate-100 text-base">
                Setting Tanggal Kalender (Real Time)
              </h3>
              <span className="text-[11px] text-emerald-400 font-mono font-semibold flex items-center gap-1">
                <Clock className="w-3 h-3 animate-spin" />
                {clock.fullDisplay}
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Quick Realtime Today Button */}
          <div className="bg-emerald-950/60 border border-emerald-800/80 rounded-xl p-3 flex items-center justify-between gap-2">
            <div className="text-xs">
              <span className="text-slate-400 block font-semibold">Jam & Waktu Real Time:</span>
              <span className="font-mono font-bold text-emerald-300 text-sm">{clock.timeStr}</span>
            </div>
            <button
              type="button"
              onClick={handleSetRealtimeToday}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg shadow-sm transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Gunakan Hari Ini ({clock.dateStrDDMMYYYY})</span>
            </button>
          </div>

          {/* Manual Text Input Field */}
          <form onSubmit={handleManualInputSubmit} className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-300 block flex items-center gap-1">
              <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Input Manual Format Tanggal (DD-MM-YYYY):</span>
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={manualText}
                onChange={(e) => {
                  setManualText(e.target.value);
                  const p = parseDDMMYYYY(e.target.value);
                  if (!isNaN(p.getTime())) {
                    setViewDate(p);
                    setSelectedIsoDate(formatToYYYYMMDD(e.target.value));
                  }
                }}
                placeholder="misal: 29-10-2026"
                className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-emerald-500/80 rounded-xl text-sm font-bold font-mono text-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/40"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
              >
                Set
              </button>
            </div>
            <span className="text-[11px] text-slate-400 block font-mono">
              Terpilih: {formatIndonesianDateFull(manualText)}
            </span>
          </form>

          {/* VISUAL KALENDER GRID */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-3">
            {/* Month & Year Navigation Header */}
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                <select
                  value={month}
                  onChange={(e) => setViewDate(new Date(year, parseInt(e.target.value, 10), 1, 12, 0, 0))}
                  className="bg-slate-900 text-slate-100 font-bold text-xs px-2.5 py-1.5 rounded-lg border border-slate-800 focus:outline-none cursor-pointer"
                >
                  {monthNames.map((mName, idx) => (
                    <option key={mName} value={idx}>
                      {mName}
                    </option>
                  ))}
                </select>

                <select
                  value={year}
                  onChange={(e) => setViewDate(new Date(parseInt(e.target.value, 10), month, 1, 12, 0, 0))}
                  className="bg-slate-900 text-slate-100 font-bold text-xs px-2.5 py-1.5 rounded-lg border border-slate-800 focus:outline-none font-mono cursor-pointer"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Days of Week Header */}
            <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs text-slate-400 font-mono border-b border-slate-800 pb-2">
              {daysOfWeek.map((d) => (
                <span key={d}>{d}</span>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center font-mono text-xs">
              {daysArray.map((dayNum, index) => {
                if (dayNum === null) {
                  return <div key={`empty-${index}`} className="p-2" />;
                }

                const dayStr = String(dayNum).padStart(2, '0');
                const monthStr = String(month + 1).padStart(2, '0');
                const cellIso = `${year}-${monthStr}-${dayStr}`;

                const isSelected = selectedIsoDate === cellIso;
                const isToday = cellIso === todayIso;

                return (
                  <button
                    key={cellIso}
                    type="button"
                    onClick={() => handleDayClick(dayNum)}
                    className={`p-2 rounded-lg transition-all font-semibold cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-600 text-white font-bold shadow-md shadow-emerald-950/80 ring-2 ring-emerald-400'
                        : isToday
                        ? 'bg-slate-800 text-emerald-400 font-bold border border-emerald-500/50'
                        : 'text-slate-200 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Modal Actions */}
          <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleApply}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition-colors shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Terapkan Tanggal</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { StandbySchedule } from '../types';
import {
  formatStandbyScheduleToWA,
  formatCombinedStandbyScheduleToWA
} from '../utils/whatsappFormatter';
import { KeteranganLegend } from './KeteranganLegend';
import {
  Copy,
  Check,
  RefreshCw,
  MessageSquare,
  Edit3,
  CornerDownLeft,
  Layers,
  Building2,
  FileText,
  Calendar as CalendarIcon,
  Sparkles
} from 'lucide-react';

interface BroadcastWAViewProps {
  innerSchedule: StandbySchedule;
  outerSchedule: StandbySchedule;
  onShowToast: (msg: string) => void;
}

export const BroadcastWAView: React.FC<BroadcastWAViewProps> = ({
  innerSchedule,
  outerSchedule,
  onShowToast
}) => {
  const [selectedList, setSelectedList] = useState<'combined' | 'inner' | 'outer'>('combined');
  const [customText, setCustomText] = useState('');
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const generateDefaultText = (mode: 'combined' | 'inner' | 'outer') => {
    if (mode === 'inner') {
      return formatStandbyScheduleToWA(innerSchedule);
    }
    if (mode === 'outer') {
      return formatStandbyScheduleToWA(outerSchedule);
    }
    return formatCombinedStandbyScheduleToWA(innerSchedule, outerSchedule);
  };

  useEffect(() => {
    setCustomText(generateDefaultText(selectedList));
  }, [selectedList, innerSchedule, outerSchedule]);

  const handleCopy = () => {
    navigator.clipboard.writeText(customText);
    setCopied(true);
    onShowToast('Teks laporan berhasil disalin ke Clipboard!');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleSendWA = () => {
    const encoded = encodeURIComponent(customText);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const handleResetToDefault = () => {
    const text = generateDefaultText(selectedList);
    setCustomText(text);
    onShowToast('Format teks direset ke data jadwal terbaru');
  };

  const handleAddEnter = () => {
    setCustomText((prev) => `${prev}\n`);
    onShowToast('Baris baru (Enter) ditambahkan');
  };

  return (
    <div className="space-y-6">
      {/* Selector Tab for Broadcast WA List */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-amber-400" />
          <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">
            PILIH FORMAT LAPORAN TEXT WA:
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => setSelectedList('combined')}
            className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 select-none ${
              selectedList === 'combined'
                ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400'
                : 'bg-slate-950 text-slate-300 border border-slate-800 hover:bg-slate-800'
            }`}
          >
            <FileText className="w-4 h-4 pointer-events-none" />
            <span>GABUNGAN (2 LIST)</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedList('inner')}
            className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 select-none ${
              selectedList === 'inner'
                ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400'
                : 'bg-slate-950 text-slate-300 border border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4 pointer-events-none" />
            <span>INNER JAKTIM</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedList('outer')}
            className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center justify-center gap-1.5 select-none ${
              selectedList === 'outer'
                ? 'bg-amber-500 text-slate-950 shadow-md ring-2 ring-amber-400'
                : 'bg-slate-950 text-slate-300 border border-slate-800 hover:bg-slate-800'
            }`}
          >
            <Building2 className="w-4 h-4 pointer-events-none" />
            <span>BEKASI</span>
          </button>
        </div>
      </div>

      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                GENERATOR FORMASI WA
              </span>
              <span className="text-xs font-mono font-bold text-amber-400">
                {selectedList === 'combined'
                  ? '(NOP SOUTHERN & NOP BEKASI)'
                  : selectedList === 'inner'
                  ? '(NOP SOUTHERN)'
                  : '(NOP BEKASI)'}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold bg-emerald-950 text-emerald-300 border border-emerald-700/60 flex items-center gap-1 shadow-sm">
                <Sparkles className="w-3 h-3 text-emerald-400 animate-pulse" />
                <span>JUDUL SINKRON KALENDER: {(innerSchedule.dayName || 'KAMIS').toUpperCase()}, {innerSchedule.date || '29-10-2026'}</span>
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Format Teks Broadcast WhatsApp
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Pratinjau, edit, dan kirim jadwal standby langsung ke WhatsApp.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
            <button
              onClick={handleAddEnter}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs rounded-xl border border-slate-700 transition-colors cursor-pointer"
              title="Tambah Baris Baru / Enter"
            >
              <CornerDownLeft className="w-4 h-4 text-emerald-400" />
              <span>+ Enter</span>
            </button>

            <button
              onClick={handleResetToDefault}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors cursor-pointer"
              title="Reset Teks ke Default"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium text-sm rounded-xl transition-colors active:scale-95 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-emerald-400" />}
              <span>{copied ? 'Tersalin!' : 'Salin Text'}</span>
            </button>

            <button
              onClick={handleSendWA}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-colors shadow-lg shadow-emerald-950/50 active:scale-95 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Kirim ke WA</span>
            </button>
          </div>
        </div>

        {/* Text Area / Preview Container */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              Teks Laporan Jadwal Standby:
            </span>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Selesai Edit' : 'Edit Manual Teks'}</span>
            </button>
          </div>

          {isEditing ? (
            <textarea
              rows={22}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              className="w-full p-4 bg-slate-950 border border-emerald-500/80 rounded-xl text-emerald-300 font-mono text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 leading-relaxed resize-y"
            />
          ) : (
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-slate-200 font-mono text-xs sm:text-sm whitespace-pre-wrap leading-relaxed select-all">
              {customText}
            </div>
          )}
        </div>
      </div>

      <KeteranganLegend />
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { StandbySchedule } from '../types';
import { formatStandbyScheduleToWA } from '../utils/whatsappFormatter';
import { KeteranganLegend } from './KeteranganLegend';
import {
  Copy,
  Check,
  RefreshCw,
  MessageSquare,
  Edit3,
  CornerDownLeft,
  Share2
} from 'lucide-react';

interface BroadcastWAViewProps {
  schedule: StandbySchedule;
  onShowToast: (msg: string) => void;
}

export const BroadcastWAView: React.FC<BroadcastWAViewProps> = ({
  schedule,
  onShowToast
}) => {
  const [customText, setCustomText] = useState('');
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    const formatted = formatStandbyScheduleToWA(schedule);
    setCustomText(formatted);
  }, [schedule]);

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
    const formatted = formatStandbyScheduleToWA(schedule);
    setCustomText(formatted);
    onShowToast('Format teks direset ke data jadwal terbaru');
  };

  const handleAddEnter = () => {
    setCustomText((prev) => `${prev}\n`);
    onShowToast('Baris baru (Enter) ditambahkan');
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
                GENERATOR FORMASI WA
              </span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Format Teks Broadcast WhatsApp
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Pratinjau, edit, dan kirim jadwal standby langsung ke WhatsApp.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={handleAddEnter}
              className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-800 hover:bg-slate-700 text-emerald-400 font-bold text-xs rounded-xl border border-slate-700 transition-colors"
              title="Tambah Baris Baru / Enter"
            >
              <CornerDownLeft className="w-4 h-4 text-emerald-400" />
              <span>+ Enter</span>
            </button>

            <button
              onClick={handleResetToDefault}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-colors"
              title="Reset Teks"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-medium text-sm rounded-xl transition-colors active:scale-95"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-emerald-400" />}
              <span>{copied ? 'Tersalin!' : 'Salin Text'}</span>
            </button>

            <button
              onClick={handleSendWA}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-xl transition-colors shadow-lg shadow-emerald-950/50 active:scale-95"
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
              className="text-emerald-400 hover:underline flex items-center gap-1"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditing ? 'Selesai Edit' : 'Edit Manual Teks'}</span>
            </button>
          </div>

          {isEditing ? (
            <textarea
              rows={16}
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              className="w-full p-4 bg-slate-950 border border-emerald-500/80 rounded-xl text-emerald-300 font-mono text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 leading-relaxed"
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

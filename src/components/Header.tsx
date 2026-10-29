import React from 'react';
import { ViewMode } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { useRealtimeClock } from '../hooks/useRealtimeClock';
import {
  Copy,
  RefreshCw,
  Clock
} from 'lucide-react';

interface HeaderProps {
  activeView: ViewMode;
  onSelectView: (mode: ViewMode) => void;
  onQuickCopy: () => void;
  onResetData: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onSelectView,
  onQuickCopy,
  onResetData
}) => {
  const clock = useRealtimeClock();

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 sm:h-20 flex items-center justify-between gap-3 sm:gap-6">
        {/* Zone 1: Wordmark & Logo Emblem */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            onSelectView('mbp_standby');
          }}
          className="flex items-center gap-2.5 sm:gap-3 whitespace-nowrap shrink-0 group select-none min-w-0"
        >
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden border border-amber-500/80 p-0.5 bg-slate-900 shadow-xl shadow-amber-950/50 group-hover:scale-105 transition-transform shrink-0">
            <img
              src="/logo-emblem.png"
              alt="JADWAL STANDBY TEAM MBP DEPOTEL Emblem Logo"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <div className="min-w-0">
            <span className="text-xs sm:text-sm font-black tracking-tight text-white block uppercase truncate">
              JADWAL STANDBY TEAM MBP DEPOTEL
            </span>
            <span className="text-[11px] font-mono font-bold text-amber-400 block -mt-0.5 truncate">
              (NOP SOUTHERN & NOP BEKASI)
            </span>
          </div>
        </a>

        {/* Zone 2: Realtime Live Clock (Desktop & Mobile) */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-emerald-500/40 rounded-xl text-xs font-mono text-emerald-300 shadow-inner shrink-0">
          <Clock className="w-4 h-4 text-emerald-400 animate-spin" />
          <span className="font-bold">{clock.timeStr}</span>
          <span className="text-slate-400">({clock.dayName.toUpperCase()})</span>
        </div>

        {/* Zone 3: Quick Action Toolbar & PWA Install Button */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <PWAInstallButton />

          <button
            onClick={onResetData}
            title="Reset Data Ke Standar Awal"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors select-none cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={onQuickCopy}
            className="min-h-[40px] flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors shadow-md shadow-emerald-950/40 shrink-0 select-none cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Salin Text WA</span>
          </button>
        </div>
      </div>
    </header>
  );
};

import React from 'react';
import { ViewMode } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import {
  ShieldCheck,
  Copy,
  Home,
  Settings,
  RefreshCw,
  MessageCircle
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
  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Wordmark */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            onSelectView('mbp_standby');
          }}
          className="flex items-center gap-2.5 whitespace-nowrap shrink-0 group select-none"
        >
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-slate-950 font-black shadow-md shadow-emerald-950/50 group-hover:scale-105 transition-transform">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-base sm:text-lg font-extrabold tracking-tight text-white whitespace-nowrap">
              DEPOTEL <span className="text-emerald-400">INNER JAKTIM</span>
            </span>
          </div>
        </a>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden lg:flex items-center gap-2 text-xs font-semibold">
          <button
            onClick={() => onSelectView('mbp_standby')}
            className={`min-h-[40px] px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 select-none ${
              activeView === 'mbp_standby'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Home className="w-4 h-4 text-emerald-400" />
            <span>Beranda Standby MBP</span>
          </button>

          <button
            onClick={() => onSelectView('broadcast_wa')}
            className={`min-h-[40px] px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 select-none ${
              activeView === 'broadcast_wa'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>Generator Broadcast WA</span>
          </button>

          <button
            onClick={() => onSelectView('settings')}
            className={`min-h-[40px] px-3.5 py-2 rounded-xl transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 select-none ${
              activeView === 'settings'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Pengaturan</span>
          </button>
        </nav>

        {/* Zone 3: Quick Action & PWA Install Button */}
        <div className="flex items-center gap-2 shrink-0">
          {/* PWA Install Button */}
          <PWAInstallButton />

          <button
            onClick={onResetData}
            title="Reset Data Ke Standar Awal"
            className="min-h-[40px] min-w-[40px] flex items-center justify-center p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors select-none"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={onQuickCopy}
            className="min-h-[40px] flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors shadow-md shadow-emerald-950/40 shrink-0 select-none"
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Salin Text WA</span>
          </button>
        </div>
      </div>

      {/* Mobile Navigation Bottom Bar (Touch-Optimized) */}
      <div className="lg:hidden flex items-center justify-around bg-slate-900 border-t border-slate-800 px-2 py-1 text-[11px] font-semibold">
        <button
          onClick={() => onSelectView('mbp_standby')}
          className={`min-h-[44px] px-3 py-2 rounded-xl whitespace-nowrap flex items-center gap-1.5 select-none ${
            activeView === 'mbp_standby'
              ? 'bg-emerald-600 text-white font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Beranda</span>
        </button>

        <button
          onClick={() => onSelectView('broadcast_wa')}
          className={`min-h-[44px] px-3 py-2 rounded-xl whitespace-nowrap flex items-center gap-1.5 select-none ${
            activeView === 'broadcast_wa'
              ? 'bg-emerald-600 text-white font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>Broadcast</span>
        </button>

        <button
          onClick={() => onSelectView('settings')}
          className={`min-h-[44px] px-3 py-2 rounded-xl whitespace-nowrap flex items-center gap-1.5 select-none ${
            activeView === 'settings'
              ? 'bg-emerald-600 text-white font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Pengaturan</span>
        </button>
      </div>
    </header>
  );
};

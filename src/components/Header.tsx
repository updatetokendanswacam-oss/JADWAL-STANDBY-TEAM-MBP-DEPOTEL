import React from 'react';
import { ViewMode, AppUser } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { useRealtimeClock } from '../hooks/useRealtimeClock';
import {
  Copy,
  RefreshCw,
  Clock,
  ShieldCheck,
  User,
  Shield,
  KeyRound
} from 'lucide-react';

interface HeaderProps {
  activeView: ViewMode;
  onSelectView: (mode: ViewMode) => void;
  onQuickCopy: () => void;
  onResetData: () => void;
  currentUser: AppUser | null;
  isAdmin: boolean;
  onOpenAccountModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  onSelectView,
  onQuickCopy,
  onResetData,
  currentUser,
  isAdmin,
  onOpenAccountModal
}) => {
  const clock = useRealtimeClock();

  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-2.5 sm:px-6 h-14 sm:h-20 flex items-center justify-between gap-1.5 sm:gap-4">
        {/* Zone 1: Wordmark & Logo Emblem */}
        <a
          href="/"
          onClick={(e) => {
            e.preventDefault();
            onSelectView('mbp_standby');
          }}
          className="flex items-center gap-2 sm:gap-3 whitespace-nowrap shrink-0 group select-none min-w-0"
        >
          <div className="w-8 h-8 sm:w-12 sm:h-12 rounded-full overflow-hidden border border-amber-500/80 p-0.5 bg-slate-900 shadow-xl shadow-amber-950/50 group-hover:scale-105 transition-transform shrink-0">
            <img
              src="/logo-emblem.png"
              alt="JADWAL STANDBY TEAM MBP DEPOTEL Emblem Logo"
              className="w-full h-full object-cover rounded-full"
            />
          </div>
          <div className="min-w-0 max-w-[150px] xs:max-w-[200px] sm:max-w-none">
            <span className="text-[11px] sm:text-sm font-black tracking-tight text-white block uppercase truncate leading-tight">
              JADWAL STANDBY MBP
            </span>
            <span className="text-[9px] sm:text-[11px] font-mono font-bold text-amber-400 block truncate leading-none mt-0.5">
              (NOP SOUTHERN & BEKASI)
            </span>
          </div>
        </a>

        {/* Zone 2: Realtime Live Clock (Desktop only) */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-emerald-500/40 rounded-xl text-xs font-mono text-emerald-300 shadow-inner shrink-0">
          <Clock className="w-4 h-4 text-emerald-400 animate-spin" />
          <span className="font-bold">{clock.timeStr}</span>
          <span className="text-slate-400">({clock.dayName.toUpperCase()})</span>
        </div>

        {/* Zone 3: Account Role Indicator & Quick Action Toolbar */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {/* Active Account / Role Button */}
          <button
            type="button"
            onClick={onOpenAccountModal}
            title={`Akun: ${currentUser?.name || 'Pilih Akun'} (${isAdmin ? 'Admin: Full Akses' : 'User: Operasional'})`}
            className={`min-h-[36px] sm:min-h-[40px] px-2 sm:px-3 py-1 sm:py-1.5 rounded-xl border flex items-center gap-1.5 transition-all cursor-pointer select-none active:scale-95 ${
              isAdmin
                ? 'bg-purple-950/80 hover:bg-purple-900/90 border-purple-600/70 text-purple-200 shadow-sm'
                : 'bg-amber-950/80 hover:bg-amber-900/90 border-amber-600/70 text-amber-200 shadow-sm'
            }`}
          >
            <div className="w-4 h-4 sm:w-5 sm:h-5 rounded-full flex items-center justify-center text-xs shrink-0">
              {isAdmin ? '🛡️' : '👤'}
            </div>
            <div className="text-left hidden xs:block">
              <span className="text-[10px] sm:text-[11px] font-bold text-white block leading-tight truncate max-w-[70px] sm:max-w-[110px]">
                {currentUser?.name?.split(' ')[0] || 'Akun'}
              </span>
              <span
                className={`text-[8px] sm:text-[9px] font-mono font-black uppercase tracking-wider block leading-none ${
                  isAdmin ? 'text-purple-300' : 'text-amber-400'
                }`}
              >
                {isAdmin ? 'ADMIN' : 'USER'}
              </span>
            </div>
          </button>

          <PWAInstallButton />

          {/* Reset button only accessible for Admin */}
          {isAdmin && (
            <button
              onClick={onResetData}
              title="Reset Data Ke Standar Awal (Khusus Admin)"
              className="min-h-[36px] min-w-[36px] sm:min-h-[40px] sm:min-w-[40px] flex items-center justify-center p-1.5 sm:p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors select-none cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}

          <button
            onClick={onQuickCopy}
            title="Salin seluruh format jadwal ke WhatsApp"
            className="min-h-[36px] sm:min-h-[40px] flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] sm:text-xs rounded-xl transition-colors shadow-md shadow-emerald-950/40 shrink-0 select-none cursor-pointer active:scale-95"
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Salin Text WA</span>
            <span className="sm:hidden">Salin</span>
          </button>
        </div>
      </div>
    </header>
  );
};

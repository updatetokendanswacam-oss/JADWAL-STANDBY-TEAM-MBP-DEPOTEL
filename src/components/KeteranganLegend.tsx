import React from 'react';

interface KeteranganLegendProps {
  className?: string;
}

export const KeteranganLegend: React.FC<KeteranganLegendProps> = ({ className = '' }) => {
  return (
    <div className={`p-4 bg-slate-900/90 text-slate-100 rounded-xl border border-slate-700/80 shadow-md ${className}`}>
      <h4 className="text-xs font-semibold tracking-wider text-slate-300 uppercase mb-2.5 flex items-center gap-2">
        <span>Keterangan :</span>
      </h4>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-sm font-medium">
        <div className="flex items-center gap-2 px-3 py-2 bg-red-950/40 border border-red-800/40 rounded-lg text-red-200">
          <span className="text-base">🔴</span>
          <span className="text-slate-200 font-mono">: off</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-950/40 border border-amber-800/40 rounded-lg text-amber-200">
          <span className="text-base">🟡</span>
          <span className="text-slate-200 font-mono">: ijin/sakit</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-emerald-950/40 border border-emerald-800/40 rounded-lg text-emerald-200">
          <span className="text-base">🟢</span>
          <span className="text-slate-200 font-mono">: standby</span>
        </div>
      </div>

      {/* Ketentuan Perhitungan Hari Kerja & Libur Otomatis */}
      <div className="mt-3.5 pt-3 border-t border-slate-800 text-[11px] sm:text-xs text-slate-300 space-y-1.5">
        <span className="font-bold text-amber-400 block uppercase tracking-wider text-[10px]">
          Siklus Hari Kerja & Libur Otomatis Berdasarkan Tanggal:
        </span>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-[11px] font-mono">
          <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800">
            <strong className="text-emerald-400 block">TO JAKTIM 1 & 2</strong>
            <span>4 Hari Kerja 🟢 & 2 Hari Libur 🔴 bergilir</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800">
            <strong className="text-emerald-400 block">TO BEKASI TIMUR & BARAT</strong>
            <span>6 Hari Kerja 🟢 & 2 Hari Libur 🔴 bergilir</span>
          </div>
          <div className="p-2 rounded-lg bg-slate-950/70 border border-slate-800">
            <strong className="text-emerald-400 block">TO DEPOK</strong>
            <span>21 Hari Masuk 🟢 & 7 Hari Libur 🔴 (1 Mgg Libur/Bln diurut)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

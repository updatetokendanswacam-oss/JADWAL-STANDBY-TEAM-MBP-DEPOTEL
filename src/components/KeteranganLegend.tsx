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
    </div>
  );
};

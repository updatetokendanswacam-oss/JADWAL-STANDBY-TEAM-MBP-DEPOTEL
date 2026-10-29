import React, { useState } from 'react';
import { usePWAInstall } from '../usePWAInstall';
import { Download, Smartphone, X, Check, Share2, PlusSquare } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showAndroidGuide, setShowAndroidGuide] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If running in standalone mode (already installed as PWA), do not render
  if (isInstalled) {
    return (
      <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-950/60 border border-emerald-800/60 rounded-xl text-emerald-400 font-mono text-xs font-semibold">
        <Check className="w-3.5 h-3.5 text-emerald-400" />
        <span>PWA Terinstall</span>
      </div>
    );
  }

  // Direct Chromium / Android / Desktop flow when beforeinstallprompt fires
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="flex items-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-950/50 transition-all active:scale-95 shrink-0"
      >
        <Download className="w-4 h-4 animate-bounce text-emerald-200" />
        <span>Install App PWA</span>
      </button>
    );
  }

  // Android Chrome Guide Flow
  const handleAndroidClick = () => {
    setShowAndroidGuide(true);
  };

  return (
    <>
      <button
        onClick={isIOS ? () => setShowIOSGuide(true) : handleAndroidClick}
        className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 border border-emerald-500/50 text-emerald-300 font-bold text-xs rounded-xl transition-all active:scale-95 shrink-0"
      >
        <Smartphone className="w-4 h-4 text-emerald-400" />
        <span>Install di HP</span>
      </button>

      {/* Android Chrome Guide Modal */}
      {showAndroidGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-slate-100 text-base">
                  Install di HP Android
                </h3>
              </div>
              <button
                onClick={() => setShowAndroidGuide(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <p className="text-slate-400">
                Langkah mudah memasang aplikasi ini di layar utama HP Android Anda:
              </p>
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 font-medium">
                <div className="flex items-start gap-2">
                  <span className="font-bold text-emerald-400 font-mono">1.</span>
                  <span>Buka menu titik tiga (⋮) di pojok kanan atas Google Chrome.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-emerald-400 font-mono">2.</span>
                  <span>Pilih menu <strong>"Tambahkan ke Layar Utama"</strong> atau <strong>"Install Aplikasi"</strong>.</span>
                </div>
                <div className="flex items-start gap-2">
                  <span className="font-bold text-emerald-400 font-mono">3.</span>
                  <span>Tekan <strong>"Tambahkan"</strong>. Icon aplikasi akan langsung muncul di HP Anda!</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowAndroidGuide(false)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      )}

      {/* iOS Safari Guide Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-slate-100 text-base">
                  Install di iPhone / iPad (iOS)
                </h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl space-y-2 font-medium">
                <div className="flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>1. Tekan tombol <strong>Share</strong> (Bagikan) di bagian bawah Safari.</span>
                </div>
                <div className="flex items-center gap-2">
                  <PlusSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>2. Gulir ke bawah dan pilih <strong>"Tambah ke Utama"</strong> (Add to Home Screen).</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      )}
    </>
  );
};

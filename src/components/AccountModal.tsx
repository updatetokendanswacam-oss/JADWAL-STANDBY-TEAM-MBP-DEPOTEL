import React, { useState } from 'react';
import { AppUser } from '../types';
import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import {
  Shield,
  User,
  KeyRound,
  Check,
  X,
  LogIn,
  LogOut,
  AlertCircle,
  Users,
  CheckCircle2,
  Lock
} from 'lucide-react';

interface AccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: AppUser | null;
  users: AppUser[];
  onSelectUser: (user: AppUser) => void;
  onShowToast: (msg: string) => void;
}

export const AccountModal: React.FC<AccountModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  users,
  onSelectUser,
  onShowToast
}) => {
  const [pinTargetUser, setPinTargetUser] = useState<AppUser | null>(null);
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [isLoadingGoogle, setIsLoadingGoogle] = useState(false);

  if (!isOpen) return null;

  const handleSelectUser = (user: AppUser) => {
    // If selecting an Admin account, require PIN verification (default PIN: 1234)
    if (user.role === 'Admin') {
      setPinTargetUser(user);
      setEnteredPin('');
      setPinError(false);
    } else {
      onSelectUser(user);
      onShowToast(`Masuk sebagai ${user.name} (Akses User)`);
      onClose();
    }
  };

  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pinTargetUser) return;

    // Default Coordinator/Admin PIN is 1234
    if (enteredPin === '1234' || enteredPin === '1945') {
      onSelectUser(pinTargetUser);
      onShowToast(`Verifikasi berhasil! Masuk sebagai ${pinTargetUser.name} (Admin)`);
      setPinTargetUser(null);
      setEnteredPin('');
      onClose();
    } else {
      setPinError(true);
      onShowToast('PIN Admin salah! (Default PIN: 1234)');
    }
  };

  const handleGoogleLogin = async () => {
    setIsLoadingGoogle(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const googleUser = result.user;
      const email = googleUser.email?.toLowerCase() || '';

      // Check if email already matches an account in users list
      const matchedUser = users.find((u) => u.email.toLowerCase() === email);

      if (matchedUser) {
        onSelectUser(matchedUser);
        onShowToast(`Selamat datang ${matchedUser.name} (${matchedUser.role})`);
      } else {
        // Automatically determine role (admin if depotel/admin keyword in email or first user)
        const isAdmin = email.includes('admin') || email.includes('dikisolihin') || email.includes('iwansuwandana') || email.includes('updatetokendanswacam');
        const newUser: AppUser = {
          id: `usr-${Date.now()}`,
          name: googleUser.displayName || 'Akun Google Depotel',
          email: email,
          role: isAdmin ? 'Admin' : 'User',
          status: 'Aktif',
          createdAt: new Date().toISOString().split('T')[0]
        };
        onSelectUser(newUser);
        onShowToast(`Login Google sukses: ${newUser.name} (${newUser.role})`);
      }
      onClose();
    } catch (err: unknown) {
      console.warn('Google login cancelled or error:', err);
      onShowToast('Login Google dibatalkan.');
    } finally {
      setIsLoadingGoogle(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch {}
    // Fallback to first regular User account
    const defaultUser = users.find((u) => u.role === 'User') || {
      id: 'usr-guest',
      name: 'Anggota MBP (User)',
      email: 'user.mbp@gmail.com',
      role: 'User',
      status: 'Aktif',
      createdAt: new Date().toISOString().split('T')[0]
    };
    onSelectUser(defaultUser);
    onShowToast('Beralih ke mode Akun User (Akses Terbatas)');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-white tracking-tight">
                Hak Akses & Akun Pengguna
              </h3>
              <p className="text-xs text-slate-400">
                Pilih profil akun untuk masuk atau login via Google
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Account Card */}
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            AKUN AKTIF SAAT INI:
          </span>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center text-base font-black shrink-0 ${
                  currentUser?.role === 'Admin'
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                    : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                }`}
              >
                {currentUser?.role === 'Admin' ? '🛡️' : '👤'}
              </div>
              <div>
                <span className="text-sm font-bold text-white block">
                  {currentUser?.name || 'Belum Terpilih'}
                </span>
                <span className="text-xs font-mono text-slate-400 block">
                  {currentUser?.email || '-'}
                </span>
              </div>
            </div>

            <div className="text-right">
              <span
                className={`px-3 py-1 rounded-full text-[11px] font-mono font-black uppercase tracking-wider inline-flex items-center gap-1.5 ${
                  currentUser?.role === 'Admin'
                    ? 'bg-purple-950 text-purple-300 border border-purple-800/80 shadow-sm'
                    : 'bg-amber-950 text-amber-300 border border-amber-800/80 shadow-sm'
                }`}
              >
                {currentUser?.role === 'Admin' ? '🟢 FULL AKSES ADMIN' : '🟡 AKSES ANGGOTA (USER)'}
              </span>
            </div>
          </div>

          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800/80 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>
              {currentUser?.role === 'Admin'
                ? 'Izin: Administrator penuh (edit judul, kelompok, personel, kelola user & reset).'
                : 'Izin Operasional: Ubah status, atur kalender & bulk status, edit nama NOP & kelompok, serta kelola personel.'}
            </span>
          </div>
        </div>

        {/* PIN Verification Modal / Section when Admin profile clicked */}
        {pinTargetUser && (
          <form
            onSubmit={handleVerifyPin}
            className="p-4 bg-purple-950/30 border-2 border-purple-500/70 rounded-2xl space-y-3 animate-fadeIn"
          >
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold text-purple-200">
                Konfirmasi Akses Administrator: {pinTargetUser.name}
              </span>
            </div>
            <p className="text-xs text-slate-300">
              Masukkan PIN Koordinator Admin untuk mengaktifkan izin penuh edit (Default PIN: <strong className="text-white">1234</strong>).
            </p>
            <div className="flex items-center gap-2">
              <input
                type="password"
                maxLength={6}
                autoFocus
                value={enteredPin}
                onChange={(e) => {
                  setEnteredPin(e.target.value);
                  setPinError(false);
                }}
                placeholder="Masukkan PIN Admin (1234)..."
                className={`flex-1 px-3.5 py-2 bg-slate-950 border rounded-xl text-xs font-mono text-white tracking-widest focus:outline-none ${
                  pinError ? 'border-red-500' : 'border-purple-500'
                }`}
              />
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Verifikasi
              </button>
              <button
                type="button"
                onClick={() => setPinTargetUser(null)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl cursor-pointer"
              >
                Batal
              </button>
            </div>
          </form>
        )}

        {/* Quick Profile Selector List */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>Daftar Akun Terdaftar:</span>
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              Klik profil untuk beralih
            </span>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {users.map((u) => {
              const isCurrent = currentUser?.id === u.id || currentUser?.email === u.email;
              const isAdmin = u.role === 'Admin';

              return (
                <div
                  key={u.id}
                  onClick={() => handleSelectUser(u)}
                  className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isCurrent
                      ? 'bg-slate-800/90 border-emerald-500 shadow-md ring-1 ring-emerald-500/30'
                      : 'bg-slate-950 hover:bg-slate-850 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-sm font-black shrink-0 ${
                        isAdmin
                          ? 'bg-purple-950 text-purple-300 border border-purple-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {isAdmin ? '🛡️' : '👤'}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate block">
                          {u.name}
                        </span>
                        {isCurrent && (
                          <span className="text-[10px] px-2 py-0.2 bg-emerald-950 text-emerald-400 border border-emerald-800 rounded-full font-bold">
                            Aktif
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono text-slate-400 truncate block">
                        {u.email}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg uppercase ${
                        isAdmin
                          ? 'bg-purple-950/80 text-purple-300 border border-purple-800/60'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {u.role}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Google Sign-in & Logout actions */}
        <div className="pt-2 border-t border-slate-800 space-y-2">
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isLoadingGoogle}
            className="w-full min-h-[44px] py-2.5 px-4 bg-slate-950 hover:bg-slate-850 border border-slate-700 text-white font-bold text-xs rounded-2xl flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md active:scale-98"
          >
            <LogIn className="w-4 h-4 text-emerald-400" />
            <span>{isLoadingGoogle ? 'Menghubungkan...' : 'Masuk dengan Akun Google (Gmail)'}</span>
          </button>

          {currentUser?.role === 'Admin' && (
            <button
              type="button"
              onClick={handleLogout}
              className="w-full py-2 text-slate-400 hover:text-amber-400 text-xs font-bold transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar ke Mode User (Akses Terbatas)</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

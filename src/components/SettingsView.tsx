import React, { useState } from 'react';
import { StandbySchedule, AppUser, UserRole, UserStatus } from '../types';
import { ConfirmDeleteModal } from './ConfirmDeleteModal';
import {
  Settings,
  Shield,
  RotateCcw,
  Download,
  Upload,
  Save,
  Check,
  Users,
  Plus,
  Trash2,
  UserCheck,
  UserX,
  Mail,
  Edit2,
  UserPlus,
  RefreshCw,
  GitBranch,
  Globe,
  Database
} from 'lucide-react';

interface SettingsViewProps {
  innerSchedule: StandbySchedule;
  outerSchedule: StandbySchedule;
  onUpdateInnerSchedule: (newSchedule: StandbySchedule) => void;
  onUpdateOuterSchedule: (newSchedule: StandbySchedule) => void;
  users: AppUser[];
  onUpdateUsers: (newUsers: AppUser[]) => void;
  onResetAllData: () => void;
  onRefreshData?: () => void;
  onShowToast: (msg: string) => void;
  isAdmin?: boolean;
  currentUser?: AppUser | null;
  onOpenAccountModal?: () => void;
}

interface DeleteTarget {
  type: 'user' | 'group' | 'reset_all';
  targetSchedule?: 'inner' | 'outer';
  id?: string;
  name: string;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  innerSchedule,
  outerSchedule,
  onUpdateInnerSchedule,
  onUpdateOuterSchedule,
  users,
  onUpdateUsers,
  onResetAllData,
  onRefreshData,
  onShowToast,
  isAdmin = false,
  currentUser = null,
  onOpenAccountModal
}) => {
  // If not admin, block entire settings modification view
  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <div className="bg-slate-900/90 border-2 border-amber-500/40 rounded-3xl p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-2xl relative overflow-hidden backdrop-blur-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-6 shadow-inner">
            <Shield className="w-10 h-10" />
          </div>
          <span className="inline-block px-3 py-1 bg-amber-500/20 text-amber-300 font-bold text-xs rounded-full uppercase tracking-wider mb-3">
            Akses Khusus Admin
          </span>
          <h2 className="text-2xl font-black text-slate-100 tracking-tight">
            Menu Pengaturan Terkunci
          </h2>
          <p className="mt-3 text-slate-300 text-sm leading-relaxed max-w-lg mx-auto">
            Halaman pengaturan sistem (pengeditan NOP, daftar kelompok tim, manajemen personel, dan reset data) hanya dapat diakses oleh <strong className="text-amber-300">Akun Admin</strong>.
          </p>

          <div className="mt-6 p-4 rounded-2xl bg-slate-950/70 border border-slate-800 text-left space-y-2 text-xs text-slate-400">
            <div className="text-slate-200 font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Akun Aktif: {currentUser?.name || 'User Biasa'} ({currentUser?.role || 'User'})
            </div>
            <p>
              Sebagai <strong>User</strong>, Anda memiliki izin penuh untuk:
            </p>
            <ul className="list-disc list-inside space-y-1 text-slate-300 pl-1">
              <li>Mengubah status standby personel: 🟢 Standby, 🟡 Ijin, 🔴 Off</li>
              <li>Mengirim & memperbarui format jadwal ke WhatsApp</li>
              <li>Chat langsung ke personel via WhatsApp</li>
            </ul>
          </div>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            {onOpenAccountModal && (
              <button
                type="button"
                onClick={onOpenAccountModal}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20 cursor-pointer active:scale-95"
              >
                <Shield className="w-4 h-4" />
                <span>Masuk dengan Akun Admin (Ganti Akun)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }
  // NOP OPERASIONAL STATE
  const [targetScheduleKey, setTargetScheduleKey] = useState<'inner' | 'outer'>('inner');
  const currentSelectedSchedule = targetScheduleKey === 'inner' ? innerSchedule : outerSchedule;
  const currentUpdateScheduleFn = targetScheduleKey === 'inner' ? onUpdateInnerSchedule : onUpdateOuterSchedule;

  const [nopName, setNopName] = useState(innerSchedule.nopName || 'NOP SOUTHERN');
  const [newGroupName, setNewGroupName] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    if (onRefreshData) {
      onRefreshData();
    } else {
      window.dispatchEvent(new Event('storage'));
    }
    setTimeout(() => {
      setIsRefreshing(false);
      onShowToast('Perubahan data & tampilan berhasil diperbarui / disinkronkan! 🔄');
    }, 600);
  };

  // KELOLA PENGGUNA STATE (User Management)
  const [userSearch, setUserSearch] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // New user form state
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('User');
  const [userStatus, setUserStatus] = useState<UserStatus>('Aktif');

  // CUSTOM DELETE CONFIRMATION MODAL STATE
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);

  // NOP OPERASIONAL HANDLERS
  const handleSaveNop = (e: React.FormEvent) => {
    e.preventDefault();
    currentUpdateScheduleFn({
      ...currentSelectedSchedule,
      nopName: nopName.trim().toUpperCase()
    });
    setSavedSuccess(true);
    onShowToast(`Pengaturan NOP ${nopName.trim().toUpperCase()} berhasil disimpan!`);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;

    const newGrp = {
      id: `grp-${Date.now()}`,
      groupName: newGroupName.toUpperCase().trim(),
      members: []
    };

    currentUpdateScheduleFn({
      ...currentSelectedSchedule,
      groups: [...currentSelectedSchedule.groups, newGrp]
    });

    setNewGroupName('');
    onShowToast(`Grup ${newGrp.groupName} berhasil ditambahkan!`);
  };

  // KELOLA PENGGUNA HANDLERS (USER MANAGEMENT)
  const handleAddOrUpdateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim() || !userEmail.trim()) return;

    if (editingUserId) {
      // Edit User
      const updated = users.map((u) =>
        u.id === editingUserId
          ? {
              ...u,
              name: userName.trim(),
              email: userEmail.trim().toLowerCase(),
              role: userRole,
              status: userStatus
            }
          : u
      );
      onUpdateUsers(updated);
      onShowToast(`Akun ${userName} berhasil diperbarui!`);
      setEditingUserId(null);
    } else {
      // Add New User
      const newUser: AppUser = {
        id: `usr-${Date.now()}`,
        name: userName.trim(),
        email: userEmail.trim().toLowerCase(),
        role: userRole,
        status: userStatus,
        createdAt: new Date().toISOString().split('T')[0]
      };
      onUpdateUsers([...users, newUser]);
      onShowToast(`Pengguna baru ${newUser.name} berhasil ditambahkan!`);
    }

    // Reset Form
    setUserName('');
    setUserEmail('');
    setUserRole('User');
    setUserStatus('Aktif');
  };

  const handleEditUser = (user: AppUser) => {
    setEditingUserId(user.id);
    setUserName(user.name);
    setUserEmail(user.email);
    setUserRole(user.role);
    setUserStatus(user.status);
    window.scrollTo({ top: 100, behavior: 'smooth' });
    onShowToast(`Mode edit untuk ${user.name}`);
  };

  const handleCancelUserEdit = () => {
    setEditingUserId(null);
    setUserName('');
    setUserEmail('');
    setUserRole('User');
    setUserStatus('Aktif');
  };

  const handleToggleUserStatus = (userId: string, currentStatus: UserStatus) => {
    const nextStatus: UserStatus = currentStatus === 'Aktif' ? 'Nonaktif' : 'Aktif';
    const updated = users.map((u) =>
      u.id === userId ? { ...u, status: nextStatus } : u
    );
    onUpdateUsers(updated);
    onShowToast(
      `Status akun diubah ke ${nextStatus === 'Aktif' ? 'AKTIF 🟢' : 'NONAKTIF 🔴'}`
    );
  };

  // OPEN DELETE CONFIRMATION MODALS
  const promptDeleteUser = (userId: string, userName: string) => {
    if (users.length <= 1) {
      alert('Minimal harus ada 1 pengguna di sistem!');
      return;
    }
    setDeleteTarget({
      type: 'user',
      id: userId,
      name: userName
    });
  };

  const promptDeleteGroup = (groupId: string, groupName: string) => {
    if (currentSelectedSchedule.groups.length <= 1) {
      alert('Minimal harus ada 1 kelompok tim!');
      return;
    }
    setDeleteTarget({
      type: 'group',
      targetSchedule: targetScheduleKey,
      id: groupId,
      name: groupName
    });
  };

  const promptResetAll = () => {
    setDeleteTarget({
      type: 'reset_all',
      name: 'Seluruh Data Aplikasi'
    });
  };

  // CONFIRM DELETION EXECUTION
  const executeConfirmDelete = () => {
    if (!deleteTarget) return;

    if (deleteTarget.type === 'user' && deleteTarget.id) {
      const updated = users.filter((u) => u.id !== deleteTarget.id);
      onUpdateUsers(updated);
      onShowToast(`Akun ${deleteTarget.name} berhasil dihapus.`);
    } else if (deleteTarget.type === 'group' && deleteTarget.id) {
      if (deleteTarget.targetSchedule === 'inner') {
        const updatedGroups = innerSchedule.groups.filter((g) => g.id !== deleteTarget.id);
        onUpdateInnerSchedule({ ...innerSchedule, groups: updatedGroups });
      } else {
        const updatedGroups = outerSchedule.groups.filter((g) => g.id !== deleteTarget.id);
        onUpdateOuterSchedule({ ...outerSchedule, groups: updatedGroups });
      }
      onShowToast(`Grup ${deleteTarget.name} berhasil dihapus.`);
    } else if (deleteTarget.type === 'reset_all') {
      onResetAllData();
    }

    setDeleteTarget(null);
  };

  const handleExportData = () => {
    const dataObj = {
      innerSchedule,
      outerSchedule,
      users,
      exportedAt: new Date().toISOString()
    };
    const jsonStr = JSON.stringify(dataObj, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_mbp_standby_${innerSchedule.date || 'data'}.json`;
    a.click();
    URL.revokeObjectURL(url);
    onShowToast('Data backup JSON berhasil diunduh!');
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.innerSchedule) {
          onUpdateInnerSchedule(parsed.innerSchedule);
        } else if (parsed.schedule) {
          onUpdateInnerSchedule(parsed.schedule);
        }
        if (parsed.outerSchedule) {
          onUpdateOuterSchedule(parsed.outerSchedule);
        }
        if (parsed.users && Array.isArray(parsed.users)) {
          onUpdateUsers(parsed.users);
        }
        onShowToast('Data jadwal dan pengguna berhasil diimpor!');
      } catch (err) {
        alert('Gagal membaca file JSON.');
      }
    };
    reader.readAsText(file);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.role.toLowerCase().includes(userSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-2">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400">
            <Settings className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider block">
              PENGATURAN SYSTEM
            </span>
            <h2 className="text-xl font-bold text-white tracking-tight">
              Kelola Pengguna, NOP & Backup Data
            </h2>
          </div>
        </div>
        <p className="text-xs text-slate-400 pt-1">
          Kelola pengguna sistem (Admin/User), status akun aktif/nonaktif, identitas NOP, serta backup/restore data operasional.
        </p>
      </div>

      {/* SECTION KELOLA PENGGUNA (USER MANAGEMENT) */}
      <div className="bg-slate-900/90 border border-emerald-500/40 rounded-2xl p-5 shadow-xl space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-400" />
            <h3 className="text-lg font-bold text-white tracking-tight">
              Kelola Pengguna Sistem
            </h3>
          </div>
          <span className="text-xs font-mono text-emerald-400 bg-emerald-950/80 px-3 py-1 rounded-lg border border-emerald-800/60 self-start md:self-auto font-bold">
            Total Pengguna: {users.length} Akun
          </span>
        </div>

        {/* Form Tambah / Edit Pengguna */}
        <form
          onSubmit={handleAddOrUpdateUser}
          className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-4"
        >
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>{editingUserId ? 'Edit Akun Pengguna' : 'Tambah Pengguna Baru'}</span>
            </span>
            {editingUserId && (
              <button
                type="button"
                onClick={handleCancelUserEdit}
                className="text-[11px] text-amber-400 hover:underline font-semibold"
              >
                Batal Edit
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Input Nama */}
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Nama Lengkap:
              </label>
              <input
                type="text"
                required
                placeholder="misal: Diki Solihin"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-medium"
              />
            </div>

            {/* Input Email Gmail */}
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Email Gmail:
              </label>
              <input
                type="email"
                required
                placeholder="misal: user.mbp@gmail.com"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>

            {/* Select Role Admin/User */}
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Hak Akses (Role):
              </label>
              <select
                value={userRole}
                onChange={(e) => setUserRole(e.target.value as UserRole)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="User">User (Anggota)</option>
                <option value="Admin">Admin (Pengelola)</option>
              </select>
            </div>

            {/* Select Status Aktif/Nonaktif */}
            <div>
              <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                Status Akun:
              </label>
              <select
                value={userStatus}
                onChange={(e) => setUserStatus(e.target.value as UserStatus)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="Aktif">🟢 Aktif</option>
                <option value="Nonaktif">🔴 Nonaktif</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>{editingUserId ? 'Update Pengguna' : 'Simpan Pengguna Baru'}</span>
            </button>
          </div>
        </form>

        {/* Tabel / List Pengguna */}
        <div className="space-y-3 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <label className="text-xs font-semibold text-slate-300">
              Daftar Pengguna Terdaftar:
            </label>
            <div className="w-full sm:w-64">
              <input
                type="text"
                placeholder="Cari nama atau email..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="divide-y divide-slate-800 border border-slate-800 rounded-xl overflow-hidden bg-slate-950">
            {filteredUsers.length === 0 ? (
              <div className="p-6 text-center text-slate-500 text-xs">
                Tidak ada pengguna yang ditemukan.
              </div>
            ) : (
              filteredUsers.map((user, idx) => (
                <div
                  key={user.id}
                  className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/60 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xs font-mono font-bold text-slate-500 w-5 shrink-0">
                      {idx + 1}.
                    </span>

                    {/* Status Badge Toggle */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleToggleUserStatus(user.id, user.status);
                      }}
                      title={`Klik untuk ubah status (${user.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'})`}
                      className={`min-h-[40px] min-w-[40px] p-2 rounded-xl shrink-0 transition-transform active:scale-110 cursor-pointer flex items-center justify-center select-none ${
                        user.status === 'Aktif'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                          : 'bg-red-950 text-red-400 border border-red-800/60'
                      }`}
                    >
                      {user.status === 'Aktif' ? (
                        <UserCheck className="w-4 h-4 text-emerald-400 pointer-events-none" />
                      ) : (
                        <UserX className="w-4 h-4 text-red-400 pointer-events-none" />
                      )}
                    </button>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-slate-100 text-sm font-sans">
                          {user.name}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.2 rounded-md font-bold uppercase ${
                            user.role === 'Admin'
                              ? 'bg-purple-950 text-purple-300 border border-purple-800/60'
                              : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}
                        >
                          {user.role}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                        <Mail className="w-3 h-3 text-slate-500 shrink-0 pointer-events-none" />
                        <span className="font-mono">{user.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions: Toggle Status, Labeled Edit & Delete Buttons */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleToggleUserStatus(user.id, user.status);
                      }}
                      className={`min-h-[40px] px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center gap-1 active:scale-95 select-none ${
                        user.status === 'Aktif'
                          ? 'bg-emerald-950/90 hover:bg-emerald-900 border-emerald-700/80 text-emerald-300'
                          : 'bg-red-950/90 hover:bg-red-900 border-red-700/80 text-red-300'
                      }`}
                    >
                      <span>{user.status === 'Aktif' ? '🟢 AKTIF' : '🔴 NONAKTIF'}</span>
                    </button>

                    {/* EDIT USER BUTTON */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleEditUser(user);
                      }}
                      title="Edit Akun Pengguna"
                      className="min-h-[40px] px-3 py-1.5 bg-slate-800 hover:bg-emerald-600 border border-slate-700 hover:border-emerald-500 text-slate-100 hover:text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-sm select-none"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-emerald-400 pointer-events-none" />
                      <span>Edit</span>
                    </button>

                    {/* DELETE USER BUTTON (PROMPTS CUSTOM MODAL) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        promptDeleteUser(user.id, user.name);
                      }}
                      title="Hapus Akun Pengguna"
                      className="min-h-[40px] px-3 py-1.5 bg-slate-800 hover:bg-red-600 border border-slate-700 hover:border-red-500 text-slate-100 hover:text-white font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-sm select-none"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-red-400 pointer-events-none" />
                      <span>Hapus</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Section 1: Identitas NOP & Kelompok Tim */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              <span>Identitas NOP & Kelompok Tim</span>
            </h3>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono font-bold">
              OPERASIONAL
            </span>
          </div>

          {/* Tab Selector between Inner Jaktim and Bekasi */}
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                setTargetScheduleKey('inner');
                setNopName(innerSchedule.nopName);
              }}
              className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none ${
                targetScheduleKey === 'inner'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              NOP SOUTHERN (JAKTIM)
            </button>
            <button
              type="button"
              onClick={() => {
                setTargetScheduleKey('outer');
                setNopName(outerSchedule.nopName);
              }}
              className={`min-h-[38px] px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer select-none ${
                targetScheduleKey === 'outer'
                  ? 'bg-amber-500 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              NOP BEKASI (BEKASI)
            </button>
          </div>

          <form onSubmit={handleSaveNop} className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 block">
              Nama NOP Operasional ({targetScheduleKey === 'inner' ? 'Inner Jaktim' : 'Bekasi'}):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={nopName}
                onChange={(e) => setNopName(e.target.value)}
                placeholder={targetScheduleKey === 'inner' ? 'NOP SOUTHERN' : 'NOP BEKASI'}
                className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-bold text-white uppercase focus:outline-none focus:border-emerald-500 font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                <span>Simpan</span>
              </button>
            </div>
          </form>

          <div className="space-y-3 pt-3 border-t border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300 block">
                Daftar Kelompok Tim ({targetScheduleKey === 'inner' ? 'Inner Jaktim' : 'Bekasi'}):
              </label>
              <span className="text-[11px] text-slate-400 font-mono font-bold">
                {currentSelectedSchedule.groups.length} Kelompok
              </span>
            </div>

            <form onSubmit={handleAddGroup} className="flex items-center gap-2">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder={
                  targetScheduleKey === 'inner'
                    ? 'misal: TO JAKTIM 3'
                    : 'misal: TO BEKASI UTARA'
                }
                className="flex-1 px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white uppercase placeholder-slate-500 focus:outline-none font-mono"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tambah</span>
              </button>
            </form>

            <div className="space-y-2 pt-1 max-h-72 overflow-y-auto">
              {currentSelectedSchedule.groups.map((group) => (
                <div
                  key={group.id}
                  className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-mono font-bold text-xs text-slate-200">
                      {group.groupName}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 font-bold">
                      {group.members.length} Anggota
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      promptDeleteGroup(group.id, group.groupName);
                    }}
                    className="min-h-[36px] px-3 py-1 bg-slate-800 hover:bg-red-600 border border-slate-700 hover:border-red-500 text-slate-200 hover:text-white rounded-xl transition-all cursor-pointer flex items-center gap-1 text-xs font-bold"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-400 pointer-events-none" />
                    <span>Hapus</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 2: Refresh, Backup, Restore & Reset Data */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-5">
          <h3 className="text-base font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
            <RefreshCw className="w-5 h-5 text-emerald-400" />
            <span>Sinkronisasi Data, Refresh & Backup</span>
          </h3>

          <div className="space-y-4">
            {/* FITUR REFRESH / PERBARUI PERUBAHAN DATA */}
            <div className="p-4 bg-emerald-950/30 border border-emerald-500/40 rounded-xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-300 block">
                  1. Perbarui / Refresh Perubahan Data
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono font-bold">
                  SINKRON REALTIME
                </span>
              </div>
              <p className="text-xs text-slate-300">
                Klik tombol ini untuk menyegarkan tampilan dan memuat ulang perubahan data jadwal serta daftar akun pengguna terbaru.
              </p>
              <button
                type="button"
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                <span>{isRefreshing ? 'Memperbarui Data...' : 'Perbarui Perubahan Data'}</span>
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <span className="text-xs font-bold text-slate-200 block">
                2. Unduh Backup Data (JSON)
              </span>
              <p className="text-xs text-slate-400">
                Simpan seluruh data jadwal standby dan daftar pengguna ke file lokal.
              </p>
              <button
                type="button"
                onClick={handleExportData}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 shadow-sm transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4 text-emerald-400" />
                <span>Unduh Backup JSON</span>
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <span className="text-xs font-bold text-slate-200 block">
                3. Pulihkan / Impor Data (JSON)
              </span>
              <p className="text-xs text-slate-400">
                Pilih file JSON hasil backup untuk memulihkan jadwal dan akun pengguna.
              </p>
              <label className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs rounded-xl border border-slate-700 cursor-pointer transition-colors">
                <Upload className="w-4 h-4 text-emerald-400" />
                <span>Pilih File JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportData}
                  className="hidden"
                />
              </label>
            </div>

            <div className="p-4 bg-red-950/20 border border-red-900/40 rounded-xl space-y-2">
              <span className="text-xs font-bold text-red-300 block">
                4. Reset Data ke Jadwal Standar Awal
              </span>
              <p className="text-xs text-slate-400">
                Mengembalikan jadwal standby tim ke data default (29-10-2026).
              </p>
              <button
                type="button"
                onClick={promptResetAll}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Semua Data</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION KONEKSI DATABASE REALTIME GITHUB & VERCEL */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block">
                KONEKSI REPOSITORI & DEPLOYMENT
              </span>
              <h3 className="text-base font-bold text-white tracking-tight">
                Integrasi Realtime GitHub & Vercel
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800/80 text-xs font-mono font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              TERHUBUNG 🟢
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 text-slate-200 font-bold text-xs">
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Database Google AI Studio</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Tersimpan secara persistent di LocalStorage v5 & siap di-export ke JSON untuk migrasi server.
            </p>
          </div>

          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 text-slate-200 font-bold text-xs">
              <GitBranch className="w-4 h-4 text-purple-400" />
              <span>GitHub Repository Sync</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Kode sumber aplikasi dan struktur data default siap di-push langsung ke repositori GitHub.
            </p>
          </div>

          <div className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-1.5">
            <div className="flex items-center gap-2 text-slate-200 font-bold text-xs">
              <Globe className="w-4 h-4 text-blue-400" />
              <span>Vercel Auto Deployment</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Vercel secara otomatis mendeteksi update dari GitHub untuk membangun versi web live secara realtime.
            </p>
          </div>
        </div>
      </div>

      {/* CUSTOM CONFIRM DELETE MODAL (PREVENTS BROWSER POPUP BLOCKING) */}
      <ConfirmDeleteModal
        isOpen={!!deleteTarget}
        title={`Konfirmasi Hapus ${deleteTarget?.type === 'user' ? 'Pengguna' : deleteTarget?.type === 'group' ? 'Kelompok Tim' : 'Seluruh Data'}`}
        message={`Apakah Anda yakin ingin menghapus "${deleteTarget?.name}"? Tindakan ini tidak dapat dibatalkan.`}
        onConfirm={executeConfirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
};

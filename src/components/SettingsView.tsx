import React, { useState } from 'react';
import { StandbySchedule, AppUser, UserRole, UserStatus } from '../types';
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
  UserPlus
} from 'lucide-react';

interface SettingsViewProps {
  schedule: StandbySchedule;
  onUpdateSchedule: (newSchedule: StandbySchedule) => void;
  users: AppUser[];
  onUpdateUsers: (newUsers: AppUser[]) => void;
  onResetAllData: () => void;
  onShowToast: (msg: string) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  schedule,
  onUpdateSchedule,
  users,
  onUpdateUsers,
  onResetAllData,
  onShowToast
}) => {
  const [nopName, setNopName] = useState(schedule.nopName);
  const [newGroupName, setNewGroupName] = useState('');
  const [savedSuccess, setSavedSuccess] = useState(false);

  // KELOLA PENGGUNA STATE (User Management)
  const [userSearch, setUserSearch] = useState('');
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // New user form state
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('User');
  const [userStatus, setUserStatus] = useState<UserStatus>('Aktif');

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSchedule({
      ...schedule,
      nopName
    });
    setSavedSuccess(true);
    onShowToast('Pengaturan NOP berhasil disimpan!');
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

    onUpdateSchedule({
      ...schedule,
      groups: [...schedule.groups, newGrp]
    });

    setNewGroupName('');
    onShowToast(`Grup ${newGrp.groupName} berhasil ditambahkan!`);
  };

  const handleDeleteGroup = (groupId: string, groupName: string) => {
    if (schedule.groups.length <= 1) {
      alert('Minimal harus ada 1 kelompok tim!');
      return;
    }
    if (!window.confirm(`Hapus grup ${groupName} beserta seluruh personelnya?`)) return;

    const updatedGroups = schedule.groups.filter((g) => g.id !== groupId);
    onUpdateSchedule({ ...schedule, groups: updatedGroups });
    onShowToast(`Grup ${groupName} telah dihapus.`);
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

  const handleDeleteUser = (userId: string, userName: string) => {
    if (users.length <= 1) {
      alert('Minimal harus ada 1 pengguna di sistem!');
      return;
    }
    if (!window.confirm(`Hapus akun pengguna ${userName}?`)) return;

    const updated = users.filter((u) => u.id !== userId);
    onUpdateUsers(updated);
    onShowToast(`Akun ${userName} telah dihapus.`);
  };

  const handleExportData = () => {
    const dataObj = {
      schedule,
      users,
      exportedAt: new Date().toISOString()
    };
    const jsonStr = JSON.stringify(dataObj, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_mbp_jaktim_${schedule.date || 'data'}.json`;
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
        if (parsed.schedule) {
          onUpdateSchedule(parsed.schedule);
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
                      className={`min-h-[36px] min-w-[36px] p-2 rounded-xl shrink-0 transition-transform active:scale-110 cursor-pointer flex items-center justify-center ${
                        user.status === 'Aktif'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                          : 'bg-red-950 text-red-400 border border-red-800/60'
                      }`}
                    >
                      {user.status === 'Aktif' ? (
                        <UserCheck className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <UserX className="w-4 h-4 text-red-400" />
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
                        <Mail className="w-3 h-3 text-slate-500 shrink-0" />
                        <span className="font-mono">{user.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Actions: Toggle Status Button, Edit Icon & Delete Icon (PERFECTLY CLICKABLE) */}
                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleToggleUserStatus(user.id, user.status);
                      }}
                      className={`min-h-[38px] px-3 py-1.5 text-xs font-bold rounded-xl border transition-all cursor-pointer flex items-center gap-1 active:scale-95 select-none ${
                        user.status === 'Aktif'
                          ? 'bg-emerald-950/90 hover:bg-emerald-900 border-emerald-700/80 text-emerald-300'
                          : 'bg-red-950/90 hover:bg-red-900 border-red-700/80 text-red-300'
                      }`}
                    >
                      <span>{user.status === 'Aktif' ? '🟢 AKTIF' : '🔴 NONAKTIF'}</span>
                    </button>

                    {/* EDIT USER BUTTON (FIXED & FULLY CLICKABLE) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleEditUser(user);
                      }}
                      title="Edit Akun Pengguna"
                      className="min-h-[38px] min-w-[38px] px-2.5 py-1.5 bg-slate-800 hover:bg-emerald-600 hover:text-white border border-slate-700 text-slate-200 rounded-xl transition-all cursor-pointer flex items-center justify-center active:scale-95 shadow-sm"
                    >
                      <Edit2 className="w-4 h-4 text-emerald-400 hover:text-white" />
                    </button>

                    {/* DELETE USER BUTTON (FIXED & FULLY CLICKABLE) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleDeleteUser(user.id, user.name);
                      }}
                      title="Hapus Akun Pengguna"
                      className="min-h-[38px] min-w-[38px] px-2.5 py-1.5 bg-slate-800 hover:bg-red-600 hover:text-white border border-slate-700 text-slate-200 rounded-xl transition-all cursor-pointer flex items-center justify-center active:scale-95 shadow-sm"
                    >
                      <Trash2 className="w-4 h-4 text-red-400 hover:text-white" />
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
          <h3 className="text-base font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
            <Shield className="w-5 h-5 text-emerald-400" />
            <span>Identitas NOP & Kelompok Tim</span>
          </h3>

          <form onSubmit={handleSaveGeneral} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">
                Nama NOP Operasional:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={nopName}
                  onChange={(e) => setNopName(e.target.value)}
                  placeholder="misal: NOP SOUTHERN"
                  className="flex-1 px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs font-bold text-white uppercase focus:outline-none focus:border-emerald-500 font-mono"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {savedSuccess ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                  <span>Simpan</span>
                </button>
              </div>
            </div>
          </form>

          {/* Group Management */}
          <div className="space-y-3 pt-3 border-t border-slate-800">
            <label className="text-xs font-semibold text-slate-300 block">
              Daftar Kelompok Tim (TO Area):
            </label>

            <form onSubmit={handleAddGroup} className="flex items-center gap-2">
              <input
                type="text"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                placeholder="Nama Kelompok Baru (misal: TO JAKTIM 3)"
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white uppercase placeholder-slate-500 focus:outline-none font-mono"
              />
              <button
                type="submit"
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tambah Group</span>
              </button>
            </form>

            <div className="space-y-2 pt-2">
              {schedule.groups.map((group) => (
                <div
                  key={group.id}
                  className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2.5">
                    <Users className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span className="font-mono font-bold text-xs text-slate-200">
                      {group.groupName}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
                      {group.members.length} Anggota
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteGroup(group.id, group.groupName);
                    }}
                    className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Section 2: Export, Import & Reset Data */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-lg space-y-5">
          <h3 className="text-base font-bold text-white flex items-center gap-2 pb-3 border-b border-slate-800">
            <Download className="w-5 h-5 text-emerald-400" />
            <span>Backup, Restore & Reset Data</span>
          </h3>

          <div className="space-y-4">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <span className="text-xs font-bold text-slate-200 block">
                1. Unduh Backup Data (JSON)
              </span>
              <p className="text-xs text-slate-400">
                Simpan seluruh data jadwal standby dan daftar pengguna ke file lokal.
              </p>
              <button
                type="button"
                onClick={handleExportData}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Backup JSON</span>
              </button>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <span className="text-xs font-bold text-slate-200 block">
                2. Pulihkan / Impor Data (JSON)
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
                3. Reset Data ke Jadwal Standar Awal
              </span>
              <p className="text-xs text-slate-400">
                Mengembalikan jadwal standby tim ke data default (29-10-2026).
              </p>
              <button
                type="button"
                onClick={onResetAllData}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs rounded-xl shadow-md transition-colors flex items-center gap-2 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset Semua Data</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

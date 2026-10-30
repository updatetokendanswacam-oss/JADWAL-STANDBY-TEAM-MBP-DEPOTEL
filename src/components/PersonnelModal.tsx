import React, { useState, useEffect } from 'react';
import { Personnel, MemberStatus, TeamGroup } from '../types';
import { X, UserPlus, Save, Phone, User } from 'lucide-react';

interface PersonnelModalProps {
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  groups: TeamGroup[];
  editingMember?: Personnel | null;
  onSave: (targetGroupId: string, member: Personnel) => void;
}

export const PersonnelModal: React.FC<PersonnelModalProps> = ({
  isOpen,
  onClose,
  groupId,
  groups,
  editingMember,
  onSave
}) => {
  const [selectedGroupId, setSelectedGroupId] = useState(groupId);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<MemberStatus>('standby');

  useEffect(() => {
    setSelectedGroupId(groupId || (groups[0]?.id ?? ''));
    if (editingMember) {
      setName(editingMember.name);
      setPhone(editingMember.phone);
      setStatus(editingMember.status);
    } else {
      setName('');
      setPhone('');
      setStatus('standby');
    }
  }, [groupId, editingMember, isOpen, groups]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    const memberData: Personnel = {
      id: editingMember ? editingMember.id : `p-${Date.now()}`,
      name: name.toUpperCase().trim(),
      phone: phone.replace(/[^0-9]/g, '').trim(),
      status,
      shiftPattern: editingMember?.shiftPattern,
      shiftOffset: editingMember?.shiftOffset
    };

    onSave(selectedGroupId, memberData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-slate-100 text-base">
              {editingMember ? 'Edit Data Personel' : 'Tambah Personel Baru'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Kelompok Tim:
            </label>
            <select
              value={selectedGroupId}
              onChange={(e) => setSelectedGroupId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
            >
              {groups.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.groupName}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Nama Lengkap Personel:
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                placeholder="misal: DIKI SOLIHIN"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 uppercase font-semibold"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Nomor Telepon / WhatsApp:
            </label>
            <div className="relative">
              <Phone className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                placeholder="misal: 0813996457698"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-300 block mb-1.5">
              Status Piket Awal:
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setStatus('standby')}
                className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                  status === 'standby'
                    ? 'bg-emerald-600 text-white border-emerald-500 shadow-md ring-2 ring-emerald-500/30'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                <span>🟢</span>
                <span>Standby</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('off')}
                className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                  status === 'off'
                    ? 'bg-red-600 text-white border-red-500 shadow-md ring-2 ring-red-500/30'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                <span>🔴</span>
                <span>Off</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('ijin_sakit')}
                className={`py-2 px-3 text-xs font-bold rounded-xl border flex items-center justify-center gap-1.5 transition-all ${
                  status === 'ijin_sakit'
                    ? 'bg-amber-600 text-white border-amber-500 shadow-md ring-2 ring-amber-500/30'
                    : 'bg-slate-950 text-slate-400 border-slate-800'
                }`}
              >
                <span>🟡</span>
                <span>Ijin/Sakit</span>
              </button>
            </div>
          </div>

          <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl transition-colors shadow-md flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Simpan Personel</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

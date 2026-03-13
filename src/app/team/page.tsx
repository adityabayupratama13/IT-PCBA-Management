'use client';
import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Eye, EyeOff, Shield, ExternalLink, Users, CheckCircle2, UserX } from 'lucide-react';
import { DataTable } from '@/components/DataTable';
import { Modal, ConfirmDialog } from '@/components/Modal';
import { toast } from 'sonner';
import { useAuth, type Member, MASTER_ACCOUNT } from '@/context/AuthContext';
import Link from 'next/link';

// Dynamic color based on role string hash
function roleColor(role: string): string {
  const palette = [
    'bg-violet-500/15 text-violet-400 border-violet-500/25',
    'bg-blue-500/15 text-blue-400 border-blue-500/25',
    'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
    'bg-orange-500/15 text-orange-400 border-orange-500/25',
    'bg-pink-500/15 text-pink-400 border-pink-500/25',
    'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
    'bg-amber-500/15 text-amber-400 border-amber-500/25',
    'bg-rose-500/15 text-rose-400 border-rose-500/25',
  ];
  let hash = 0;
  for (let i = 0; i < role.length; i++) hash = role.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

const RoleBadge = ({ role }: { role: string }) => (
  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${roleColor(role)}`}>{role}</span>
);

interface Position { id: number; name: string; division: string; level: string; }

export default function TeamPage() {
  const { isMaster, members, addMember, updateMember, deleteMember } = useAuth();

  // Live positions from DB
  const [positions, setPositions] = useState<Position[]>([]);
  useEffect(() => {
    fetch('/api/positions').then(r => r.json()).then(setPositions).catch(() => {});
  }, []);
  const roleNames = positions.map(p => p.name);

  const allMembers = [MASTER_ACCOUNT, ...members];
  const isMasterRecord = (m: Member) => m.id === MASTER_ACCOUNT.id;

  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
  const [showPw, setShowPw] = useState(false);

  const filteredMembers = allMembers.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) || m.badge.includes(search);
    const matchRole   = filterRole === 'All' || m.role === filterRole;
    const matchStatus = filterStatus === 'All' || m.status === filterStatus;
    return matchSearch && matchRole && matchStatus;
  });

  const activeCount   = members.filter(m => m.status === 'Active').length;
  const inactiveCount = members.filter(m => m.status === 'Inactive').length;

  const openAddModal = () => {
    if (!isMaster) { toast.error('Only the IT Master can register new members'); return; }
    setEditingMember(null); setShowPw(false); setIsModalOpen(true);
  };
  const openEditModal = (member: Member) => {
    setEditingMember(member); setShowPw(false); setIsModalOpen(true);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    deleteMember(deleteTarget.id);
    toast.success(`Member "${deleteTarget.name}" removed`);
    setDeleteTarget(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const data = {
      name:     fd.get('name') as string,
      badge:    fd.get('badge') as string,
      password: (fd.get('password') as string) || editingMember?.password || '',
      role:     fd.get('role') as string,
      division: fd.get('division') as string,
      status:   fd.get('status') as 'Active' | 'Inactive',
      email:    (fd.get('email') as string) || '',
      phone:    (fd.get('phone') as string) || '',
    };
    const dupBadge = allMembers.find(m => m.badge === data.badge && m.id !== editingMember?.id);
    if (dupBadge) { toast.error('Badge Number already registered'); return; }

    if (editingMember) {
      updateMember({ ...editingMember, ...data });
      toast.success(`Member "${data.name}" updated`);
    } else {
      addMember(data);
      toast.success(`Member "${data.name}" registered`);
    }
    setIsModalOpen(false);
  };

  const avatarColors = ['from-violet-500/40 to-blue-500/40', 'from-emerald-500/40 to-cyan-500/40', 'from-orange-500/40 to-pink-500/40', 'from-primary/40 to-violet-500/40'];

  const columns = [
    {
      header: 'Member',
      accessor: (m: Member) => (
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${avatarColors[m.id % avatarColors.length]} flex items-center justify-center text-foreground font-bold text-sm border border-white/10 flex-shrink-0`}>
            {m.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="font-semibold text-foreground flex items-center gap-1.5">
              {m.name}
              {isMasterRecord(m) && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/25">
                  <Shield className="w-2.5 h-2.5" /> MASTER
                </span>
              )}
            </div>
            {m.email && <div className="text-xs text-muted-foreground">{m.email}</div>}
          </div>
        </div>
      )
    },
    { header: 'Badge', accessor: (m: Member) => <code className="font-mono text-xs px-2 py-1 rounded font-semibold bg-muted text-muted-foreground border border-border">{m.badge}</code> },
    { header: 'Role / Jabatan', accessor: (m: Member) => <RoleBadge role={m.role} /> },
    { header: 'Division', accessor: (m: Member) => <span className="text-sm text-muted-foreground">{m.division}</span> },
    {
      header: 'Status',
      accessor: (m: Member) => (
        <span className="flex items-center gap-2 text-sm">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${m.status === 'Active' ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.6)]' : 'bg-gray-400'}`} />
          {m.status}
        </span>
      )
    },
    { header: 'Joined', accessor: (m: Member) => <span className="text-xs text-muted-foreground">{m.created_at ? new Date(m.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span> },
    {
      header: 'Actions',
      accessor: (m: Member) => isMasterRecord(m) ? (
        <span className="text-xs text-muted-foreground italic">Protected</span>
      ) : isMaster ? (
        <div className="flex items-center gap-2">
          <button onClick={() => openEditModal(m)} className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
          <button onClick={() => setDeleteTarget(m)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Remove"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      ) : <span className="text-xs text-muted-foreground">—</span>
    },
  ];

  const inputClass = "w-full rounded-lg px-3 py-2 text-sm text-foreground border border-border transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-gray-50 dark:bg-background";

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Team Management</h1>
          <p className="text-muted-foreground mt-1">IT Department — {allMembers.length} members total</p>
        </div>
        {isMaster && (
          <button onClick={openAddModal} className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm">
            <Plus className="w-4 h-4" /> Add Member
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-2xl border p-4 flex items-center gap-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-primary"><Users className="w-5 h-5" /></div>
          <div><p className="text-sm text-muted-foreground">Total Members</p><p className="text-2xl font-bold text-foreground">{allMembers.length}</p></div>
        </div>
        <div className="rounded-2xl border p-4 flex items-center gap-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"><CheckCircle2 className="w-5 h-5" /></div>
          <div><p className="text-sm text-muted-foreground">Active</p><p className="text-2xl font-bold text-emerald-400">{activeCount + 1}</p></div>
        </div>
        <div className="rounded-2xl border p-4 flex items-center gap-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="p-2.5 rounded-xl bg-gray-500/10 border border-gray-500/20 text-gray-400"><UserX className="w-5 h-5" /></div>
          <div><p className="text-sm text-muted-foreground">Inactive</p><p className="text-2xl font-bold text-gray-400">{inactiveCount}</p></div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search by name or badge..." value={search} onChange={e => setSearch(e.target.value)} className={inputClass + ' pl-9'} />
        </div>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className={inputClass + ' min-w-[160px] cursor-pointer'}>
          <option value="All">All Roles</option>
          {roleNames.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={inputClass + ' min-w-[120px] cursor-pointer'}>
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      <DataTable columns={columns} data={filteredMembers} keyExtractor={item => item.id} />

      {/* Positions link banner */}
      <Link href="/positions" className="flex items-center gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/8 transition-colors group">
        <div className="p-2 rounded-lg bg-primary/15 text-primary border border-primary/20"><Shield className="w-4 h-4" /></div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">Manage Job Positions</p>
          <p className="text-xs text-muted-foreground">Add, edit or remove positions in the Jabatan module. Changes update this dropdown immediately.</p>
        </div>
        <ExternalLink className="w-4 h-4 text-primary group-hover:translate-x-1 transition-transform" />
      </Link>

      {/* Add/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingMember ? 'Edit Member' : 'Register New Member'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Full Name *</label>
              <input name="name" required defaultValue={editingMember?.name} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Badge Number *</label>
              <input name="badge" required defaultValue={editingMember?.badge} placeholder="e.g. 36001" className={inputClass + ' font-mono'} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              Password {editingMember ? '(leave blank to keep)' : '*'}
            </label>
            <div className="relative">
              <input name="password" type={showPw ? 'text' : 'password'} required={!editingMember}
                placeholder={editingMember ? '••••••••' : 'Set login password'} className={inputClass + ' pr-10'} />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-muted-foreground">Role / Jabatan *</label>
              <Link href="/positions" onClick={() => setIsModalOpen(false)} className="text-xs text-primary hover:underline flex items-center gap-1">
                <ExternalLink className="w-3 h-3" /> Manage Positions
              </Link>
            </div>
            <select name="role" defaultValue={editingMember?.role || roleNames[0] || 'IT Support'} className={inputClass + ' cursor-pointer'}>
              {roleNames.length > 0
                ? roleNames.map(r => <option key={r} value={r}>{r}</option>)
                : <option>Loading positions...</option>
              }
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Division</label>
              <input name="division" defaultValue={editingMember?.division} placeholder="e.g. Helpdesk" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Status</label>
              <select name="status" defaultValue={editingMember?.status || 'Active'} className={inputClass + ' cursor-pointer'}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Email</label>
              <input name="email" type="email" defaultValue={editingMember?.email} placeholder="user@company.com" className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Phone</label>
              <input name="phone" defaultValue={editingMember?.phone} placeholder="+62 8xx" className={inputClass} />
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-border">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
              {editingMember ? 'Save Changes' : 'Register Member'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Remove Member" message={`Remove "${deleteTarget?.name}" (Badge: ${deleteTarget?.badge})? They will lose login access immediately.`} />
    </div>
  );
}

'use client';
import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, Eye, EyeOff, Shield, ExternalLink, Users, CheckCircle2, UserX } from 'lucide-react';
import { DataTable } from '@/components/DataTable';
import { Modal, ConfirmDialog } from '@/components/Modal';
import { toast } from 'sonner';
import { useAuth, type Member, MASTER_ACCOUNT } from '@/context/AuthContext';
import Link from 'next/link';

// Deterministic color from string
function roleColor(role: string): string {
  const palette = [
    'bg-violet-500/20 text-violet-300 border-violet-500/30',
    'bg-blue-500/20 text-blue-300 border-blue-500/30',
    'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    'bg-orange-500/20 text-orange-300 border-orange-500/30',
    'bg-pink-500/20 text-pink-300 border-pink-500/30',
    'bg-cyan-500/20 text-cyan-300 border-cyan-500/30',
    'bg-amber-500/20 text-amber-300 border-amber-500/30',
    'bg-rose-500/20 text-rose-300 border-rose-500/30',
  ];
  let h = 0;
  for (let i = 0; i < role.length; i++) h = role.charCodeAt(i) + ((h << 5) - h);
  return palette[Math.abs(h) % palette.length];
}

const AVATAR_GRADIENTS = [
  'from-violet-500 to-indigo-600',
  'from-emerald-500 to-teal-600',
  'from-orange-500 to-rose-600',
  'from-primary to-violet-600',
  'from-cyan-500 to-blue-600',
];

const RoleBadge = ({ role }: { role: string }) => (
  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border backdrop-blur-sm ${roleColor(role)}`}>{role}</span>
);

interface Position { id: number; name: string; division: string; level: string; }

export default function TeamPage() {
  const { isMaster, currentUser, members, addMember, updateMember, deleteMember } = useAuth();

  // Live positions from DB
  const [positions, setPositions] = useState<Position[]>([]);
  useEffect(() => {
    fetch('/api/positions').then(r => r.json()).then(setPositions).catch(() => {});
  }, []);
  const roleNames = positions.map(p => p.name);

  // Master account for display — allow master to edit own profile
  const masterDisplay: Member = currentUser && isMaster ? { ...MASTER_ACCOUNT, ...currentUser } : MASTER_ACCOUNT;
  const allMembers: Member[] = [masterDisplay, ...members];
  const isMasterRecord = (m: Member) => m.id === MASTER_ACCOUNT.id || m.badge === MASTER_ACCOUNT.badge;

  const [search, setSearch]       = useState('');
  const [filterRole, setFilterRole]     = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [deleteTarget, setDeleteTarget]   = useState<Member | null>(null);
  const [showPw, setShowPw]         = useState(false);
  const [saving, setSaving]         = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const filtered = allMembers.filter(m => {
    const q = search.toLowerCase();
    const matchSearch = m.name.toLowerCase().includes(q) || m.badge.includes(q) || (m.email || '').toLowerCase().includes(q);
    const matchRole   = filterRole === 'All' || m.role === filterRole;
    const matchStatus = filterStatus === 'All' || m.status === filterStatus;
    return matchSearch && matchRole && matchStatus;
  });

  const activeCount   = allMembers.filter(m => m.status === 'Active').length;
  const inactiveCount = allMembers.filter(m => m.status !== 'Active').length;

  const openAddModal = () => {
    if (!isMaster) { toast.error('Only the IT Master can register new members'); return; }
    setEditingMember(null); setShowPw(false); setIsModalOpen(true);
  };
  const openEditModal = (member: Member) => {
    setEditingMember(member); setShowPw(false); setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteMember(deleteTarget.id);
    toast.success(`Member "${deleteTarget.name}" removed`);
    setDeleteTarget(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    const fd = new FormData(e.target as HTMLFormElement);
    const pw = fd.get('password') as string;
    const data = {
      name:     (fd.get('name') as string).trim(),
      badge:    (fd.get('badge') as string).trim(),
      password: pw || editingMember?.password || '',
      role:     fd.get('role') as string,
      division: (fd.get('division') as string).trim(),
      status:   fd.get('status') as 'Active' | 'Inactive',
      email:    (fd.get('email') as string).trim(),
      phone:    (fd.get('phone') as string).trim(),
    };
    if (!data.name || !data.badge) { toast.error('Name and Badge are required'); setSaving(false); return; }
    const dupBadge = allMembers.find(m => m.badge === data.badge && m.id !== editingMember?.id);
    if (dupBadge) { toast.error('Badge Number already registered'); setSaving(false); return; }

    try {
      if (editingMember && isMasterRecord(editingMember)) {
        // Editing the master account — update locally via updateMember (which also calls API)
        const updated = { ...MASTER_ACCOUNT, ...editingMember, ...data, id: MASTER_ACCOUNT.id };
        await updateMember(updated);
        toast.success('Master profile updated');
      } else if (editingMember) {
        await updateMember({ ...editingMember, ...data });
        toast.success(`${data.name} updated`);
      } else {
        if (!pw) { toast.error('Password is required for new members'); setSaving(false); return; }
        await addMember(data);
        toast.success(`${data.name} registered`);
      }
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const inputCls = "w-full rounded-xl px-3 py-2.5 text-sm text-foreground border border-border/60 transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white/5 dark:bg-white/[0.04] backdrop-blur-sm placeholder:text-muted-foreground/50";

  const columns = [
    {
      header: 'Member',
      accessor: (m: Member) => (
        <div className="flex items-center gap-3">
          <div className={`relative w-10 h-10 rounded-xl bg-gradient-to-br ${AVATAR_GRADIENTS[Math.abs(m.id) % AVATAR_GRADIENTS.length]} flex items-center justify-center text-white font-bold text-sm shadow-lg flex-shrink-0`}>
            {m.name.charAt(0).toUpperCase()}
            {m.status === 'Active' && <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[var(--background)] shadow-[0_0_8px_rgba(52,211,153,0.7)]" />}
          </div>
          <div>
            <div className="font-semibold text-foreground flex items-center gap-1.5 text-sm">
              {m.name}
              {isMasterRecord(m) && (
                <span className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-primary/20 text-primary border border-primary/30 backdrop-blur-sm">
                  <Shield className="w-2.5 h-2.5" /> MASTER
                </span>
              )}
            </div>
            {m.email && <div className="text-xs text-muted-foreground">{m.email}</div>}
          </div>
        </div>
      )
    },
    { header: 'Badge', accessor: (m: Member) => <code className="font-mono text-xs px-2 py-1 rounded-lg bg-muted/60 text-muted-foreground border border-border/40 backdrop-blur-sm">{m.badge}</code> },
    { header: 'Role', accessor: (m: Member) => <RoleBadge role={m.role} /> },
    { header: 'Division', accessor: (m: Member) => <span className="text-sm text-muted-foreground">{m.division}</span> },
    {
      header: 'Status',
      accessor: (m: Member) => (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${m.status === 'Active' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25' : 'bg-gray-500/15 text-gray-400 border-gray-500/25'}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${m.status === 'Active' ? 'bg-emerald-400' : 'bg-gray-400'}`} />
          {m.status}
        </span>
      )
    },
    { header: 'Joined', accessor: (m: Member) => <span className="text-xs text-muted-foreground">{m.created_at ? new Date(m.created_at).toLocaleDateString('en-GB') : '—'}</span> },
    {
      header: 'Actions',
      accessor: (m: Member) => isMasterRecord(m) ? (
        // Master CAN edit their own profile
        <div className="flex items-center gap-2">
          <button onClick={() => openEditModal(m)}
            className="p-1.5 rounded-lg hover:bg-primary/15 text-muted-foreground hover:text-primary transition-all" title="Edit Profile">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : isMaster ? (
        <div className="flex items-center gap-2">
          <button onClick={() => openEditModal(m)} className="p-1.5 rounded-lg hover:bg-primary/15 text-muted-foreground hover:text-primary transition-all"><Edit2 className="w-3.5 h-3.5" /></button>
          <button onClick={() => setDeleteTarget(m)} className="p-1.5 rounded-lg hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-all"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      ) : <span className="text-xs text-muted-foreground">—</span>
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/15 border border-primary/20 text-primary shadow-lg shadow-primary/10">
              <Users className="w-6 h-6" />
            </div>
            Team Management
          </h1>
          <p className="text-muted-foreground mt-1.5 ml-[52px]">IT Department · {allMembers.length} members</p>
        </div>
        {isMaster && (
          <button onClick={openAddModal}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-xl font-medium transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0">
            <Plus className="w-4 h-4" /> Add Member
          </button>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Members', val: allMembers.length, icon: <Users className="w-5 h-5" />, color: 'text-primary', bg: 'bg-primary/10 border-primary/20', glow: 'shadow-primary/10' },
          { label: 'Active', val: activeCount, icon: <CheckCircle2 className="w-5 h-5" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', glow: 'shadow-emerald-500/10' },
          { label: 'Inactive', val: inactiveCount, icon: <UserX className="w-5 h-5" />, color: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/20', glow: 'shadow-gray-500/5' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-5 flex items-center gap-4 shadow-lg ${s.glow}`} style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className={`p-3 rounded-xl border ${s.bg} ${s.color} shadow-md flex-shrink-0`}>{s.icon}</div>
            <div><p className="text-xs font-medium text-muted-foreground">{s.label}</p><p className={`text-3xl font-bold ${s.color}`}>{s.val}</p></div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input placeholder="Search name, badge, email…" value={search} onChange={e => setSearch(e.target.value)} className={inputCls + ' pl-9'} />
        </div>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className={inputCls + ' min-w-[160px] cursor-pointer'}>
          <option value="All">All Roles</option>
          {roleNames.map(r => <option key={r}>{r}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={inputCls + ' min-w-[120px] cursor-pointer'}>
          <option value="All">All Status</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <DataTable columns={columns} data={filtered} keyExtractor={m => m.id} />

      {/* Positions Link */}
      <Link href="/positions"
        className="flex items-center gap-3 p-4 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 to-violet-500/5 hover:from-primary/10 hover:to-violet-500/10 transition-all group backdrop-blur-sm">
        <div className="p-2.5 rounded-xl bg-primary/15 text-primary border border-primary/20 shadow-lg shadow-primary/10"><Shield className="w-4 h-4" /></div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">Manage Job Positions (Jabatan)</p>
          <p className="text-xs text-muted-foreground mt-0.5">Add or edit positions in the Jabatan module — role dropdown updates automatically.</p>
        </div>
        <ExternalLink className="w-4 h-4 text-primary opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
      </Link>

      {/* Add/Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        title={editingMember ? (isMasterRecord(editingMember) ? '✦ Edit Master Profile' : 'Edit Member') : 'Register New Member'}>
        <form ref={formRef} onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Full Name *</label>
              <input name="name" required defaultValue={editingMember?.name} className={inputCls} /></div>
            <div><label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Badge Number *</label>
              <input name="badge" required defaultValue={editingMember?.badge}
                readOnly={editingMember ? isMasterRecord(editingMember) : false}
                className={inputCls + ' font-mono' + (editingMember && isMasterRecord(editingMember) ? ' opacity-60 cursor-not-allowed' : '')} /></div>
          </div>

          <div><label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">
              Password {editingMember ? '(leave blank to keep)' : '*'}
            </label>
            <div className="relative">
              <input name="password" type={showPw ? 'text' : 'password'} required={!editingMember}
                placeholder={editingMember ? '••••••••' : 'Set login password'} className={inputCls + ' pr-10'} />
              <button type="button" onClick={() => setShowPw(p => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Role / Jabatan *</label>
              <Link href="/positions" onClick={() => setIsModalOpen(false)} className="text-xs text-primary hover:underline flex items-center gap-1">
                <ExternalLink className="w-2.5 h-2.5" /> Manage
              </Link>
            </div>
            <select name="role" defaultValue={editingMember?.role || roleNames[0] || 'IT Support'} className={inputCls + ' cursor-pointer'}
              disabled={editingMember ? isMasterRecord(editingMember) : false}>
              {roleNames.length > 0
                ? roleNames.map(r => <option key={r}>{r}</option>)
                : <option value={editingMember?.role || 'IT Leader'}>{editingMember?.role || 'Loading…'}</option>}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Division</label>
              <input name="division" defaultValue={editingMember?.division} placeholder="e.g. Helpdesk" className={inputCls} /></div>
            <div><label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Status</label>
              <select name="status" defaultValue={editingMember?.status || 'Active'} className={inputCls + ' cursor-pointer'}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Email</label>
              <input name="email" type="email" defaultValue={editingMember?.email} placeholder="name@company.com" className={inputCls} /></div>
            <div><label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Phone</label>
              <input name="phone" defaultValue={editingMember?.phone} placeholder="+62 8xx-xxxx" className={inputCls} /></div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-border/50">
            <button type="button" onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-border/60 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">Cancel</button>
            <button type="submit" disabled={saving}
              className="px-5 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 disabled:opacity-60 flex items-center gap-2">
              {saving && <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
              {editingMember ? 'Save Changes' : 'Register Member'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Remove Member" message={`Remove "${deleteTarget?.name}" (${deleteTarget?.badge})? They will lose login access immediately.`} />
    </div>
  );
}

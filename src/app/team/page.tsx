'use client';
import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Eye, EyeOff, Shield, Tag, X } from 'lucide-react';
import { DataTable } from '@/components/DataTable';
import { Modal, ConfirmDialog } from '@/components/Modal';
import { toast } from 'sonner';
import { useAuth, type Member, MASTER_ACCOUNT } from '@/context/AuthContext';

const DEFAULT_ROLES = ['IT Leader', 'Software Engineer', 'Network Admin', 'IT Support', 'Database Admin', 'System Analyst', 'Help Desk'];

const ROLE_COLORS: Record<string, string> = {
  'IT Leader':          'bg-violet-500/15 text-violet-400 border-violet-500/25',
  'Software Engineer':  'bg-blue-500/15 text-blue-400 border-blue-500/25',
  'Network Admin':      'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  'IT Support':         'bg-orange-500/15 text-orange-400 border-orange-500/25',
  'Database Admin':     'bg-pink-500/15 text-pink-400 border-pink-500/25',
  'System Analyst':     'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
  'Help Desk':          'bg-amber-500/15 text-amber-400 border-amber-500/25',
};

const RoleBadge = ({ role }: { role: string }) => {
  const style = ROLE_COLORS[role] || 'bg-gray-500/15 text-gray-400 border-gray-500/25';
  return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${style}`}>{role}</span>;
};

export default function TeamPage() {
  const { isMaster, members, addMember, updateMember, deleteMember } = useAuth();

  // Combine master + members into display list
  const allMembers = [MASTER_ACCOUNT, ...members];

  const [search, setSearch]             = useState('');
  const [filterRole, setFilterRole]     = useState('All');
  const [isModalOpen, setIsModalOpen]   = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [deleteTarget, setDeleteTarget]   = useState<Member | null>(null);
  const [showPw, setShowPw]             = useState(false);

  // Role management state
  const [roles, setRoles]             = useState<string[]>(DEFAULT_ROLES);
  const [showRoleManager, setShowRoleManager] = useState(false);
  const [newRoleName, setNewRoleName] = useState('');
  const [editingRole, setEditingRole] = useState<{ old: string; value: string } | null>(null);
  const [deleteRoleTarget, setDeleteRoleTarget] = useState<string | null>(null);

  const filteredMembers = allMembers.filter(m => {
    const matchSearch = m.name.toLowerCase().includes(search.toLowerCase()) ||
                        m.badge.includes(search);
    const matchRole   = filterRole === 'All' || m.role === filterRole;
    return matchSearch && matchRole;
  });

  const isMasterRecord = (m: Member) => m.id === MASTER_ACCOUNT.id;

  const openAddModal = () => {
    if (!isMaster) { toast.error('Only the IT Master can register new members'); return; }
    setEditingMember(null);
    setShowPw(false);
    setIsModalOpen(true);
  };

  const openEditModal = (member: Member) => {
    if (!isMaster && !isMasterRecord(member) === false) {
      toast.error('Only the IT Master can edit members');
      return;
    }
    setEditingMember(member);
    setShowPw(false);
    setIsModalOpen(true);
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
      password: fd.get('password') as string || editingMember?.password || '',
      role:     fd.get('role') as string,
      division: fd.get('division') as string,
      status:   fd.get('status') as 'Active' | 'Inactive',
      joinDate: fd.get('joinDate') as string || new Date().toISOString().split('T')[0],
    };

    // Check duplicate badge
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

  // Role management handlers
  const handleAddRole = () => {
    const trimmed = newRoleName.trim();
    if (!trimmed) return;
    if (roles.includes(trimmed)) { toast.error('Role already exists'); return; }
    setRoles(prev => [...prev, trimmed]);
    setNewRoleName('');
    toast.success(`Role "${trimmed}" added`);
  };

  const handleEditRole = () => {
    if (!editingRole) return;
    const trimmed = editingRole.value.trim();
    if (!trimmed || trimmed === editingRole.old) { setEditingRole(null); return; }
    if (roles.includes(trimmed)) { toast.error('Role already exists'); return; }
    setRoles(prev => prev.map(r => r === editingRole.old ? trimmed : r));
    setEditingRole(null);
    toast.success(`Role renamed to "${trimmed}"`);
  };

  const handleDeleteRole = (role: string) => {
    setRoles(prev => prev.filter(r => r !== role));
    setDeleteRoleTarget(null);
    toast.success(`Role "${role}" removed`);
  };

  const columns = [
    {
      header: 'Member',
      accessor: (m: Member) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center text-primary font-bold text-sm border border-primary/20 flex-shrink-0">
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
          </div>
        </div>
      )
    },
    { header: 'Badge', accessor: (m: Member) => <code className="font-mono text-xs px-2 py-1 rounded font-semibold" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>{m.badge}</code> },
    { header: 'Role', accessor: (m: Member) => <RoleBadge role={m.role} /> },
    { header: 'Division', accessor: 'division' as keyof Member },
    {
      header: 'Status',
      accessor: (m: Member) => (
        <span className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${m.status === 'Active' ? 'bg-success shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-muted-foreground'}`} />
          {m.status}
        </span>
      )
    },
    { header: 'Join Date', accessor: 'joinDate' as keyof Member },
    {
      header: 'Actions',
      accessor: (m: Member) => isMasterRecord(m) ? (
        <span className="text-xs text-muted-foreground">Protected</span>
      ) : isMaster ? (
        <div className="flex items-center gap-3">
          <button onClick={() => openEditModal(m)} className="text-muted-foreground hover:text-primary transition-colors" title="Edit"><Edit2 className="w-4 h-4" /></button>
          <button onClick={() => setDeleteTarget(m)} className="text-muted-foreground hover:text-destructive transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
        </div>
      ) : <span className="text-xs text-muted-foreground">—</span>
    },
  ];

  const inputClass = "w-full rounded-xl px-3 py-2.5 text-sm text-foreground border transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary";
  const inputStyle = { background: 'var(--muted)', borderColor: 'var(--border)' };

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Team Management</h1>
          <p className="text-muted-foreground mt-1">IT Department members — {allMembers.length} total</p>
        </div>
        <div className="flex items-center gap-2">
          {isMaster && (
            <button
              onClick={() => setShowRoleManager(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm border transition-all hover:bg-primary/8 hover:border-primary/40 text-foreground"
              style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}
            >
              <Tag className="w-4 h-4 text-primary" />
              Manage Roles
            </button>
          )}
          {isMaster && (
            <button
              onClick={openAddModal}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Add Member
            </button>
          )}
        </div>
      </div>

      {/* Search & Filter */}
      <div className="rounded-2xl p-4 flex flex-col sm:flex-row gap-4 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" placeholder="Search by name or badge..." value={search} onChange={e => setSearch(e.target.value)}
            className={inputClass + ' pl-9'} style={inputStyle} />
        </div>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)}
          className={inputClass + ' min-w-[160px] cursor-pointer'} style={inputStyle}>
          <option value="All">All Roles</option>
          {roles.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <DataTable columns={columns} data={filteredMembers} keyExtractor={item => item.id} />

      {/* Add/Edit Member Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingMember ? 'Edit Member' : 'Register New Member'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Full Name *</label>
              <input name="name" required defaultValue={editingMember?.name} className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Badge Number *</label>
              <input name="badge" required defaultValue={editingMember?.badge} placeholder="e.g. 36001"
                className={inputClass + ' font-mono'} style={inputStyle} />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              Password {editingMember ? '(leave blank to keep current)' : '*'}
            </label>
            <div className="relative">
              <input name="password" type={showPw ? 'text' : 'password'}
                required={!editingMember} defaultValue=""
                placeholder={editingMember ? '••••••••' : 'Set login password'}
                className={inputClass + ' pr-10'} style={inputStyle} />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Role with manage link */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-muted-foreground">Role *</label>
              <button type="button" onClick={() => setShowRoleManager(true)}
                className="text-xs text-primary hover:underline">+ Manage roles</button>
            </div>
            <select name="role" defaultValue={editingMember?.role || roles[0]}
              className={inputClass + ' cursor-pointer'} style={inputStyle}>
              {roles.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Division *</label>
              <input name="division" required defaultValue={editingMember?.division} className={inputClass} style={inputStyle} />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Status</label>
              <select name="status" defaultValue={editingMember?.status || 'Active'}
                className={inputClass + ' cursor-pointer'} style={inputStyle}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Join Date</label>
            <input name="joinDate" type="date" defaultValue={editingMember?.joinDate || new Date().toISOString().split('T')[0]}
              className={inputClass} style={inputStyle} />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t" style={{ borderColor: 'var(--border)' }}>
            <button type="button" onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-foreground border hover:bg-primary/5 transition-colors" style={{ borderColor: 'var(--border)' }}>
              Cancel
            </button>
            <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-medium transition-colors">
              {editingMember ? 'Save Changes' : 'Register Member'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Role Manager Modal */}
      <Modal isOpen={showRoleManager} onClose={() => setShowRoleManager(false)} title="Manage Roles">
        <div className="space-y-4">
          {/* Add new role */}
          <div className="flex gap-2">
            <input value={newRoleName} onChange={e => setNewRoleName(e.target.value)}
              placeholder="New role name..."
              onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddRole())}
              className={inputClass + ' flex-1'} style={inputStyle} />
            <button onClick={handleAddRole}
              className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors flex items-center gap-1">
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>

          {/* Role list */}
          <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
            {roles.map(role => (
              <div key={role} className="flex items-center gap-2 p-3 rounded-xl border group"
                style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}>
                {editingRole?.old === role ? (
                  <>
                    <input autoFocus value={editingRole.value}
                      onChange={e => setEditingRole({ ...editingRole, value: e.target.value })}
                      onKeyDown={e => { if (e.key === 'Enter') handleEditRole(); if (e.key === 'Escape') setEditingRole(null); }}
                      className="flex-1 text-sm bg-transparent outline-none border-b border-primary text-foreground" />
                    <button onClick={handleEditRole} className="text-xs text-primary font-semibold hover:underline">Save</button>
                    <button onClick={() => setEditingRole(null)} className="text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
                  </>
                ) : (
                  <>
                    <RoleBadge role={role} />
                    <span className="flex-1" />
                    <button onClick={() => setEditingRole({ old: role, value: role })}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-primary transition-all p-1 rounded-lg hover:bg-primary/10">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteRoleTarget(role)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1 rounded-lg hover:bg-destructive/10">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            ))}
          </div>

          <div className="pt-3 border-t text-right" style={{ borderColor: 'var(--border)' }}>
            <button onClick={() => setShowRoleManager(false)}
              className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition-colors">
              Done
            </button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Remove Member" message={`Remove "${deleteTarget?.name}" (Badge: ${deleteTarget?.badge})? They will lose login access.`} />

      <ConfirmDialog isOpen={!!deleteRoleTarget} onClose={() => setDeleteRoleTarget(null)}
        onConfirm={() => deleteRoleTarget && handleDeleteRole(deleteRoleTarget)}
        title="Delete Role" message={`Delete role "${deleteRoleTarget}"? Members with this role will keep it but it won't appear in new dropdowns.`} />
    </div>
  );
}

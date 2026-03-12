'use client';
import { useState } from 'react';
import { Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/DataTable';
import { Modal, ConfirmDialog } from '@/components/Modal';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

const INITIAL_MEMBERS = [
  { id: 1, name: 'Adi', role: 'IT Leader', division: 'Management', status: 'Active', joinDate: '2023-01-15' },
  { id: 2, name: 'Budi', role: 'Software Engineer', division: 'Development', status: 'Active', joinDate: '2023-03-20' },
  { id: 3, name: 'Citra', role: 'Network Admin', division: 'Infrastructure', status: 'Active', joinDate: '2023-06-10' },
  { id: 4, name: 'Deni', role: 'IT Support', division: 'Helpdesk', status: 'Inactive', joinDate: '2024-01-05' },
  { id: 5, name: 'Eka', role: 'IT Support', division: 'Helpdesk', status: 'Active', joinDate: '2024-02-12' },
];

type Member = typeof INITIAL_MEMBERS[0];

export default function TeamPage() {
  const [members, setMembers] = useState(INITIAL_MEMBERS);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Member | null>(null);
  const { addAuditLog } = useAuth();

  const filteredMembers = members.filter(m => {
    const matchesSearch = m.name.toLowerCase().includes(search.toLowerCase());
    const matchesRole = filterRole === 'All' || m.role === filterRole;
    return matchesSearch && matchesRole;
  });

  const handleDelete = () => {
    if (!deleteTarget) return;
    setMembers(members.filter(m => m.id !== deleteTarget.id));
    addAuditLog('Deleted', 'Team', `Deleted member: ${deleteTarget.name}`);
    toast.success(`Member "${deleteTarget.name}" deleted`);
    setDeleteTarget(null);
  };

  const openAddModal = () => {
    setEditingMember(null);
    setIsModalOpen(true);
  };

  const openEditModal = (member: Member) => {
    setEditingMember(member);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const newMember = {
      id: editingMember ? editingMember.id : Date.now(),
      name: formData.get('name') as string,
      role: formData.get('role') as string,
      division: formData.get('division') as string,
      status: formData.get('status') as string,
      joinDate: formData.get('joinDate') as string || new Date().toISOString().split('T')[0],
    };

    if (editingMember) {
      setMembers(members.map(m => (m.id === editingMember.id ? newMember : m)));
      addAuditLog('Updated', 'Team', `Updated member: ${newMember.name}`);
      toast.success(`Member "${newMember.name}" updated`);
    } else {
      setMembers([...members, newMember]);
      addAuditLog('Created', 'Team', `Added member: ${newMember.name}`);
      toast.success(`Member "${newMember.name}" added`);
    }
    setIsModalOpen(false);
  };

  const RoleBadge = ({ role }: { role: string }) => {
    const colors: Record<string, string> = {
      'IT Leader': 'bg-violet-500/20 text-violet-600 dark:text-violet-400 border-violet-500/30',
      'Software Engineer': 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
      'Network Admin': 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      'IT Support': 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30',
      'Database Admin': 'bg-pink-500/20 text-pink-600 dark:text-pink-400 border-pink-500/30',
      'System Analyst': 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/30',
      'Help Desk': 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30',
    };
    const style = colors[role] || 'bg-gray-500/20 text-gray-500 dark:text-gray-400 border-gray-500/30';
    return <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${style}`}>{role}</span>;
  };

  const columns = [
    { header: 'Name', accessor: 'name' as keyof Member, className: 'font-medium' },
    { 
      header: 'Role', 
      accessor: (member: Member) => <RoleBadge role={member.role} />
    },
    { header: 'Division', accessor: 'division' as keyof Member },
    { 
      header: 'Status', 
      accessor: (member: Member) => (
        <span className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${member.status === 'Active' ? 'bg-success shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-muted-foreground'}`} />
          {member.status}
        </span>
      )
    },
    { header: 'Join Date', accessor: 'joinDate' as keyof Member },
    {
      header: 'Actions',
      accessor: (member: Member) => (
        <div className="flex items-center gap-3">
          <button onClick={() => openEditModal(member)} className="text-muted-foreground hover:text-primary transition-colors" title="Edit">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => setDeleteTarget(member)} className="text-muted-foreground hover:text-destructive transition-colors" title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Team Management</h1>
          <p className="text-muted-foreground mt-1">Manage IT department members and roles</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Member
        </button>
      </div>

      <div className="bg-white dark:bg-surface border border-border rounded-xl p-4 flex flex-col sm:flex-row gap-4 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search members..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50 dark:bg-background border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-foreground"
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="bg-gray-50 dark:bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground min-w-[160px] transition-all cursor-pointer"
        >
          <option value="All">All Roles</option>
          <option value="IT Leader">IT Leader</option>
          <option value="Software Engineer">Software Engineer</option>
          <option value="Network Admin">Network Admin</option>
          <option value="IT Support">IT Support</option>
          <option value="Database Admin">Database Admin</option>
          <option value="System Analyst">System Analyst</option>
          <option value="Help Desk">Help Desk</option>
        </select>
      </div>

      <DataTable 
        columns={columns} 
        data={filteredMembers} 
        keyExtractor={(item) => item.id} 
      />

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingMember ? 'Edit Member' : 'Add New Member'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Name *</label>
            <input 
              name="name" 
              defaultValue={editingMember?.name} 
              required
              className="w-full bg-gray-50 dark:bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all invalid:border-destructive"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Role *</label>
            <select 
              name="role" 
              defaultValue={editingMember?.role || 'IT Support'} 
              className="w-full bg-gray-50 dark:bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer"
            >
              <option value="IT Leader">IT Leader</option>
              <option value="Software Engineer">Software Engineer</option>
              <option value="Network Admin">Network Admin</option>
              <option value="IT Support">IT Support</option>
              <option value="Database Admin">Database Admin</option>
              <option value="System Analyst">System Analyst</option>
              <option value="Help Desk">Help Desk</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Division *</label>
            <input 
              name="division" 
              defaultValue={editingMember?.division} 
              required
              className="w-full bg-gray-50 dark:bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all invalid:border-destructive"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Status</label>
              <select 
                name="status" 
                defaultValue={editingMember?.status || 'Active'} 
                className="w-full bg-gray-50 dark:bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer"
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Join Date</label>
              <input 
                name="joinDate" 
                type="date"
                defaultValue={editingMember?.joinDate || new Date().toISOString().split('T')[0]}
                className="w-full bg-gray-50 dark:bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              />
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-border mt-6">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors shadow-sm"
            >
              {editingMember ? 'Save Changes' : 'Add Member'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Remove Member"
        message={`Are you sure you want to remove "${deleteTarget?.name}"? This action cannot be undone.`}
      />
    </div>
  );
}

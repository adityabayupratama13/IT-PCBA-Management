'use client';
import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Briefcase, Users, TrendingUp, Award } from 'lucide-react';
import { DataTable } from '@/components/DataTable';
import { Modal, ConfirmDialog } from '@/components/Modal';
import { toast } from 'sonner';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/context/AuthContext';

interface Position {
  id: number;
  name: string;
  division: string;
  level: string;
  description: string;
  created_at?: string;
}

const LEVEL_ORDER = ['Manager', 'Supervisor', 'Senior', 'Staff'];
const LEVEL_STYLES: Record<string, { badge: string; dot: string; bg: string }> = {
  Manager:    { badge: 'bg-violet-500/15 text-violet-400 border-violet-500/25',  dot: 'bg-violet-400',   bg: 'bg-violet-500/10 border-violet-500/20' },
  Supervisor: { badge: 'bg-blue-500/15 text-blue-400 border-blue-500/25',       dot: 'bg-blue-400',     bg: 'bg-blue-500/10 border-blue-500/20' },
  Senior:     { badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25', dot: 'bg-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  Staff:      { badge: 'bg-orange-500/15 text-orange-400 border-orange-500/25', dot: 'bg-orange-400',   bg: 'bg-orange-500/10 border-orange-500/20' },
};

const DIVISIONS = ['Management', 'Software Dev', 'Infrastructure', 'Helpdesk', 'IT Department'];

export default function PositionsPage() {
  const { data: positions, loading, create, update, remove } = useApi<Position>('positions');
  const { currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [filterDivision, setFilterDivision] = useState('All');
  const [filterLevel, setFilterLevel] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Position | null>(null);

  const filtered = positions.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                        p.description.toLowerCase().includes(search.toLowerCase());
    const matchDiv = filterDivision === 'All' || p.division === filterDivision;
    const matchLevel = filterLevel === 'All' || p.level === filterLevel;
    return matchSearch && matchDiv && matchLevel;
  });

  const stats = [
    { label: 'Total Positions', value: positions.length, icon: <Briefcase className="w-5 h-5" />, color: 'text-primary', bg: 'bg-primary/10 border-primary/20' },
    { label: 'Divisions', value: new Set(positions.map(p => p.division)).size, icon: <TrendingUp className="w-5 h-5" />, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20' },
    { label: 'Senior & Above', value: positions.filter(p => ['Manager', 'Supervisor', 'Senior'].includes(p.level)).length, icon: <Award className="w-5 h-5" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  ];

  const openAddModal = () => { setEditingPosition(null); setIsModalOpen(true); };
  const openEditModal = (pos: Position) => { setEditingPosition(pos); setIsModalOpen(true); };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await remove(deleteTarget.id);
    toast.success(`Position "${deleteTarget.name}" deleted`);
    setDeleteTarget(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const payload = {
      name: fd.get('name') as string,
      division: fd.get('division') as string,
      level: fd.get('level') as string,
      description: fd.get('description') as string,
      userName: currentUser?.name || 'System',
    };
    if (editingPosition) {
      const res = await update({ id: editingPosition.id, ...payload } as unknown as Position & Record<string, unknown>);
      if (res !== null) toast.success(`Position "${payload.name}" updated`);
    } else {
      const res = await create(payload as unknown as Partial<Position> & Record<string, unknown>);
      if (res !== null) toast.success(`Position "${payload.name}" created`);
    }
    setIsModalOpen(false);
  };

  const LevelBadge = ({ level }: { level: string }) => {
    const s = LEVEL_STYLES[level] || LEVEL_STYLES['Staff'];
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${s.badge}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
        {level}
      </span>
    );
  };

  const divisions = Array.from(new Set(positions.map(p => p.division)));

  const columns = [
    {
      header: 'Position Name',
      accessor: (p: Position) => (
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${LEVEL_STYLES[p.level]?.bg || 'bg-gray-500/15'}`}>
            <Briefcase className={`w-4 h-4 ${LEVEL_STYLES[p.level]?.badge.split(' ')[1] || 'text-gray-400'}`} />
          </div>
          <div>
            <div className="font-semibold text-foreground">{p.name}</div>
            <div className="text-xs text-muted-foreground">{p.created_at ? `Since ${new Date(p.created_at).getFullYear()}` : ''}</div>
          </div>
        </div>
      )
    },
    {
      header: 'Division',
      accessor: (p: Position) => (
        <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-gray-100 dark:bg-white/5 text-foreground border border-border">
          {p.division}
        </span>
      )
    },
    { header: 'Level', accessor: (p: Position) => <LevelBadge level={p.level} /> },
    { header: 'Description', accessor: (p: Position) => <span className="text-sm text-muted-foreground line-clamp-1 max-w-xs">{p.description}</span> },
    {
      header: 'Actions',
      accessor: (p: Position) => (
        <div className="flex items-center gap-3">
          <button onClick={() => openEditModal(p)} className="p-1.5 rounded-md hover:bg-primary/10 text-muted-foreground hover:text-primary transition-colors" title="Edit">
            <Edit2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setDeleteTarget(p)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors" title="Delete">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )
    }
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <div className="p-2.5 bg-primary/15 text-primary rounded-xl border border-primary/20">
              <Briefcase className="w-6 h-6" />
            </div>
            Job Positions
          </h1>
          <p className="text-muted-foreground mt-1.5">Master data jabatan — changes reflect immediately in Team management</p>
        </div>
        <button onClick={openAddModal} className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> Add Position
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {stats.map(s => (
          <div key={s.label} className="rounded-2xl border p-4 flex items-center gap-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className={`p-2.5 rounded-xl border ${s.bg} ${s.color}`}>{s.icon}</div>
            <div>
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Level Hierarchy Visual */}
      <div className="rounded-2xl border p-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2"><Award className="w-4 h-4" /> Level Hierarchy</h3>
        <div className="flex gap-2 flex-wrap">
          {LEVEL_ORDER.map((level) => {
            const count = positions.filter(p => p.level === level).length;
            const s = LEVEL_STYLES[level];
            return (
              <div key={level} className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${s.badge} text-xs font-semibold cursor-pointer ${filterLevel === level ? 'ring-2 ring-offset-1 ring-current' : ''}`}
                onClick={() => setFilterLevel(filterLevel === level ? 'All' : level)}>
                <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
                {level} ({count})
              </div>
            );
          })}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input placeholder="Search positions..." value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-50 dark:bg-background border border-border rounded-lg text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>
        <select value={filterDivision} onChange={e => setFilterDivision(e.target.value)}
          className="px-3 py-2 bg-gray-50 dark:bg-background border border-border rounded-lg text-sm text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary">
          <option value="All">All Divisions</option>
          {divisions.map(d => <option key={d}>{d}</option>)}
        </select>
      </div>

      {/* Table */}
      <DataTable columns={columns} data={filtered} keyExtractor={p => p.id} />

      {/* Tip */}
      <div className="flex items-start gap-3 p-4 rounded-xl border border-primary/20 bg-primary/5">
        <Users className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-foreground">Positions are linked to Team Management</p>
          <p className="text-xs text-muted-foreground mt-0.5">Adding or editing positions here will immediately update the role selection dropdown when adding or editing team members.</p>
        </div>
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingPosition ? 'Edit Position' : 'Add New Position'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Position Name *</label>
            <input name="name" required defaultValue={editingPosition?.name}
              className="w-full bg-gray-50 dark:bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all invalid:border-destructive" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Division *</label>
              <select name="division" defaultValue={editingPosition?.division || 'IT Department'}
                className="w-full bg-gray-50 dark:bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer">
                {DIVISIONS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Level *</label>
              <select name="level" defaultValue={editingPosition?.level || 'Staff'}
                className="w-full bg-gray-50 dark:bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer">
                {LEVEL_ORDER.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Description</label>
            <textarea name="description" rows={3} defaultValue={editingPosition?.description} placeholder="Job responsibilities and scope..."
              className="w-full bg-gray-50 dark:bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-border">
            <button type="button" onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">Cancel</button>
            <button type="submit"
              className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
              {editingPosition ? 'Save Changes' : 'Add Position'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Position" message={`Delete "${deleteTarget?.name}"? Members with this role will not be affected.`} />
    </div>
  );
}

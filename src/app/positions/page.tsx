'use client';
import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Briefcase, Users } from 'lucide-react';
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
const LEVEL_COLORS: Record<string, string> = {
  Manager:    'bg-violet-500/15 text-violet-400 border-violet-500/25',
  Supervisor: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  Senior:     'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  Staff:      'bg-orange-500/15 text-orange-400 border-orange-500/25',
};

const DIVISIONS = ['Management', 'Software Dev', 'Infrastructure', 'Helpdesk', 'IT Department', 'Hardware'];

export default function PositionsPage() {
  const { data: positions, loading, create, update, remove } = useApi<Position>('positions');
  const { currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Position | null>(null);

  const filtered = positions.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    const matchLevel = filterLevel === 'All' || p.level === filterLevel;
    return matchSearch && matchLevel;
  });

  const openAddModal = () => { setEditingPosition(null); setIsModalOpen(true); };
  const openEditModal = (p: Position) => { setEditingPosition(p); setIsModalOpen(true); };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const ok = await remove(deleteTarget.id);
    if (ok) toast.success(`"${deleteTarget.name}" deleted`);
    setDeleteTarget(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    const payload = {
      name: (fd.get('name') as string).trim(),
      division: fd.get('division') as string,
      level: fd.get('level') as string,
      description: (fd.get('description') as string).trim(),
      userName: currentUser?.name || 'System',
    };
    if (!payload.name) { toast.error('Name required'); return; }

    if (editingPosition) {
      const res = await update({ id: editingPosition.id, ...payload } as unknown as Position & Record<string, unknown>);
      if (res !== null) { toast.success(`"${payload.name}" updated`); setIsModalOpen(false); }
    } else {
      const res = await create(payload as unknown as Partial<Position> & Record<string, unknown>);
      if (res !== null) { toast.success(`"${payload.name}" created`); setIsModalOpen(false); }
    }
  };

  const inputClass = "w-full bg-gray-50 dark:bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all";

  const columns = [
    {
      header: 'Position Name',
      accessor: (p: Position) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
            <Briefcase className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="font-semibold text-foreground">{p.name}</div>
            {p.created_at && <div className="text-xs text-muted-foreground">Since {new Date(p.created_at).getFullYear()}</div>}
          </div>
        </div>
      )
    },
    {
      header: 'Division',
      accessor: (p: Position) => <span className="text-sm text-foreground">{p.division}</span>
    },
    {
      header: 'Level',
      accessor: (p: Position) => (
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${LEVEL_COLORS[p.level] || LEVEL_COLORS.Staff}`}>
          {p.level}
        </span>
      )
    },
    { header: 'Description', accessor: (p: Position) => <span className="text-sm text-muted-foreground line-clamp-1 max-w-xs">{p.description || '—'}</span> },
    {
      header: 'Actions',
      accessor: (p: Position) => (
        <div className="flex items-center gap-3">
          <button onClick={() => openEditModal(p)} className="text-muted-foreground hover:text-primary transition-colors"><Edit2 className="w-4 h-4" /></button>
          <button onClick={() => setDeleteTarget(p)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-4 h-4" /></button>
        </div>
      )
    }
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Job Positions</h1>
          <p className="text-muted-foreground mt-1">Master data jabatan — {positions.length} positions</p>
        </div>
        <button onClick={openAddModal}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-xl font-medium text-sm transition-all shadow-sm">
          <Plus className="w-4 h-4" /> Add Position
        </button>
      </div>

      {/* Filter bar */}
      <div className="rounded-2xl p-4 flex flex-col sm:flex-row gap-4 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input placeholder="Search positions..." value={search} onChange={e => setSearch(e.target.value)} className={inputClass + ' pl-9'} />
        </div>
        <select value={filterLevel} onChange={e => setFilterLevel(e.target.value)} className={inputClass + ' min-w-[140px] cursor-pointer'}>
          <option value="All">All Levels</option>
          {LEVEL_ORDER.map(l => <option key={l}>{l}</option>)}
        </select>
      </div>

      <DataTable columns={columns} data={filtered} keyExtractor={p => p.id} />

      {/* Info */}
      <div className="flex items-center gap-3 p-3 rounded-xl border border-border text-sm" style={{ background: 'var(--surface)' }}>
        <Users className="w-4 h-4 text-primary flex-shrink-0" />
        <span className="text-muted-foreground">Positions here appear as role options in the <strong className="text-foreground">Team</strong> module.</span>
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingPosition ? 'Edit Position' : 'Add New Position'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Position Name *</label>
            <input name="name" required defaultValue={editingPosition?.name} className={inputClass} placeholder="e.g. Network Engineer" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Division *</label>
              <select name="division" defaultValue={editingPosition?.division || 'IT Department'} className={inputClass + ' cursor-pointer'}>
                {DIVISIONS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Level *</label>
              <select name="level" defaultValue={editingPosition?.level || 'Staff'} className={inputClass + ' cursor-pointer'}>
                {LEVEL_ORDER.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Description</label>
            <textarea name="description" rows={3} defaultValue={editingPosition?.description} placeholder="Job responsibilities..."
              className={inputClass + ' resize-none'} />
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t" style={{ borderColor: 'var(--border)' }}>
            <button type="button" onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 rounded-xl text-sm font-medium text-foreground border hover:bg-primary/5 transition-colors" style={{ borderColor: 'var(--border)' }}>Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-medium transition-colors">
              {editingPosition ? 'Save Changes' : 'Add Position'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Position" message={`Delete "${deleteTarget?.name}"? Members using this role won't be affected.`} />
    </div>
  );
}

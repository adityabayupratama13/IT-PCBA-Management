'use client';
import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Briefcase, Users, Award, TrendingUp, ChevronRight } from 'lucide-react';
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
const LEVEL_STYLES: Record<string, { badge: string; dot: string; bg: string; glow: string }> = {
  Manager:    { badge: 'bg-violet-500/20 text-violet-300 border-violet-500/30',   dot: 'bg-violet-400',   bg: 'bg-violet-500/10 border-violet-500/20',   glow: 'shadow-violet-500/20' },
  Supervisor: { badge: 'bg-blue-500/20 text-blue-300 border-blue-500/30',         dot: 'bg-blue-400',     bg: 'bg-blue-500/10 border-blue-500/20',         glow: 'shadow-blue-500/20' },
  Senior:     { badge: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30', dot: 'bg-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20',   glow: 'shadow-emerald-500/20' },
  Staff:      { badge: 'bg-orange-500/20 text-orange-300 border-orange-500/30',   dot: 'bg-orange-400',   bg: 'bg-orange-500/10 border-orange-500/20',     glow: 'shadow-orange-500/15' },
};

const DIVISIONS = ['Management', 'Software Dev', 'Infrastructure', 'Helpdesk', 'IT Department', 'Hardware'];

const LevelBadge = ({ level }: { level: string }) => {
  const s = LEVEL_STYLES[level] || LEVEL_STYLES['Staff'];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border backdrop-blur-sm ${s.badge}`}>
      <div className={`w-1.5 h-1.5 rounded-full ${s.dot} shadow-sm`} />
      {level}
    </span>
  );
};

export default function PositionsPage() {
  const { data: positions, loading, create, update, remove } = useApi<Position>('positions');
  const { currentUser } = useAuth();
  const [search, setSearch]           = useState('');
  const [filterDivision, setFilterDivision] = useState('All');
  const [filterLevel, setFilterLevel]     = useState('All');
  const [isModalOpen, setIsModalOpen]     = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [deleteTarget, setDeleteTarget]     = useState<Position | null>(null);
  const [saving, setSaving]          = useState(false);

  const filtered = positions.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(q) || p.description.toLowerCase().includes(q);
    const matchDiv   = filterDivision === 'All' || p.division === filterDivision;
    const matchLevel = filterLevel === 'All' || p.level === filterLevel;
    return matchSearch && matchDiv && matchLevel;
  });

  const divisions = Array.from(new Set(positions.map(p => p.division)));

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
    if (saving) return;
    setSaving(true);
    const fd = new FormData(e.target as HTMLFormElement);
    const payload = {
      name: (fd.get('name') as string).trim(),
      division: fd.get('division') as string,
      level: fd.get('level') as string,
      description: (fd.get('description') as string).trim(),
      userName: currentUser?.name || 'System',
    };
    if (!payload.name) { toast.error('Position name is required'); setSaving(false); return; }

    if (editingPosition) {
      const res = await update({ id: editingPosition.id, ...payload } as unknown as Position & Record<string, unknown>);
      if (res !== null) { toast.success(`"${payload.name}" updated`); setIsModalOpen(false); }
    } else {
      const res = await create(payload as unknown as Partial<Position> & Record<string, unknown>);
      if (res !== null) { toast.success(`"${payload.name}" created`); setIsModalOpen(false); }
    }
    setSaving(false);
  };

  const inputCls = "w-full rounded-xl px-3 py-2.5 text-sm text-foreground border border-border/60 transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary bg-white/5 dark:bg-white/[0.04] backdrop-blur-sm placeholder:text-muted-foreground/50";

  const columns = [
    {
      header: 'Position',
      accessor: (p: Position) => {
        const s = LEVEL_STYLES[p.level] || LEVEL_STYLES['Staff'];
        return (
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border shadow-lg ${s.bg} ${s.glow}`}>
              <Briefcase className={`w-4 h-4 ${s.badge.split(' ')[1]}`} />
            </div>
            <div>
              <div className="font-semibold text-foreground text-sm">{p.name}</div>
              {p.created_at && <div className="text-xs text-muted-foreground">Since {new Date(p.created_at).getFullYear()}</div>}
            </div>
          </div>
        );
      }
    },
    {
      header: 'Division',
      accessor: (p: Position) => (
        <span className="px-2.5 py-0.5 rounded-lg text-xs font-medium bg-muted/60 text-muted-foreground border border-border/40 backdrop-blur-sm">{p.division}</span>
      )
    },
    { header: 'Level', accessor: (p: Position) => <LevelBadge level={p.level} /> },
    { header: 'Description', accessor: (p: Position) => <span className="text-xs text-muted-foreground line-clamp-1 max-w-xs">{p.description || '—'}</span> },
    {
      header: 'Actions',
      accessor: (p: Position) => (
        <div className="flex items-center gap-1.5">
          <button onClick={() => openEditModal(p)} className="p-1.5 rounded-lg hover:bg-primary/15 text-muted-foreground hover:text-primary transition-all" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
          <button onClick={() => setDeleteTarget(p)} className="p-1.5 rounded-lg hover:bg-destructive/15 text-muted-foreground hover:text-destructive transition-all" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      )
    }
  ];

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/15 border border-primary/20 text-primary shadow-lg shadow-primary/10">
              <Briefcase className="w-6 h-6" />
            </div>
            Job Positions
          </h1>
          <p className="text-muted-foreground mt-1.5 ml-[52px]">Master data jabatan · changes reflect in Team immediately</p>
        </div>
        <button onClick={openAddModal}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-xl font-semibold transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0">
          <Plus className="w-4 h-4" /> Add Position
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Positions', val: positions.length, icon: <Briefcase className="w-5 h-5" />, color: 'text-primary', bg: 'bg-primary/10 border-primary/20', glow: 'shadow-primary/10' },
          { label: 'Divisions', val: new Set(positions.map(p => p.division)).size, icon: <TrendingUp className="w-5 h-5" />, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/20', glow: 'shadow-violet-500/10' },
          { label: 'Senior & Above', val: positions.filter(p => ['Manager', 'Supervisor', 'Senior'].includes(p.level)).length, icon: <Award className="w-5 h-5" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20', glow: 'shadow-emerald-500/10' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-5 flex items-center gap-4 shadow-lg ${s.glow}`} style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className={`p-3 rounded-xl border flex-shrink-0 shadow-md ${s.bg} ${s.color}`}>{s.icon}</div>
            <div><p className="text-xs font-medium text-muted-foreground">{s.label}</p><p className={`text-3xl font-bold ${s.color}`}>{s.val}</p></div>
          </div>
        ))}
      </div>

      {/* Level Hierarchy — clickable filters */}
      <div className="rounded-2xl border p-4 flex flex-wrap gap-2 items-center" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-2 flex items-center gap-1.5"><Award className="w-3.5 h-3.5" /> Level Filter:</span>
        <button onClick={() => setFilterLevel('All')}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${filterLevel === 'All' ? 'bg-primary text-white border-primary shadow-md shadow-primary/30' : 'bg-muted/40 text-muted-foreground border-border/40 hover:border-border'}`}>
          All ({positions.length})
        </button>
        {LEVEL_ORDER.map(level => {
          const s = LEVEL_STYLES[level];
          const count = positions.filter(p => p.level === level).length;
          const active = filterLevel === level;
          return (
            <button key={level} onClick={() => setFilterLevel(active ? 'All' : level)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${active ? s.badge + ' ring-2 ring-current ring-offset-1 ring-offset-[var(--surface)]' : 'bg-muted/30 text-muted-foreground border-border/30 hover:' + s.badge}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
              {level} ({count})
            </button>
          );
        })}
      </div>

      {/* Search + Division filter */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input placeholder="Search positions…" value={search} onChange={e => setSearch(e.target.value)} className={inputCls + ' pl-9'} />
        </div>
        <select value={filterDivision} onChange={e => setFilterDivision(e.target.value)} className={inputCls + ' min-w-[160px] cursor-pointer'}>
          <option value="All">All Divisions</option>
          {divisions.map(d => <option key={d}>{d}</option>)}
        </select>
      </div>

      {/* Table */}
      <DataTable columns={columns} data={filtered} keyExtractor={p => p.id} />

      {/* Info Banner */}
      <div className="flex items-center gap-3 p-4 rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 to-violet-500/5 backdrop-blur-sm">
        <Users className="w-5 h-5 text-primary flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">Linked to Team Management</p>
          <p className="text-xs text-muted-foreground mt-0.5">Positions added here appear immediately as role options when registering or editing team members.</p>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingPosition ? 'Edit Position' : 'Add New Position'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Position Name *</label>
            <input name="name" required defaultValue={editingPosition?.name} className={inputCls} placeholder="e.g. Network Engineer" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Division *</label>
              <select name="division" defaultValue={editingPosition?.division || 'IT Department'} className={inputCls + ' cursor-pointer'}>
                {DIVISIONS.map(d => <option key={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Level *</label>
              <select name="level" defaultValue={editingPosition?.level || 'Staff'} className={inputCls + ' cursor-pointer'}>
                {LEVEL_ORDER.map(l => <option key={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wide">Description</label>
            <textarea name="description" rows={3} defaultValue={editingPosition?.description}
              placeholder="Job responsibilities and scope of work…"
              className={inputCls + ' resize-none'} />
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-border/50">
            <button type="button" onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-border/60 rounded-xl text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/5 transition-all">Cancel</button>
            <button type="submit" disabled={saving}
              className="px-5 py-2 bg-primary hover:bg-primary/90 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-primary/25 hover:shadow-primary/40 disabled:opacity-60 flex items-center gap-2">
              {saving && <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />}
              {editingPosition ? 'Save Changes' : 'Add Position'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Position" message={`Delete "${deleteTarget?.name}"? Members already using this role won't be affected.`} />
    </div>
  );
}

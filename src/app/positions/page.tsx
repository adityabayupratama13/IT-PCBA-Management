'use client';
import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Briefcase } from 'lucide-react';
import { DataTable } from '@/components/DataTable';
import { Modal, ConfirmDialog } from '@/components/Modal';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

const INITIAL_POSITIONS = [
  { id: 1, name: 'IT Leader', division: 'All', level: 'Supervisor', description: 'Lead and manage IT department operations' },
  { id: 2, name: 'Software Engineer', division: 'Software', level: 'Senior', description: 'Design, develop, and maintain software applications' },
  { id: 3, name: 'Network Admin', division: 'Infrastructure', level: 'Senior', description: 'Manage and maintain network infrastructure' },
  { id: 4, name: 'IT Support', division: 'Support', level: 'Staff', description: 'Provide technical support to end users' },
  { id: 5, name: 'Database Admin', division: 'Software', level: 'Senior', description: 'Manage and optimize database systems' },
  { id: 6, name: 'System Analyst', division: 'Software', level: 'Senior', description: 'Analyze and design IT system solutions' },
  { id: 7, name: 'Help Desk', division: 'Support', level: 'Staff', description: 'Handle first-level IT support requests' },
];

type Position = typeof INITIAL_POSITIONS[0];

export default function PositionsPage() {
  const [positions, setPositions] = useState(INITIAL_POSITIONS);
  const [search, setSearch] = useState('');
  const [filterDivision, setFilterDivision] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Position | null>(null);
  const { addAuditLog } = useAuth();

  const filteredPositions = positions.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
    const matchesDivision = filterDivision === 'All' || p.division === filterDivision;
    return matchesSearch && matchesDivision;
  });

  const openAddModal = () => {
    setEditingPosition(null);
    setIsModalOpen(true);
  };

  const openEditModal = (position: Position) => {
    setEditingPosition(position);
    setIsModalOpen(true);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setPositions(positions.filter(p => p.id !== deleteTarget.id));
    addAuditLog('Deleted', 'Positions', `Deleted position: ${deleteTarget.name}`);
    toast.success(`Position "${deleteTarget.name}" deleted`);
    setDeleteTarget(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const newPosition = {
      id: editingPosition ? editingPosition.id : Date.now(),
      name: formData.get('name') as string,
      division: formData.get('division') as string,
      level: formData.get('level') as string,
      description: formData.get('description') as string,
    };

    if (editingPosition) {
      setPositions(positions.map(p => (p.id === editingPosition.id ? newPosition : p)));
      addAuditLog('Updated', 'Positions', `Updated position: ${newPosition.name}`);
      toast.success(`Position "${newPosition.name}" updated`);
    } else {
      setPositions([...positions, newPosition]);
      addAuditLog('Created', 'Positions', `Created position: ${newPosition.name}`);
      toast.success(`Position "${newPosition.name}" created`);
    }
    setIsModalOpen(false);
  };

  const LevelBadge = ({ level }: { level: string }) => {
    const colors: Record<string, string> = {
      'Manager': 'bg-violet-500/20 text-violet-500 dark:text-violet-400 border-violet-500/30',
      'Supervisor': 'bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30',
      'Senior': 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/30',
      'Staff': 'bg-orange-500/20 text-orange-600 dark:text-orange-400 border-orange-500/30',
    };
    const style = colors[level] || 'bg-gray-500/20 text-gray-500 dark:text-gray-400 border-gray-500/30';
    return <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${style}`}>{level}</span>;
  };

  const columns = [
    { header: 'Position Name', accessor: 'name' as keyof Position, className: 'font-medium' },
    { header: 'Division', accessor: 'division' as keyof Position },
    { 
      header: 'Level', 
      accessor: (pos: Position) => <LevelBadge level={pos.level} />
    },
    { header: 'Description', accessor: 'description' as keyof Position, className: 'max-w-[300px] truncate text-muted-foreground' },
    {
      header: 'Actions',
      accessor: (pos: Position) => (
        <div className="flex items-center gap-3">
          <button onClick={() => openEditModal(pos)} className="text-muted-foreground hover:text-primary transition-colors" title="Edit">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => setDeleteTarget(pos)} className="text-muted-foreground hover:text-destructive transition-colors" title="Delete">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  const divisions = Array.from(new Set(positions.map(p => p.division)));

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Briefcase className="w-8 h-8 text-primary" />
            Jabatan / Positions
          </h1>
          <p className="text-muted-foreground mt-1">Manage job positions and roles in the IT department</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Position
        </button>
      </div>

      <div className="bg-white dark:bg-surface border border-border rounded-xl p-4 flex flex-col sm:flex-row gap-4 shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search positions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50 dark:bg-background border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-foreground"
          />
        </div>
        <select
          value={filterDivision}
          onChange={(e) => setFilterDivision(e.target.value)}
          className="bg-gray-50 dark:bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground min-w-[160px] transition-all cursor-pointer"
        >
          <option value="All">All Divisions</option>
          {divisions.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <DataTable 
        columns={columns} 
        data={filteredPositions} 
        keyExtractor={(item) => item.id} 
      />

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingPosition ? 'Edit Position' : 'Add New Position'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Position Name *</label>
            <input 
              name="name" 
              defaultValue={editingPosition?.name} 
              required
              className="w-full bg-gray-50 dark:bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all invalid:border-destructive"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Division *</label>
              <select 
                name="division" 
                defaultValue={editingPosition?.division || 'Software'} 
                required
                className="w-full bg-gray-50 dark:bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer"
              >
                <option value="All">All</option>
                <option value="Software">Software</option>
                <option value="Infrastructure">Infrastructure</option>
                <option value="Support">Support</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Level *</label>
              <select 
                name="level" 
                defaultValue={editingPosition?.level || 'Staff'} 
                required
                className="w-full bg-gray-50 dark:bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer"
              >
                <option value="Staff">Staff</option>
                <option value="Senior">Senior</option>
                <option value="Supervisor">Supervisor</option>
                <option value="Manager">Manager</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Description</label>
            <textarea 
              name="description" 
              defaultValue={editingPosition?.description}
              placeholder="Job description..."
              className="w-full bg-gray-50 dark:bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all min-h-[80px] resize-none"
            />
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
              {editingPosition ? 'Save Changes' : 'Add Position'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Position"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
      />
    </div>
  );
}

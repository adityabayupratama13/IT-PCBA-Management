'use client';
import { useState } from 'react';
import { Plus, FolderKanban, TrendingUp, CheckCircle2, Edit2, Trash2 } from 'lucide-react';
import { GanttRow } from '@/components/GanttRow';
import { Modal, ConfirmDialog } from '@/components/Modal';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

type ProjectStatus = 'Planning' | 'Active' | 'On Hold' | 'Completed';

const INITIAL_PROJECTS = [
  { id: 1, name: 'ERP System Upgrade', pic: 'Adi', startDate: '2026-02-01', endDate: '2026-05-30', progress: 45, status: 'Active' as ProjectStatus },
  { id: 2, name: 'Q1 Hardware Refresh', pic: 'Deni', startDate: '2026-01-15', endDate: '2026-03-31', progress: 80, status: 'Active' as ProjectStatus },
  { id: 3, name: 'Cloud Migration Phase 2', pic: 'Budi', startDate: '2026-04-01', endDate: '2026-08-15', progress: 0, status: 'Planning' as ProjectStatus },
  { id: 4, name: 'New Branch Network Setup', pic: 'Citra', startDate: '2026-02-15', endDate: '2026-04-10', progress: 60, status: 'Active' as ProjectStatus },
  { id: 5, name: 'Legacy System Decommission', pic: 'Adi', startDate: '2025-11-01', endDate: '2026-01-30', progress: 100, status: 'Completed' as ProjectStatus },
  { id: 6, name: 'Security Audit Remediation', pic: 'Citra', startDate: '2026-03-01', endDate: '2026-04-30', progress: 15, status: 'On Hold' as ProjectStatus },
];

type Project = typeof INITIAL_PROJECTS[0];

export default function ProjectsPage() {
  const [projects, setProjects] = useState(INITIAL_PROJECTS);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Project | null>(null);
  const [progressValue, setProgressValue] = useState(0);
  const { addAuditLog } = useAuth();

  const minDateStr = projects.reduce((min, p) => p.startDate < min ? p.startDate : min, projects[0].startDate);
  const maxDateStr = projects.reduce((max, p) => p.endDate > max ? p.endDate : max, projects[0].endDate);
  const minDate = new Date(minDateStr);
  const maxDate = new Date(maxDateStr);

  const openAddModal = () => {
    setEditingProject(null);
    setProgressValue(0);
    setIsModalOpen(true);
  };

  const openEditModal = (project: Project) => {
    setEditingProject(project);
    setProgressValue(project.progress);
    setIsModalOpen(true);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setProjects(projects.filter(p => p.id !== deleteTarget.id));
    addAuditLog('Deleted', 'Projects', `Deleted project: ${deleteTarget.name}`);
    toast.success(`Project "${deleteTarget.name}" deleted`);
    setDeleteTarget(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const newProject = {
      id: editingProject ? editingProject.id : Date.now(),
      name: formData.get('name') as string,
      pic: formData.get('pic') as string,
      startDate: formData.get('startDate') as string,
      endDate: formData.get('endDate') as string,
      progress: progressValue,
      status: formData.get('status') as ProjectStatus,
    };
    if (editingProject) {
      setProjects(projects.map(p => (p.id === editingProject.id ? newProject : p)));
      addAuditLog('Updated', 'Projects', `Updated project: ${newProject.name}`);
      toast.success(`Project "${newProject.name}" updated`);
    } else {
      setProjects([...projects, newProject]);
      addAuditLog('Created', 'Projects', `Created project: ${newProject.name}`);
      toast.success(`Project "${newProject.name}" created`);
    }
    setIsModalOpen(false);
  };

  const activeProjects = projects.filter(p => p.status === 'Active').length;
  const completedProjects = projects.filter(p => p.status === 'Completed').length;
  const avgProgress = Math.round(projects.reduce((sum, p) => sum + p.progress, 0) / projects.length);

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Project Plan</h1>
          <p className="text-muted-foreground mt-1">High-level overview and timelines</p>
        </div>
        <button onClick={openAddModal} className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          Add Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-6">
        <div className="rounded-2xl border p-5 flex items-center gap-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="p-3 bg-primary/15 text-primary rounded-xl border border-primary/20"><FolderKanban className="w-6 h-6" /></div>
          <div><p className="text-sm font-medium text-muted-foreground">Active Projects</p><h3 className="text-2xl font-bold text-foreground">{activeProjects}</h3></div>
        </div>
        <div className="rounded-2xl border p-5 flex items-center gap-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="p-3 bg-success/15 text-success rounded-xl border border-success/20"><CheckCircle2 className="w-6 h-6" /></div>
          <div><p className="text-sm font-medium text-muted-foreground">Completed</p><h3 className="text-2xl font-bold text-success">{completedProjects}</h3></div>
        </div>
        <div className="rounded-2xl border p-5 flex items-center gap-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <div className="p-3 bg-violet-500/15 text-violet-400 rounded-xl border border-violet-500/20"><TrendingUp className="w-6 h-6" /></div>
          <div><p className="text-sm font-medium text-muted-foreground">Average Progress</p><h3 className="text-2xl font-bold text-violet-400">{avgProgress}%</h3></div>
        </div>
      </div>

      <div className="rounded-2xl border overflow-hidden flex flex-col" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="p-4 border-b border-border flex justify-between items-center flex-shrink-0" style={{ background: 'var(--muted)' }}>
          <h2 className="font-semibold text-foreground flex items-center gap-2">Timeline Overview</h2>
          <div className="flex gap-4 text-xs font-medium text-muted-foreground">
            <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-secondary opacity-80" /> Planning</span>
            <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-primary opacity-80" /> Active</span>
            <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-destructive/80 opacity-80" /> On Hold</span>
            <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-sm bg-success opacity-80" /> Completed</span>
          </div>
        </div>
        
        <div className="p-4 overflow-x-auto custom-scrollbar">
          <div className="min-w-[800px]">
            <div className="flex border-b border-border/50 pb-2 mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <div className="w-1/4 pl-4">Project Details</div>
              <div className="w-3/4 flex justify-between pr-16 relative">
                <span>{minDateStr}</span>
                <span className="absolute left-1/2 -translate-x-1/2 opacity-50">Timeline</span>
                <span>{maxDateStr}</span>
              </div>
            </div>

            <div className="space-y-1">
              {projects.sort((a,b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()).map(project => (
                <div key={project.id} className="group relative">
                  <GanttRow 
                    name={project.name}
                    pic={project.pic}
                    startDate={new Date(project.startDate)}
                    endDate={new Date(project.endDate)}
                    minDate={minDate}
                    maxDate={maxDate}
                    progress={project.progress}
                    status={project.status}
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 z-20">
                    <button onClick={() => openEditModal(project)} className="p-1.5 bg-white dark:bg-surface border border-border rounded-md text-muted-foreground hover:text-primary transition-colors shadow-sm" title="Edit">
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setDeleteTarget(project)} className="p-1.5 bg-white dark:bg-surface border border-border rounded-md text-muted-foreground hover:text-destructive transition-colors shadow-sm" title="Delete">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProject ? 'Edit Project' : 'Add Project Plan'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Project Name *</label>
            <input name="name" required defaultValue={editingProject?.name} className="w-full bg-gray-50 dark:bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all invalid:border-destructive" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">PIC (Person In Charge)</label>
              <select name="pic" defaultValue={editingProject?.pic || 'Adi'} className="w-full bg-gray-50 dark:bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer">
                <option value="Adi">Adi</option>
                <option value="Budi">Budi</option>
                <option value="Citra">Citra</option>
                <option value="Deni">Deni</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Status</label>
              <select name="status" defaultValue={editingProject?.status || 'Planning'} className="w-full bg-gray-50 dark:bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer">
                <option value="Planning">Planning</option>
                <option value="Active">Active</option>
                <option value="On Hold">On Hold</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Start Date *</label>
              <input name="startDate" type="date" required defaultValue={editingProject?.startDate || new Date().toISOString().split('T')[0]} className="w-full bg-gray-50 dark:bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">End Date *</label>
              <input name="endDate" type="date" required defaultValue={editingProject?.endDate} className="w-full bg-gray-50 dark:bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Progress: {progressValue}%</label>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={progressValue}
              onChange={(e) => setProgressValue(Number(e.target.value))}
              className="w-full h-2 bg-gray-200 dark:bg-background rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-border mt-6">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">{editingProject ? 'Save Changes' : 'Add Project'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Project" message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`} />
    </div>
  );
}

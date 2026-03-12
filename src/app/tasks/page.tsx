'use client';
import { useState } from 'react';
import { Plus, Search, Calendar as CalendarIcon, Edit2, Trash2 } from 'lucide-react';
import { KanbanColumn, KanbanCard } from '@/components/KanbanBoard';
import { Modal, ConfirmDialog } from '@/components/Modal';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

type TaskState = 'Backlog' | 'In Progress' | 'Review' | 'Done';

const INITIAL_TASKS = [
  { id: 1, title: 'Update server infrastructure', status: 'Backlog' as TaskState, priority: 'High', assignee: 'Citra', initials: 'CI', dueDate: '2026-03-15' },
  { id: 2, title: 'Design new employee onboarding flow', status: 'In Progress' as TaskState, priority: 'Medium', assignee: 'Adi', initials: 'AD', dueDate: '2026-03-20' },
  { id: 3, title: 'Fix bug in ticketing system', status: 'In Progress' as TaskState, priority: 'High', assignee: 'Budi', initials: 'BU', dueDate: '2026-03-12' },
  { id: 4, title: 'Audit software licenses', status: 'Review' as TaskState, priority: 'Low', assignee: 'Eka', initials: 'EK', dueDate: '2026-03-25' },
  { id: 5, title: 'Deploy internal dashboard', status: 'Done' as TaskState, priority: 'High', assignee: 'Budi', initials: 'BU', dueDate: '2026-03-10' },
  { id: 6, title: 'Order new laptops for sales team', status: 'Backlog' as TaskState, priority: 'Medium', assignee: 'Deni', initials: 'DE', dueDate: '2026-03-30' },
  { id: 7, title: 'Setup network for branch office', status: 'In Progress' as TaskState, priority: 'High', assignee: 'Citra', initials: 'CI', dueDate: '2026-04-05' },
  { id: 8, title: 'Update security policies', status: 'Review' as TaskState, priority: 'Medium', assignee: 'Adi', initials: 'AD', dueDate: '2026-03-18' },
  { id: 9, title: 'Renew domain names', status: 'Done' as TaskState, priority: 'High', assignee: 'Deni', initials: 'DE', dueDate: '2026-03-01' },
  { id: 10, title: 'Create documentation for API', status: 'Backlog' as TaskState, priority: 'Low', assignee: 'Eka', initials: 'EK', dueDate: '2026-04-10' },
];

type Task = typeof INITIAL_TASKS[0];
const COLUMNS: TaskState[] = ['Backlog', 'In Progress', 'Review', 'Done'];

export default function TasksPage() {
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [search, setSearch] = useState('');
  const [filterAssignee, setFilterAssignee] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Task | null>(null);
  const { addAuditLog } = useAuth();

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase());
    const matchesAssignee = filterAssignee === 'All' || t.assignee === filterAssignee;
    const matchesPriority = filterPriority === 'All' || t.priority === filterPriority;
    return matchesSearch && matchesAssignee && matchesPriority;
  });

  const getTasksByStatus = (status: string) => filteredTasks.filter(t => t.status === status);

  const PriorityBadge = ({ priority }: { priority: string }) => {
    switch (priority) {
      case 'High': return <span className="bg-destructive/20 text-destructive text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider">High</span>;
      case 'Medium': return <span className="bg-orange-500/20 text-orange-500 dark:text-orange-400 text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider">Medium</span>;
      case 'Low': return <span className="bg-primary/20 text-primary text-[10px] px-2 py-0.5 rounded uppercase font-bold tracking-wider">Low</span>;
      default: return null;
    }
  };

  const openAddModal = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setTasks(tasks.filter(t => t.id !== deleteTarget.id));
    addAuditLog('Deleted', 'Tasks', `Deleted task: ${deleteTarget.title}`);
    toast.success(`Task "${deleteTarget.title}" deleted`);
    setDeleteTarget(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const assigneeName = formData.get('assignee') as string;
    const newTask = {
      id: editingTask ? editingTask.id : Date.now(),
      title: formData.get('title') as string,
      status: formData.get('status') as TaskState,
      priority: formData.get('priority') as string,
      assignee: assigneeName,
      initials: assigneeName.substring(0, 2).toUpperCase(),
      dueDate: formData.get('dueDate') as string,
    };

    if (editingTask) {
      setTasks(tasks.map(t => (t.id === editingTask.id ? newTask : t)));
      addAuditLog('Updated', 'Tasks', `Updated task: ${newTask.title}`);
      toast.success(`Task "${newTask.title}" updated`);
    } else {
      setTasks([...tasks, newTask]);
      addAuditLog('Created', 'Tasks', `Created task: ${newTask.title}`);
      toast.success(`Task "${newTask.title}" created`);
    }
    setIsModalOpen(false);
  };
  
  const doneCount = tasks.filter(t => t.status === 'Done').length;
  const progressPercent = tasks.length > 0 ? Math.round((doneCount / tasks.length) * 100) : 0;

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Task Tracking</h1>
          <p className="text-muted-foreground mt-1">Manage department tasks and workflows</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </div>

      <div className="bg-white dark:bg-surface border border-border rounded-xl p-4 flex flex-col md:flex-row gap-4 shadow-sm mb-6 flex-shrink-0 items-center justify-between">
        <div className="flex flex-1 gap-4 w-full md:w-auto">
          <div className="relative flex-[2]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tasks..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-gray-50 dark:bg-background border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-foreground"
            />
          </div>
          <select
            value={filterAssignee}
            onChange={(e) => setFilterAssignee(e.target.value)}
            className="flex-1 bg-gray-50 dark:bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground transition-all cursor-pointer"
          >
            <option value="All">All Assignees</option>
            <option value="Adi">Adi</option>
            <option value="Budi">Budi</option>
            <option value="Citra">Citra</option>
            <option value="Deni">Deni</option>
            <option value="Eka">Eka</option>
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="flex-1 bg-gray-50 dark:bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground transition-all cursor-pointer"
          >
            <option value="All">All Priorities</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
        
        <div className="w-full md:w-64 border-l border-border pl-4 hidden md:block">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-muted-foreground font-medium">Sprint Progress</span>
            <span className="font-bold text-primary">{progressPercent}%</span>
          </div>
          <div className="h-2 w-full bg-gray-200 dark:bg-background rounded-full overflow-hidden border border-border/50">
            <div 
              className="h-full bg-primary transition-all rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-x-auto pb-4 custom-scrollbar">
        <div className="flex gap-6 h-full min-w-max">
          {COLUMNS.map(col => {
            const colTasks = getTasksByStatus(col);
            return (
              <KanbanColumn key={col} title={col} count={colTasks.length}>
                {colTasks.map(task => (
                  <KanbanCard key={task.id}>
                    <div className="flex justify-between items-start mb-3">
                      <PriorityBadge priority={task.priority} />
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEditModal(task)} className="text-muted-foreground hover:text-primary transition-colors p-0.5" title="Edit">
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteTarget(task)} className="text-muted-foreground hover:text-destructive transition-colors p-0.5" title="Delete">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <h4 className="font-semibold text-foreground text-sm mb-3 leading-snug">{task.title}</h4>
                    <div className="flex items-center justify-between mt-auto">
                      <div className="flex items-center text-xs text-muted-foreground gap-1.5 bg-gray-100 dark:bg-surface px-2 py-1 rounded-md border border-border">
                        <CalendarIcon className="w-3.5 h-3.5" />
                        {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </div>
                      <div className="w-7 h-7 rounded-full bg-primary/20 text-primary border border-primary/30 flex items-center justify-center text-xs font-bold" title={task.assignee}>
                        {task.initials}
                      </div>
                    </div>
                  </KanbanCard>
                ))}
              </KanbanColumn>
            );
          })}
        </div>
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingTask ? 'Edit Task' : 'Add New Task'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Task Title *</label>
            <input 
              name="title" 
              defaultValue={editingTask?.title}
              required
              className="w-full bg-gray-50 dark:bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all invalid:border-destructive"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Status</label>
              <select 
                name="status" 
                defaultValue={editingTask?.status || 'Backlog'}
                className="w-full bg-gray-50 dark:bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer"
              >
                {COLUMNS.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Priority</label>
              <select 
                name="priority" 
                defaultValue={editingTask?.priority || 'Medium'}
                className="w-full bg-gray-50 dark:bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Assignee</label>
              <select 
                name="assignee" 
                defaultValue={editingTask?.assignee || 'Adi'}
                className="w-full bg-gray-50 dark:bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer"
              >
                <option value="Adi">Adi</option>
                <option value="Budi">Budi</option>
                <option value="Citra">Citra</option>
                <option value="Deni">Deni</option>
                <option value="Eka">Eka</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Due Date</label>
              <input 
                name="dueDate" 
                type="date"
                required
                defaultValue={editingTask?.dueDate || new Date().toISOString().split('T')[0]}
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
              {editingTask ? 'Save Changes' : 'Add Task'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Task"
        message={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
      />
    </div>
  );
}

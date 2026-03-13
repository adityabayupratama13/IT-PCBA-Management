'use client';
import { useState } from 'react';
import { Search, AlertCircle, Edit2, Trash2, Plus, ArrowRight } from 'lucide-react';
import { DataTable } from '@/components/DataTable';
import { Modal, ConfirmDialog } from '@/components/Modal';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import { useRouter } from 'next/navigation';

interface Ticket {
  id: string;
  title: string;
  reporter: string;
  priority: string;
  status: string;
  created_date: string;
}

export default function TicketsPage() {
  const { data: tickets, loading, create, update, remove } = useApi<Ticket>('tickets');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Ticket | null>(null);
  const { currentUser } = useAuth();
  const router = useRouter();

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'All' || t.status === filterStatus;
    const matchesPriority = filterPriority === 'All' || t.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const openAddModal = () => { setEditingTicket(null); setIsModalOpen(true); };
  const openEditModal = (ticket: Ticket) => { setEditingTicket(ticket); setIsModalOpen(true); };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await remove(deleteTarget.id);
    toast.success(`Ticket ${deleteTarget.id} deleted (daily log entries removed)`);
    setDeleteTarget(null);
  };

  const handleInlineStatusChange = async (ticketId: string, newStatus: string) => {
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;
    await update({ ...ticket, status: newStatus, userName: currentUser?.name } as unknown as Ticket & Record<string, unknown>);
    toast.success(`Ticket ${ticketId} → ${newStatus}`);
  };

  // Create Task from this ticket — links ticket_id for bidirectional status sync
  const createTaskFromTicket = async (ticket: Ticket) => {
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: `[${ticket.id}] ${ticket.title}`,
          status: 'Backlog',
          priority: ticket.priority === 'Critical' ? 'High' : ticket.priority,
          assignee: currentUser?.name || 'Unassigned',
          initials: (currentUser?.name || 'UN').substring(0, 2).toUpperCase(),
          dueDate: '',
          ticketId: ticket.id,   // ← link for bidirectional sync
          userName: currentUser?.name || 'System',
        }),
      });
      if (res.ok) {
        toast.success(`Task created from ${ticket.id} — check Tasks page`);
        router.push('/tasks');
      } else {
        toast.error('Failed to create task');
      }
    } catch {
      toast.error('Network error');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const payload = {
      title: formData.get('title') as string,
      reporter: formData.get('reporter') as string,
      priority: formData.get('priority') as string,
      status: formData.get('status') as string,
      userName: currentUser?.name || 'System',
    };
    if (editingTicket) {
      await update({ id: editingTicket.id, ...payload } as unknown as Ticket & Record<string, unknown>);
      toast.success(`Ticket ${editingTicket.id} updated`);
    } else {
      await create(payload as unknown as Partial<Ticket> & Record<string, unknown>);
      toast.success('Ticket created');
    }
    setIsModalOpen(false);
  };

  const inputClass = "w-full bg-gray-50 dark:bg-background border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all";

  const columns = [
    { header: 'ID', accessor: 'id' as keyof Ticket, className: 'font-mono text-primary font-bold whitespace-nowrap' },
    { header: 'Title', accessor: 'title' as keyof Ticket },
    { header: 'Reporter', accessor: 'reporter' as keyof Ticket, className: 'whitespace-nowrap' },
    {
      header: 'Priority', accessor: (t: Ticket) => {
        const styles: Record<string, string> = { Critical: 'bg-red-500/15 text-red-400 border-red-500/25', High: 'bg-orange-500/15 text-orange-400 border-orange-500/25', Medium: 'bg-amber-500/15 text-amber-400 border-amber-500/25', Low: 'bg-blue-500/15 text-blue-400 border-blue-500/25' };
        return <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${styles[t.priority] || ''}`}>{t.priority}</span>;
      }
    },
    {
      header: 'Status', accessor: (t: Ticket) => (
        <select value={t.status} onChange={e => handleInlineStatusChange(t.id, e.target.value)}
          className="text-xs font-medium bg-transparent border border-border rounded-md px-2 py-1 text-foreground cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary">
          {['Open', 'In Progress', 'Resolved', 'Closed'].map(s => <option key={s}>{s}</option>)}
        </select>
      )
    },
    {
      header: 'Created', accessor: (t: Ticket) => {
        const d = new Date(t.created_date);
        return <span className="text-muted-foreground text-xs whitespace-nowrap">{d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} {d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</span>;
      }
    },
    {
      header: 'Actions', accessor: (t: Ticket) => (
        <div className="flex items-center gap-2">
          <button onClick={() => createTaskFromTicket(t)} className="text-muted-foreground hover:text-emerald-400 transition-colors" title="Create Task from Ticket">
            <ArrowRight className="w-4 h-4" />
          </button>
          <button onClick={() => openEditModal(t)} className="text-muted-foreground hover:text-primary transition-colors" title="Edit"><Edit2 className="w-4 h-4" /></button>
          <button onClick={() => setDeleteTarget(t)} className="text-muted-foreground hover:text-destructive transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
        </div>
      )
    }
  ];

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Help Desk Tickets</h1>
          <p className="text-muted-foreground mt-1">Track IT support requests — {tickets.length} tickets</p>
        </div>
        <button onClick={openAddModal} className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm">
          <Plus className="w-4 h-4" /> New Ticket
        </button>
      </div>

      {/* Info: Workflow */}
      <div className="flex items-center gap-3 p-3 rounded-xl border border-border text-xs text-muted-foreground" style={{ background: 'var(--surface)' }}>
        <ArrowRight className="w-4 h-4 text-emerald-400 flex-shrink-0" />
        <span><strong className="text-foreground">Workflow:</strong> Ticket → use <span className="text-emerald-400">→</span> button to create a Task → changes auto-sync to Daily Log</span>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input placeholder="Search tickets..." value={search} onChange={e => setSearch(e.target.value)} className={inputClass + ' pl-9'} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className={inputClass + ' min-w-[130px] cursor-pointer'}>
          {['All', 'Open', 'In Progress', 'Resolved', 'Closed'].map(s => <option key={s}>{s}</option>)}
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value)} className={inputClass + ' min-w-[120px] cursor-pointer'}>
          {['All', 'Critical', 'High', 'Medium', 'Low'].map(s => <option key={s}>{s}</option>)}
        </select>
      </div>

      {filteredTickets.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-border rounded-2xl" style={{ background: 'var(--surface)' }}>
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
          <h3 className="text-lg font-semibold text-foreground">No tickets found</h3>
          <p className="text-muted-foreground mt-1">Try adjusting your search or filters</p>
        </div>
      ) : (
        <DataTable data={filteredTickets} columns={columns} />
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingTicket ? 'Edit Ticket' : 'New Ticket'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Title *</label>
            <input name="title" required defaultValue={editingTicket?.title} className={inputClass} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Reporter *</label>
              <input name="reporter" required defaultValue={editingTicket?.reporter} className={inputClass} />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Priority</label>
              <select name="priority" defaultValue={editingTicket?.priority || 'Medium'} className={inputClass + ' cursor-pointer'}>
                {['Critical', 'High', 'Medium', 'Low'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Status</label>
            <select name="status" defaultValue={editingTicket?.status || 'Open'} className={inputClass + ' cursor-pointer'}>
              {['Open', 'In Progress', 'Resolved', 'Closed'].map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-border">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-primary/5 transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">{editingTicket ? 'Save Changes' : 'Create Ticket'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete}
        title="Delete Ticket" message={`Delete ticket ${deleteTarget?.id}? Related daily log entries will also be removed.`} />
    </div>
  );
}

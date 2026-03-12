'use client';
import { useState } from 'react';
import { Search, AlertCircle, Edit2, Trash2, Plus } from 'lucide-react';
import { DataTable } from '@/components/DataTable';
import { Modal, ConfirmDialog } from '@/components/Modal';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

const INITIAL_TICKETS = [
  { id: 'TKT-104', title: 'Network down in meeting room A', reporter: 'Sales Director', priority: 'Critical', status: 'Open', createdDate: '2026-03-11T14:30' },
  { id: 'TKT-103', title: 'Cannot access ERP system', reporter: 'Finance Manager', priority: 'High', status: 'In Progress', createdDate: '2026-03-11T10:15' },
  { id: 'TKT-102', title: 'Request new monitor setup', reporter: 'HR Team', priority: 'Low', status: 'Resolved', createdDate: '2026-03-10T16:45' },
  { id: 'TKT-101', title: 'Printer ink replacement on 2nd floor', reporter: 'Admin Office', priority: 'Medium', status: 'Closed', createdDate: '2026-03-09T09:20' },
  { id: 'TKT-100', title: 'Laptop blue screen issue', reporter: 'Marketing Staff', priority: 'High', status: 'In Progress', createdDate: '2026-03-08T11:00' },
  { id: 'TKT-099', title: 'Update software license', reporter: 'Engineering Dept', priority: 'Low', status: 'Closed', createdDate: '2026-03-05T14:10' },
  { id: 'TKT-098', title: 'Wi-Fi slow connection', reporter: 'Warehouse Team', priority: 'Medium', status: 'Open', createdDate: '2026-03-11T08:05' },
  { id: 'TKT-097', title: 'New onboarding account creation', reporter: 'HR Team', priority: 'Medium', status: 'Open', createdDate: '2026-03-11T15:22' },
];

type Ticket = typeof INITIAL_TICKETS[0];

export default function TicketsPage() {
  const [tickets, setTickets] = useState(INITIAL_TICKETS);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTicket, setEditingTicket] = useState<Ticket | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Ticket | null>(null);
  const [isAddMode, setIsAddMode] = useState(false);
  const { addAuditLog } = useAuth();

  const filteredTickets = tickets.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'All' || t.status === filterStatus;
    const matchesPriority = filterPriority === 'All' || t.priority === filterPriority;
    return matchesSearch && matchesStatus && matchesPriority;
  });

  const openEditModal = (ticket: Ticket) => {
    setEditingTicket(ticket);
    setIsAddMode(false);
    setIsModalOpen(true);
  };

  const openAddModal = () => {
    setEditingTicket(null);
    setIsAddMode(true);
    setIsModalOpen(true);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setTickets(tickets.filter(t => t.id !== deleteTarget.id));
    addAuditLog('Deleted', 'Tickets', `Deleted ticket: ${deleteTarget.id} - ${deleteTarget.title}`);
    toast.success(`Ticket ${deleteTarget.id} deleted`);
    setDeleteTarget(null);
  };

  const handleInlineStatusChange = (ticketId: string, newStatus: string) => {
    setTickets(tickets.map(t => t.id === ticketId ? { ...t, status: newStatus } : t));
    addAuditLog('Updated', 'Tickets', `Updated ticket ${ticketId} status to ${newStatus}`);
    toast.success(`Ticket ${ticketId} status changed to ${newStatus}`);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const newTicket = {
      id: editingTicket ? editingTicket.id : `TKT-${String(tickets.length + 100).padStart(3, '0')}`,
      title: formData.get('title') as string,
      reporter: formData.get('reporter') as string,
      priority: formData.get('priority') as string,
      status: formData.get('status') as string,
      createdDate: editingTicket ? editingTicket.createdDate : new Date().toISOString(),
    };

    if (editingTicket) {
      setTickets(tickets.map(t => (t.id === editingTicket.id ? newTicket : t)));
      addAuditLog('Updated', 'Tickets', `Updated ticket: ${newTicket.id}`);
      toast.success(`Ticket ${newTicket.id} updated`);
    } else {
      setTickets([newTicket, ...tickets]);
      addAuditLog('Created', 'Tickets', `Created ticket: ${newTicket.id} - ${newTicket.title}`);
      toast.success(`Ticket ${newTicket.id} created`);
    }
    setIsModalOpen(false);
  };

  const PriorityBadge = ({ priority }: { priority: string }) => {
    switch(priority) {
      case 'Critical': return <span className="bg-destructive/20 text-destructive px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider border border-destructive/30 flex items-center gap-1 w-max"><AlertCircle className="w-3 h-3" />Critical</span>;
      case 'High': return <span className="bg-orange-500/20 text-orange-500 dark:text-orange-400 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider border border-orange-500/30 w-max">High</span>;
      case 'Medium': return <span className="bg-blue-500/20 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider border border-blue-500/30 w-max">Medium</span>;
      case 'Low': return <span className="bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider border border-emerald-500/30 w-max">Low</span>;
      default: return null;
    }
  };

  const columns = [
    { header: 'ID', accessor: 'id' as keyof Ticket, className: 'font-mono text-xs text-muted-foreground' },
    { header: 'Title', accessor: 'title' as keyof Ticket, className: 'font-medium max-w-[300px] truncate' },
    { header: 'Reporter', accessor: 'reporter' as keyof Ticket },
    { 
      header: 'Priority', 
      accessor: (ticket: Ticket) => <PriorityBadge priority={ticket.priority} />
    },
    { 
      header: 'Status', 
      accessor: (ticket: Ticket) => (
        <select
          value={ticket.status}
          onChange={(e) => handleInlineStatusChange(ticket.id, e.target.value)}
          className="bg-gray-50 dark:bg-background border border-border rounded-lg px-2 py-1 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-primary text-foreground cursor-pointer"
        >
          <option value="Open">Open</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
          <option value="Closed">Closed</option>
        </select>
      )
    },
    { 
      header: 'Created', 
      accessor: (ticket: Ticket) => new Date(ticket.createdDate).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      className: 'text-muted-foreground text-sm'
    },
    {
      header: 'Actions',
      accessor: (ticket: Ticket) => (
        <div className="flex items-center gap-3">
          <button onClick={() => openEditModal(ticket)} className="text-muted-foreground hover:text-primary transition-colors" title="Edit">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => setDeleteTarget(ticket)} className="text-muted-foreground hover:text-destructive transition-colors" title="Delete">
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
          <h1 className="text-3xl font-bold text-foreground">Help Desk Tickets</h1>
          <p className="text-muted-foreground mt-1">Manage and resolve user IT support requests</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          New Ticket
        </button>
      </div>

      <div className="bg-white dark:bg-surface border border-border rounded-xl p-4 flex flex-col md:flex-row gap-4 shadow-sm items-center">
        <div className="relative w-full md:flex-[2]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tickets..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-gray-50 dark:bg-background border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all text-foreground"
          />
        </div>
        <div className="flex w-full md:w-auto gap-4 flex-1">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="flex-1 bg-gray-50 dark:bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground transition-all cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="Open">Open</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="flex-1 bg-gray-50 dark:bg-background border border-border rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary text-foreground transition-all cursor-pointer"
          >
            <option value="All">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
      </div>

      <DataTable 
        columns={columns} 
        data={filteredTickets} 
        keyExtractor={(item) => item.id} 
      />

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={isAddMode ? 'New Ticket' : `Edit Ticket ${editingTicket?.id || ''}`}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Title *</label>
            <input 
              name="title" 
              defaultValue={editingTicket?.title}
              required
              className="w-full bg-gray-50 dark:bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all invalid:border-destructive"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Reporter *</label>
            <input 
              name="reporter" 
              defaultValue={editingTicket?.reporter}
              required
              className="w-full bg-gray-50 dark:bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all invalid:border-destructive"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Priority</label>
              <select 
                name="priority" 
                defaultValue={editingTicket?.priority || 'Medium'}
                className="w-full bg-gray-50 dark:bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer"
              >
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Status</label>
              <select 
                name="status" 
                defaultValue={editingTicket?.status || 'Open'}
                className="w-full bg-gray-50 dark:bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer"
              >
                <option value="Open">Open</option>
                <option value="In Progress">In Progress</option>
                <option value="Resolved">Resolved</option>
                <option value="Closed">Closed</option>
              </select>
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
              {editingTicket ? 'Save Changes' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Ticket"
        message={`Are you sure you want to delete ticket ${deleteTarget?.id} "${deleteTarget?.title}"?`}
      />
    </div>
  );
}

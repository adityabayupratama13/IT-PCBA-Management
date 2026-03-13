'use client';
import { useState } from 'react';
import { Plus, ChevronLeft, ChevronRight, Clock, MapPin, Edit2, Trash2, Ticket } from 'lucide-react';
import { DataTable } from '@/components/DataTable';
import { Modal, ConfirmDialog } from '@/components/Modal';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import { usePersistedState } from '@/context/usePersistedState';

const INITIAL_LOGS: { id: number; date: string; member: string; activity: string; hours: number; location: string; source: 'manual' | 'ticket' }[] = [
  { id: 1, date: '2026-03-11', member: 'Adi', activity: 'Reviewed API documentation & team sync', hours: 4, location: 'Office', source: 'manual' },
  { id: 2, date: '2026-03-11', member: 'Budi', activity: 'Fixed login bug on ERP staging', hours: 6, location: 'WFH', source: 'manual' },
  { id: 3, date: '2026-03-11', member: 'Citra', activity: 'Reconfigured firewall rules for new VLAN', hours: 5, location: 'Server Room', source: 'manual' },
  { id: 4, date: '2026-03-10', member: 'Deni', activity: 'Hardware maintenance on 3rd floor', hours: 8, location: 'Office', source: 'manual' },
  { id: 5, date: '2026-03-10', member: 'Eka', activity: 'Resolved 5 helpdesk tickets', hours: 7, location: 'Office', source: 'manual' },
  { id: 6, date: '2026-03-09', member: 'Adi', activity: 'Project planning for Q2 migration', hours: 8, location: 'Office', source: 'manual' },
  { id: 7, date: '2026-03-09', member: 'Budi', activity: 'Developed new dashboard widgets', hours: 8, location: 'WFH', source: 'manual' },
  { id: 8, date: '2026-03-08', member: 'Citra', activity: 'Network troubleshooting at Branch B', hours: 6, location: 'Branch B', source: 'manual' },
];

type DailyLog = typeof INITIAL_LOGS[0];

export default function DailyLogPage() {
  const [logs, setLogs] = usePersistedState('it-daily-logs', INITIAL_LOGS);
  const [currentDate, setCurrentDate] = useState(new Date('2026-03-11'));
  const [selectedDateFilter, setSelectedDateFilter] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLog, setEditingLog] = useState<DailyLog | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DailyLog | null>(null);
  const { addAuditLog } = useAuth();

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const formatDateStr = (year: number, month: number, day: number) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const getLogsForDate = (dateStr: string) => logs.filter(l => l.date === dateStr);
  const filteredLogs = selectedDateFilter ? getLogsForDate(selectedDateFilter) : logs;

  const openAddModal = () => {
    setEditingLog(null);
    setIsModalOpen(true);
  };

  const openEditModal = (log: DailyLog) => {
    setEditingLog(log);
    setIsModalOpen(true);
  };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setLogs(logs.filter(l => l.id !== deleteTarget.id));
    addAuditLog('Deleted', 'Daily Log', `Deleted log by ${deleteTarget.member}: ${deleteTarget.activity}`);
    toast.success('Daily log entry deleted');
    setDeleteTarget(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const newLog = {
      id: editingLog ? editingLog.id : Date.now(),
      date: formData.get('date') as string,
      member: formData.get('member') as string,
      activity: formData.get('activity') as string,
      hours: Number(formData.get('hours')),
      location: formData.get('location') as string,
      source: 'manual' as const,
    };

    if (editingLog) {
      setLogs(logs.map(l => (l.id === editingLog.id ? newLog : l)));
      addAuditLog('Updated', 'Daily Log', `Updated log by ${newLog.member}`);
      toast.success('Daily log updated');
    } else {
      setLogs([newLog, ...logs]);
      addAuditLog('Created', 'Daily Log', `Added log by ${newLog.member}`);
      toast.success('Daily log added');
    }
    setIsModalOpen(false);
  };

  const columns = [
    { 
      header: 'Date', 
      accessor: (log: DailyLog) => new Date(log.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      className: 'whitespace-nowrap'
    },
    { 
      header: 'Member', 
      accessor: (log: DailyLog) => <span className="font-medium text-foreground">{log.member}</span>
    },
    { 
      header: 'Activity Description', 
      accessor: (log: DailyLog) => (
        <div className="flex items-center gap-2 max-w-md">
          {log.source === 'ticket' && (
            <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-400 border border-violet-500/25 whitespace-nowrap flex-shrink-0">
              <Ticket className="w-2.5 h-2.5" /> Ticket
            </span>
          )}
          <span className="truncate">{log.activity}</span>
        </div>
      ),
      className: 'max-w-md'
    },
    { 
      header: 'Hours', 
      accessor: (log: DailyLog) => (
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          {log.hours > 0 ? `${log.hours}h` : '—'}
        </span>
      )
    },
    { 
      header: 'Location', 
      accessor: (log: DailyLog) => (
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="w-3.5 h-3.5" />
          {log.location}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: (log: DailyLog) => log.source === 'ticket' ? (
        <span className="text-xs text-muted-foreground italic">Auto</span>
      ) : (
        <div className="flex items-center gap-3">
          <button onClick={() => openEditModal(log)} className="text-muted-foreground hover:text-primary transition-colors" title="Edit">
            <Edit2 className="w-4 h-4" />
          </button>
          <button onClick={() => setDeleteTarget(log)} className="text-muted-foreground hover:text-destructive transition-colors" title="Delete">
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
          <h1 className="text-3xl font-bold text-foreground">Daily Job Log</h1>
          <p className="text-muted-foreground mt-1">Track daily activities and working hours</p>
        </div>
        <button 
          onClick={openAddModal}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          Add Daily Log
        </button>
      </div>

      <div className="rounded-2xl border p-6" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            Calendar View
            {selectedDateFilter && (
              <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full border border-primary/30">
                Filtered: {selectedDateFilter}
              </span>
            )}
          </h2>
          <div className="flex items-center gap-4">
            <button onClick={prevMonth} className="p-1.5 rounded-lg transition-colors text-muted-foreground hover:text-foreground" style={{ background: 'var(--muted)' }}>
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-medium min-w-[140px] text-center">{monthName}</span>
            <button onClick={nextMonth} className="p-1.5 rounded-lg transition-colors text-muted-foreground hover:text-foreground" style={{ background: 'var(--muted)' }}>
              <ChevronRight className="w-5 h-5" />
            </button>
            {selectedDateFilter && (
              <button 
                onClick={() => setSelectedDateFilter(null)}
                className="ml-2 text-xs text-muted-foreground hover:text-foreground underline underline-offset-2"
              >
                Clear Filter
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden border border-border">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="py-2 text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider" style={{ background: 'var(--muted)' }}>
              {day}
            </div>
          ))}
          
          {Array.from({ length: firstDayOfMonth }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[100px] opacity-30" style={{ background: 'var(--background)' }} />
          ))}
          
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const dateStr = formatDateStr(currentDate.getFullYear(), currentDate.getMonth(), i + 1);
            const dayLogs = getLogsForDate(dateStr);
            const isSelected = selectedDateFilter === dateStr;
            const isToday = dateStr === new Date().toISOString().split('T')[0];

            return (
              <div 
                key={i} 
                onClick={() => setSelectedDateFilter(isSelected ? null : dateStr)}
                className={`min-h-[100px] p-2 transition-colors cursor-pointer group ${isSelected ? 'ring-2 ring-inset ring-primary' : ''}`}
                style={{ background: isSelected ? 'rgba(59,130,246,0.08)' : 'var(--surface)' }}
              >
                <div className="flex justify-between items-start">
                  <span className={`text-sm font-medium w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-primary text-white' : 'text-muted-foreground group-hover:text-foreground'}`}>
                    {i + 1}
                  </span>
                  {dayLogs.length > 0 && (
                    <span className="text-[10px] bg-secondary/20 text-secondary border border-secondary/30 px-1.5 py-0.5 rounded font-bold">
                      {dayLogs.length} logs
                    </span>
                  )}
                </div>
                <div className="mt-2 space-y-1">
                  {dayLogs.slice(0, 3).map(log => (
                    <div key={log.id} className="text-[10px] truncate px-1.5 py-1 rounded font-medium border" style={{ background: 'rgba(59,130,246,0.12)', borderColor: 'rgba(59,130,246,0.25)', color: 'var(--primary-light)' }} title={log.activity}>
                      <span className="font-semibold">{log.member}:</span> {log.activity}
                    </div>
                  ))}
                  {dayLogs.length > 3 && (
                    <div className="text-[10px] text-muted-foreground font-medium pl-1">
                      +{dayLogs.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          {selectedDateFilter ? `Logs for ${new Date(selectedDateFilter).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}` : 'Recent Logs Activity'}
        </h2>
        <DataTable 
          columns={columns} 
          data={filteredLogs} 
          keyExtractor={(item) => item.id} 
        />
      </div>

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingLog ? 'Edit Daily Log' : 'Add Daily Job Log'}
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Date *</label>
              <input 
                name="date" 
                type="date"
                defaultValue={editingLog?.date || new Date().toISOString().split('T')[0]} 
                required
                className="w-full bg-gray-50 dark:bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Member *</label>
              <select 
                name="member" 
                defaultValue={editingLog?.member || 'Adi'}
                className="w-full bg-gray-50 dark:bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer"
              >
                <option value="Adi">Adi</option>
                <option value="Budi">Budi</option>
                <option value="Citra">Citra</option>
                <option value="Deni">Deni</option>
                <option value="Eka">Eka</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Activity Description *</label>
            <textarea 
              name="activity" 
              required
              defaultValue={editingLog?.activity}
              placeholder="What did you work on today?"
              className="w-full bg-gray-50 dark:bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all min-h-[80px] resize-none invalid:border-destructive"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Hours Spent *</label>
              <input 
                name="hours" 
                type="number"
                min="0.5"
                step="0.5"
                max="24"
                defaultValue={editingLog?.hours || 8}
                required
                className="w-full bg-gray-50 dark:bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Location</label>
              <select 
                name="location" 
                defaultValue={editingLog?.location || 'Office'}
                className="w-full bg-gray-50 dark:bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer"
              >
                <option value="Office">Office</option>
                <option value="WFH">WFH</option>
                <option value="Server Room">Server Room</option>
                <option value="Branch B">Branch B</option>
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
              {editingLog ? 'Save Changes' : 'Save Log'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Log Entry"
        message={`Are you sure you want to delete this log entry by ${deleteTarget?.member}?`}
      />
    </div>
  );
}

'use client';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, Edit2, Trash2 } from 'lucide-react';
import { Modal, ConfirmDialog } from '@/components/Modal';
import { addDays, startOfWeek, format } from 'date-fns';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';

type ScheduleType = 'Meeting' | 'Maintenance' | 'On-Call';

const INITIAL_SCHEDULES = [
  { id: 1, title: 'Server Maintenance', type: 'Maintenance' as ScheduleType, day: 1, startTime: '22:00', endTime: '02:00', assignee: 'Citra' },
  { id: 2, title: 'Weekly IT Sync', type: 'Meeting' as ScheduleType, day: 1, startTime: '10:00', endTime: '11:00', assignee: 'All Team' },
  { id: 3, title: 'On-Call Support', type: 'On-Call' as ScheduleType, day: 2, startTime: '08:00', endTime: '17:00', assignee: 'Budi' },
  { id: 4, title: 'Network Upgrades', type: 'Maintenance' as ScheduleType, day: 4, startTime: '21:00', endTime: '23:00', assignee: 'Adi' },
  { id: 5, title: 'Security Review', type: 'Meeting' as ScheduleType, day: 3, startTime: '14:00', endTime: '15:30', assignee: 'Adi, Citra' },
  { id: 6, title: 'On-Call Support', type: 'On-Call' as ScheduleType, day: 5, startTime: '08:00', endTime: '17:00', assignee: 'Eka' },
  { id: 7, title: 'ERP Vendor Sync', type: 'Meeting' as ScheduleType, day: 4, startTime: '13:00', endTime: '14:00', assignee: 'Budi' },
];

type Schedule = typeof INITIAL_SCHEDULES[0];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const HOURS = Array.from({ length: 15 }, (_, i) => i + 8);

export default function SchedulePage() {
  const [schedules, setSchedules] = useState(INITIAL_SCHEDULES);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Schedule | null>(null);
  const { addAuditLog } = useAuth();

  const getWeekRange = () => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    const end = addDays(start, 4);
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`;
  };

  const getDayDates = () => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 });
    return Array.from({ length: 5 }, (_, i) => format(addDays(start, i), 'd'));
  };

  const prevWeek = () => setCurrentDate(addDays(currentDate, -7));
  const nextWeek = () => setCurrentDate(addDays(currentDate, 7));
  const today = () => setCurrentDate(new Date());

  const getSchedulesForDay = (dayIndex: number) => schedules.filter(s => s.day === dayIndex + 1);

  const openAddModal = () => { setEditingSchedule(null); setIsModalOpen(true); };
  const openEditModal = (schedule: Schedule) => { setEditingSchedule(schedule); setIsModalOpen(true); };

  const handleDelete = () => {
    if (!deleteTarget) return;
    setSchedules(schedules.filter(s => s.id !== deleteTarget.id));
    addAuditLog('Deleted', 'Schedule', `Deleted schedule: ${deleteTarget.title}`);
    toast.success(`Schedule "${deleteTarget.title}" deleted`);
    setDeleteTarget(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const newSchedule = {
      id: editingSchedule ? editingSchedule.id : Date.now(),
      title: formData.get('title') as string,
      type: formData.get('type') as ScheduleType,
      day: Number(formData.get('day')),
      startTime: formData.get('startTime') as string,
      endTime: formData.get('endTime') as string,
      assignee: formData.get('assignee') as string,
    };
    if (editingSchedule) {
      setSchedules(schedules.map(s => (s.id === editingSchedule.id ? newSchedule : s)));
      addAuditLog('Updated', 'Schedule', `Updated schedule: ${newSchedule.title}`);
      toast.success(`Schedule "${newSchedule.title}" updated`);
    } else {
      setSchedules([...schedules, newSchedule]);
      addAuditLog('Created', 'Schedule', `Created schedule: ${newSchedule.title}`);
      toast.success(`Schedule "${newSchedule.title}" created`);
    }
    setIsModalOpen(false);
  };

  const getTypeStyles = (type: ScheduleType) => {
    switch (type) {
      case 'Meeting':     return { bg: '#2563EB', text: '#ffffff', border: 'rgba(37,99,235,0.5)' };
      case 'Maintenance': return { bg: '#EA580C', text: '#ffffff', border: 'rgba(234,88,12,0.5)' };
      case 'On-Call':     return { bg: '#7C3AED', text: '#ffffff', border: 'rgba(124,58,237,0.5)' };
      default:            return { bg: 'var(--surface-2)', text: 'var(--foreground)', border: 'var(--border)' };
    }
  };

  const calculatePosition = (startTime: string, endTime: string) => {
    const startHour = parseInt(startTime.split(':')[0], 10);
    const endHour = parseInt(endTime.split(':')[0], 10);
    const relStart = Math.max(0, startHour - 8);
    let relEnd = endHour - 8;
    if (endHour < startHour) relEnd = 16;
    if (relEnd > 15) relEnd = 15;
    if (startHour < 8 || startHour >= 22) {
      return { bottom: 0, height: '60px', isOutlier: true };
    }
    const startPx = relStart * 64;
    const heightPx = Math.max(0.5, (relEnd - relStart)) * 64;
    return { top: `${startPx}px`, height: `${heightPx}px`, isOutlier: false };
  };

  const dates = getDayDates();

  return (
    <div className="space-y-6 pb-8 h-[calc(100vh-6rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Weekly Schedule</h1>
          <p className="text-muted-foreground mt-1">Manage meetings, maintenance, and on-call rotations</p>
        </div>
        <button onClick={openAddModal} className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm">
          <Plus className="w-4 h-4" />
          Add Schedule
        </button>
      </div>

      <div className="rounded-2xl border flex-1 flex flex-col overflow-hidden" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <div className="flex justify-between items-center p-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <CalendarIcon className="w-5 h-5 text-primary" />
              {getWeekRange()}
            </h2>
            <button onClick={today} className="text-xs bg-gray-100 dark:bg-background border border-border px-2.5 py-1 rounded-md text-foreground hover:bg-gray-200 dark:hover:bg-white/5 transition-colors">Today</button>
          </div>
          <div className="flex items-center gap-2 rounded-lg p-1 border" style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}>
            <button onClick={prevWeek} className="p-1.5 hover:bg-gray-200 dark:hover:bg-white/5 rounded-md transition-colors text-muted-foreground"><ChevronLeft className="w-4 h-4" /></button>
            <button onClick={nextWeek} className="p-1.5 hover:bg-gray-200 dark:hover:bg-white/5 rounded-md transition-colors text-muted-foreground"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="flex gap-4 p-3 border-b border-border flex-shrink-0 text-sm overflow-x-auto" style={{ background: 'var(--muted)' }}>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]" /><span className="text-muted-foreground font-medium">Meeting</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.6)]" /><span className="text-muted-foreground font-medium">Maintenance</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-violet-500 shadow-[0_0_8px_rgba(139,92,246,0.6)]" /><span className="text-muted-foreground font-medium">On-Call Support</span></div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="w-16 border-r border-border flex-shrink-0 overflow-hidden relative" style={{ background: 'var(--muted)' }}>
            <div className="h-10 border-b border-border" style={{ background: 'var(--surface)' }} />
            <div className="absolute top-10 left-0 right-0 bottom-0 overflow-y-auto custom-scrollbar overflow-x-hidden pr-2">
              {HOURS.map(hour => (
                <div key={hour} className="h-16 text-xs text-muted-foreground text-right pr-2 -mt-2">
                  {hour === 12 ? '12 PM' : hour > 12 ? `${hour - 12} PM` : `${hour} AM`}
                </div>
              ))}
              <div className="h-16 text-xs text-muted-foreground text-right pr-2 mt-4 font-bold border-t border-border/50 pt-2">Night</div>
            </div>
          </div>

          <div className="flex-1 flex overflow-x-auto custom-scrollbar relative">
            {DAYS.map((day, dayIndex) => {
              const daySchedules = getSchedulesForDay(dayIndex);
              return (
                <div key={day} className="flex-1 min-w-[150px] border-r border-border/50 last:border-0 relative flex flex-col">
                  <div className="h-10 flex flex-col items-center justify-center border-b border-border sticky top-0 z-10 flex-shrink-0" style={{ background: 'var(--surface)' }}>
                    <span className="text-xs font-semibold text-foreground">{day}</span>
                    <span className="text-[10px] text-muted-foreground">{dates[dayIndex]}</span>
                  </div>
                  <div className="relative flex-1 h-[calc(16*64px+64px)] w-full overflow-hidden" style={{ background: 'var(--background)' }}>
                    {HOURS.map((_, i) => (
                      <div key={i} className="absolute left-0 right-0 border-t border-border/50 h-[64px]" style={{ top: `${i * 64}px` }} />
                    ))}
                    {daySchedules.map(schedule => {
                      const pos = calculatePosition(schedule.startTime, schedule.endTime);
                      const content = (
                        <>
                          <div className="font-semibold truncate leading-tight group-hover:text-foreground">{schedule.title}</div>
                          <div className="text-[10px] opacity-80 mt-0.5">{schedule.startTime}-{schedule.endTime}</div>
                          <div className="absolute top-1 right-1 hidden group-hover:flex gap-0.5">
                            <button onClick={(e) => { e.stopPropagation(); openEditModal(schedule); }} className="p-0.5 bg-white/80 dark:bg-black/40 rounded hover:bg-white dark:hover:bg-black/60"><Edit2 className="w-3 h-3" /></button>
                            <button onClick={(e) => { e.stopPropagation(); setDeleteTarget(schedule); }} className="p-0.5 bg-white/80 dark:bg-black/40 rounded hover:bg-white dark:hover:bg-black/60 text-destructive"><Trash2 className="w-3 h-3" /></button>
                          </div>
                        </>
                      );
                      if (pos.isOutlier) {
                        const s = getTypeStyles(schedule.type);
                        return (
                          <div key={schedule.id}
                            className="absolute left-1 right-1 rounded-lg p-1.5 shadow-md text-xs group cursor-pointer transition-all hover:opacity-90 hover:shadow-lg"
                            style={{ top: 'calc(100% - 60px)', height: '54px', background: s.bg, color: s.text, border: `1px solid ${s.border}` }}
                            title={`${schedule.title} (${schedule.startTime} - ${schedule.endTime})`}>
                            {content}
                          </div>
                        );
                      }
                      const s = getTypeStyles(schedule.type);
                      return (
                        <div key={schedule.id}
                          className="absolute left-1 right-1 rounded-lg p-1.5 shadow-md overflow-hidden text-xs group cursor-pointer transition-all hover:opacity-90 hover:shadow-lg z-10"
                          style={{ top: pos.top, height: pos.height, background: s.bg, color: s.text, border: `1px solid ${s.border}` }}
                          title={`${schedule.title} (${schedule.startTime} - ${schedule.endTime})\nAssignee: ${schedule.assignee}`}>
                          {content}
                          {parseFloat(pos.height as string) > 60 && <div className="text-[10px] opacity-80 truncate mt-1">👤 {schedule.assignee}</div>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingSchedule ? 'Edit Schedule' : 'Add Schedule'}>
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Schedule Title *</label>
            <input name="title" required defaultValue={editingSchedule?.title} className="w-full bg-gray-50 dark:bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all invalid:border-destructive" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Type</label>
              <select name="type" defaultValue={editingSchedule?.type || 'Meeting'} className="w-full bg-gray-50 dark:bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer">
                <option value="Meeting">Meeting</option>
                <option value="Maintenance">Maintenance</option>
                <option value="On-Call">On-Call Support</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Day</label>
              <select name="day" defaultValue={editingSchedule?.day || 1} className="w-full bg-gray-50 dark:bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all cursor-pointer">
                <option value="1">Monday</option>
                <option value="2">Tuesday</option>
                <option value="3">Wednesday</option>
                <option value="4">Thursday</option>
                <option value="5">Friday</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Start Time *</label>
              <input name="startTime" type="time" defaultValue={editingSchedule?.startTime || '09:00'} required className="w-full bg-gray-50 dark:bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">End Time *</label>
              <input name="endTime" type="time" defaultValue={editingSchedule?.endTime || '10:00'} required className="w-full bg-gray-50 dark:bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Assignee(s) *</label>
            <input name="assignee" required defaultValue={editingSchedule?.assignee} placeholder="e.g. Budi, Network Team" className="w-full bg-gray-50 dark:bg-background border border-border rounded-lg px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all invalid:border-destructive" />
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-border mt-6">
            <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">{editingSchedule ? 'Save Changes' : 'Add Schedule'}</button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} title="Delete Schedule" message={`Are you sure you want to delete "${deleteTarget?.title}"?`} />
    </div>
  );
}

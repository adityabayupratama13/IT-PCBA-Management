'use client';
import { useState, useEffect } from 'react';
import { CalendarDays, Clock, FileText, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Search } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/context/AuthContext';
import { format, addDays, startOfWeek, subMonths, setDate, isWithinInterval } from 'date-fns';
import { toast } from 'sonner';
import { Modal } from '@/components/Modal';

// --- Types ---
interface AttendanceLog { id: number; member_name: string; date: string; shift: string; overtime_hours: number; overtime_desc: string; [key: string]: unknown; }
interface LeaveReq { id: number; member_name: string; leave_type: string; application_date: string; start_date: string; end_date: string; days_count: number; reason: string; status: string; approved_by: string; userName?: string; [key: string]: unknown; }

const SHIFT_OPTIONS_STAFF = ['Shift 1', 'Shift 2', 'Shift 3', 'Off', 'Leave'];
const SHIFT_OPTIONS_MGMT = ['Normal Shift', 'Off', 'Leave'];
const LEAVE_TYPES = ['Annual Leave', 'Compassionate Leave', 'Maternity Leave', 'Paternity Leave', 'Marriage Leave', 'No Pay Leave'];
const LEAVE_ALLOWANCE = 12;

export default function AttendancePage() {
  const { currentUser, members } = useAuth();
  const isManager = ['Senior', 'Supervisor', 'Manager'].some(role => currentUser?.role?.includes(role));
  
  // API Data
  const { data: logs, refetch: fetchLogs, create: createLog } = useApi<AttendanceLog>('attendance');
  const { data: leaves, refetch: fetchLeaves, create: createLeave, update: updateLeave } = useApi<LeaveReq>('leaves');
  
  // Refresh on mount
  useEffect(() => { fetchLogs(); fetchLeaves(); }, [fetchLogs, fetchLeaves]);
  
  const [activeTab, setActiveTab] = useState<'roster' | 'overtime' | 'leave'>('roster');
  
  // Tab 1: Roster State
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const rosterDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const [savingShift, setSavingShift] = useState(false);
  
  // Tab 2: Overtime State
  const [otMonthOffset, setOtMonthOffset] = useState(0); // 0 = Current Cut-off
  const [otSearch, setOtSearch] = useState('');
  
  // Tab 3: Leave State
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  
  const handleShiftChange = async (memberName: string, date: string, newShift: string) => {
    setSavingShift(true);
    try {
      await createLog({ member_name: memberName, date, shift: newShift, userName: currentUser?.name || '' } as unknown as AttendanceLog);
      toast.success(`Shift updated for ${memberName}`);
      fetchLogs();
    } catch {
      toast.error('Failed to update shift');
    } finally {
      setSavingShift(false);
    }
  };

  const RosterTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-foreground">Weekly Shift Roster</h3>
        <div className="flex items-center gap-2 bg-muted p-1 rounded-lg border border-border">
          <button onClick={() => setWeekStart(addDays(weekStart, -7))} className="p-1 hover:bg-background rounded text-muted-foreground"><ChevronLeft className="w-4 h-4" /></button>
          <span className="text-sm font-medium px-2">{format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}</span>
          <button onClick={() => setWeekStart(addDays(weekStart, 7))} className="p-1 hover:bg-background rounded text-muted-foreground"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>
      
      <div className="overflow-x-auto border border-border rounded-xl">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted text-muted-foreground text-xs uppercase">
            <tr>
              <th className="px-4 py-3 border-r border-border min-w-[150px]">Team Member</th>
              {rosterDates.map(d => (
                <th key={d.toISOString()} className="px-3 py-3 text-center min-w-[110px]">
                  <div className="font-bold">{format(d, 'EEE')}</div>
                  <div className="text-[10px] opacity-70">{format(d, 'MMM d')}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface">
            {members.filter(m => m.status === 'Active').map(member => {
              const isMgmt = ['Senior', 'Supervisor', 'Manager'].some(r => member.role.includes(r));
              const opts = isMgmt ? SHIFT_OPTIONS_MGMT : SHIFT_OPTIONS_STAFF;
              return (
                <tr key={member.id} className="hover:bg-primary/5 transition-colors">
                  <td className="px-4 py-3 border-r border-border">
                    <div className="font-medium text-foreground truncate">{member.name}</div>
                    <div className="text-[10px] text-muted-foreground truncate">{member.role}</div>
                  </td>
                  {rosterDates.map(d => {
                    const dateStr = format(d, 'yyyy-MM-dd');
                    const entry = logs.find(l => l.member_name === member.name && l.date === dateStr);
                    const currentVal = entry?.shift || 'Off';
                    return (
                      <td key={dateStr} className="px-2 py-2 text-center border-r border-border/50 last:border-0 relative">
                        <select 
                          value={currentVal}
                          onChange={(e) => handleShiftChange(member.name, dateStr, e.target.value)}
                          disabled={savingShift || (!isManager && currentUser?.name !== member.name)}
                          className={`w-full text-xs py-1.5 px-1 rounded border-transparent focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all cursor-pointer text-center appearance-none
                            ${currentVal === 'Off' ? 'bg-muted/50 text-muted-foreground' : 
                              currentVal === 'Leave' ? 'bg-destructive/10 text-destructive font-medium border-destructive/20' : 
                              currentVal.includes('Shift 1') || currentVal === 'Normal Shift' ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium border-blue-500/20' :
                              currentVal.includes('Shift 2') ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 font-medium border-orange-500/20' :
                              'bg-violet-500/10 text-violet-600 dark:text-violet-400 font-medium border-violet-500/20'
                            }`}
                        >
                          {opts.map(o => <option key={o} value={o}>{o}</option>)}
                          {currentVal === 'Leave' && !opts.includes('Leave') && <option value="Leave">Leave</option>}
                        </select>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  // --- Helpers Tab 2: Overtime ---
  const OtTab = () => {
    // Cut-off Logic: 16th of previous month to 15th of current target month
    const targetDate = subMonths(new Date(), otMonthOffset);
    const startOfCutoff = setDate(subMonths(targetDate, 1), 16);
    const endOfCutoff = setDate(targetDate, 15);
    
    // Filter members and compute their OT within this interval
    const stats = members.filter(m => m.status === 'Active' && m.name.toLowerCase().includes(otSearch.toLowerCase())).map(m => {
      let periodOt = 0;
      let ytdOt = 0;
      const memberLogs = logs.filter(l => l.member_name === m.name && l.overtime_hours > 0);
      
      memberLogs.forEach(l => {
        const d = new Date(l.date);
        ytdOt += l.overtime_hours;
        if (isWithinInterval(d, { start: startOfCutoff, end: endOfCutoff })) {
          periodOt += l.overtime_hours;
        }
      });
      return { member: m, periodOt, ytdOt, logsToEdit: memberLogs.filter(l => isWithinInterval(new Date(l.date), { start: startOfCutoff, end: endOfCutoff })) };
    });

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h3 className="text-lg font-semibold text-foreground flex items-center gap-2"><Clock className="w-5 h-5 text-primary"/> Overtime Tracker</h3>
            <p className="text-xs text-muted-foreground">Cut-off period: 16th to 15th</p>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input placeholder="Search member..." value={otSearch} onChange={e => setOtSearch(e.target.value)} className="w-full bg-surface border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none" />
            </div>
            <select value={otMonthOffset} onChange={e => setOtMonthOffset(Number(e.target.value))} className="bg-surface border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none cursor-pointer">
              <option value="0">Current ({format(endOfCutoff, 'MMM yyyy')})</option>
              <option value="1">Last Month ({format(subMonths(endOfCutoff, 1), 'MMM yyyy')})</option>
              <option value="2">2 Months Ago ({format(subMonths(endOfCutoff, 2), 'MMM yyyy')})</option>
            </select>
          </div>
        </div>
        
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {stats.map(s => (
            <div key={s.member.id} className="bg-surface border border-border rounded-xl p-4 hover:border-primary/30 transition-all flex flex-col">
              <div className="flex justify-between items-start mb-3 border-b border-border/50 pb-3">
                <div>
                  <h4 className="font-semibold text-foreground text-sm">{s.member.name}</h4>
                  <p className="text-[10px] text-muted-foreground">{s.member.role}</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-primary">{s.periodOt} <span className="text-xs font-normal text-muted-foreground">hrs</span></div>
                  <div className="text-[10px] text-muted-foreground">Period Total</div>
                </div>
              </div>
              
              <div className="flex-1 space-y-2 mb-3 max-h-32 overflow-y-auto custom-scrollbar pr-1">
                {s.logsToEdit.length === 0 && <p className="text-xs text-muted-foreground italic text-center py-2">No overtime in this period</p>}
                {s.logsToEdit.map(l => (
                  <div key={l.id} className="text-xs bg-muted/50 rounded flex justify-between p-1.5 border border-border/50">
                    <span className="font-medium">{format(new Date(l.date), 'dd MMM')}</span>
                    <span className="text-muted-foreground truncate max-w-[120px]" title={l.overtime_desc}>{l.overtime_desc || 'No desc'}</span>
                    <span className="text-primary font-bold">+{l.overtime_hours}h</span>
                  </div>
                ))}
              </div>
              <div className="bg-primary/5 rounded border border-primary/20 px-3 py-2 flex justify-between items-center mt-auto">
                <span className="text-xs font-medium text-foreground">YTD Total (Yearly)</span>
                <span className="text-sm font-bold text-primary">{s.ytdOt}h</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // --- Helpers Tab 3: Leave ---
  const handleLeaveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    try {
      await createLeave({
        member_name: fd.get('member_name') as string, leave_type: fd.get('leave_type') as string,
        application_date: new Date().toISOString().split('T')[0], start_date: fd.get('start_date') as string, 
        end_date: fd.get('end_date') as string, days_count: Number(fd.get('days_count')), reason: fd.get('reason') as string,
        userName: currentUser?.name || ''
      });
      toast.success('Leave application submitted');
      setIsLeaveModalOpen(false);
      fetchLeaves();
    } catch { toast.error('Failed to submit application'); }
  };
  
  const handleApproveReject = async (id: number, status: string) => {
    try {
      await updateLeave({ id, status, approved_by: currentUser?.name || '', userName: currentUser?.name || '' });
      toast.success(`Leave ${status}`);
      fetchLeaves(); fetchLogs(); // Refresh logs to see "Leave" shift entries
    } catch { toast.error('Failed to update leave request'); }
  };

  const LeaveTab = () => {
    // Generate balances dynamically
    const balances = members.filter(m => m.status === 'Active').map(m => {
      const approvedLeaves = leaves.filter(l => l.member_name === m.name && l.status === 'Approved' && l.leave_type === 'Annual Leave');
      const used = approvedLeaves.reduce((sum, l) => sum + l.days_count, 0);
      
      // Simple accrual: 1 day per month since join date within this year.
      const memberJoinDate = m.created_at ? new Date(m.created_at) : new Date();
      const joinYear = memberJoinDate.getFullYear();
      const currYear = new Date().getFullYear();
      const currMonth = new Date().getMonth() + 1; // 1-12
      const joinMonth = memberJoinDate.getMonth() + 1;
      let accrued = 0;
      
      if (currYear > joinYear) accrued = currMonth; // They get 1 per month this year
      else if (currYear === joinYear) accrued = Math.max(1, currMonth - joinMonth + 1);
      
      const balance = Math.min(LEAVE_ALLOWANCE, accrued) - used;
      
      return { name: m.name, used, balance, accrued: Math.min(LEAVE_ALLOWANCE, accrued) };
    });

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center gap-2"><FileText className="w-5 h-5 text-primary"/> Leave Management</h3>
          <button onClick={() => setIsLeaveModalOpen(true)} className="px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-lg shadow-sm">
            Apply for Leave
          </button>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Summary Column */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-surface border border-border rounded-xl p-4">
              <h4 className="text-sm font-semibold text-foreground mb-4">Annual Leave Balances</h4>
              <div className="space-y-3">
                {balances.map(b => (
                  <div key={b.name} className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">{b.name}</span>
                    <div className="flex gap-2 items-center">
                      <span className="text-[10px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded">{b.used} Used</span>
                      <span className={`font-bold ${b.balance <= 3 ? 'text-destructive' : 'text-success'}`}>{b.balance} Left</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Applications Column */}
          <div className="lg:col-span-2">
            <div className="bg-surface border border-border rounded-xl overflow-hidden">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-muted-foreground text-xs uppercase">
                  <tr>
                    <th className="px-4 py-3">Applicant</th>
                    <th className="px-4 py-3">Type & Date</th>
                    <th className="px-4 py-3">Duration</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {leaves.map(l => (
                    <tr key={l.id} className="hover:bg-primary/5 transition-colors">
                      <td className="px-4 py-3 font-medium text-foreground">{l.member_name}</td>
                      <td className="px-4 py-3">
                        <div className="text-foreground">{l.leave_type}</div>
                        <div className="text-[10px] text-muted-foreground">Applied: {l.application_date}</div>
                        <div className="text-[10px] text-muted-foreground italic truncate max-w-[150px]">{l.reason}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-foreground">{l.days_count} Days</div>
                        <div className="text-[10px] text-muted-foreground">{format(new Date(l.start_date), 'dd MMM')} - {format(new Date(l.end_date), 'dd MMM yyyy')}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase
                          ${l.status === 'Approved' ? 'bg-success/10 text-success border border-success/20' : 
                            l.status === 'Rejected' ? 'bg-destructive/10 text-destructive border border-destructive/20' : 
                            'bg-orange-500/10 text-orange-600 border border-orange-500/20'}`}>
                          {l.status}
                        </span>
                        {l.status !== 'Pending' && <div className="text-[9px] text-muted-foreground mt-1">By: {l.approved_by}</div>}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {l.status === 'Pending' && isManager && (
                          <div className="flex justify-end gap-2">
                            <button onClick={() => handleApproveReject(l.id, 'Approved')} className="p-1 hover:bg-success/20 text-success rounded transition-colors" title="Approve"><CheckCircle2 className="w-4 h-4" /></button>
                            <button onClick={() => handleApproveReject(l.id, 'Rejected')} className="p-1 hover:bg-destructive/20 text-destructive rounded transition-colors" title="Reject"><XCircle className="w-4 h-4" /></button>
                          </div>
                        )}
                        {l.status === 'Pending' && !isManager && <span className="text-[10px] text-muted-foreground italic">Pending Approval</span>}
                      </td>
                    </tr>
                  ))}
                  {leaves.length === 0 && <tr><td colSpan={5} className="text-center py-6 text-muted-foreground italic">No leave applications found</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <Modal isOpen={isLeaveModalOpen} onClose={() => setIsLeaveModalOpen(false)} title="Apply for Leave">
          <form onSubmit={handleLeaveSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Employee Name *</label>
              <select name="member_name" required defaultValue={currentUser?.name} className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-foreground focus:ring-1 focus:ring-primary outline-none">
                {isManager ? members.filter(m => m.status === 'Active').map(m => <option key={m.id} value={m.name}>{m.name}</option>) : <option value={currentUser?.name}>{currentUser?.name}</option>}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Leave Type *</label>
              <select name="leave_type" required className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-foreground focus:ring-1 focus:ring-primary outline-none">
                {LEAVE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Start Date *</label>
                <input name="start_date" type="date" required className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-foreground focus:ring-1 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">End Date *</label>
                <input name="end_date" type="date" required className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-foreground focus:ring-1 focus:ring-primary outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Duration (Days) *</label>
                <input name="days_count" type="number" required min="1" className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-foreground focus:ring-1 focus:ring-primary outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Application Date (Auto)</label>
                <input type="text" disabled defaultValue={new Date().toISOString().split('T')[0]} className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-muted-foreground outline-none cursor-not-allowed" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1.5">Reason *</label>
              <textarea name="reason" rows={2} required className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-foreground focus:ring-1 focus:ring-primary outline-none" placeholder="Provide details for this leave..."></textarea>
            </div>
            <div className="pt-4 flex justify-end gap-3 border-t border-border mt-6">
              <button type="button" onClick={() => setIsLeaveModalOpen(false)} className="px-4 py-2 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-surface">Cancel</button>
              <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium shadow-sm">Submit Request</button>
            </div>
          </form>
        </Modal>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-8 h-[calc(100vh-6rem)] flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Attendance & Leave</h1>
          <p className="text-muted-foreground mt-1">Manage shift rosters, overtime records, and track team leaves.</p>
        </div>
      </div>

      <div className="rounded-2xl border flex-1 flex flex-col overflow-hidden bg-surface" style={{ borderColor: 'var(--border)' }}>
        {/* Sub-tab Navigation */}
        <div className="flex p-2 border-b border-border gap-2 bg-muted/30">
          <button 
            onClick={() => setActiveTab('roster')} 
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'roster' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-surface border border-transparent hover:border-border'}`}
          >
            <CalendarDays className="w-4 h-4" /> Shift Roster
          </button>
          <button 
            onClick={() => setActiveTab('overtime')} 
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'overtime' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-surface border border-transparent hover:border-border'}`}
          >
            <Clock className="w-4 h-4" /> Overtime Tracker
          </button>
          <button 
            onClick={() => setActiveTab('leave')} 
            className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'leave' ? 'bg-primary text-white shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-surface border border-transparent hover:border-border'}`}
          >
            <FileText className="w-4 h-4" /> Leave Management
          </button>
        </div>
        
        {/* Content Area */}
        <div className="p-6 flex-1 overflow-y-auto custom-scrollbar">
          {activeTab === 'roster' && <RosterTab />}
          {activeTab === 'overtime' && <OtTab />}
          {activeTab === 'leave' && <LeaveTab />}
        </div>
      </div>
    </div>
  );
}

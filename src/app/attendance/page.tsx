'use client';
import React, { useState, useEffect } from 'react';
import { CalendarDays, Clock, FileText, ChevronLeft, ChevronRight, CheckCircle2, XCircle, Search } from 'lucide-react';
import { useApi } from '@/hooks/useApi';
import { useAuth } from '@/context/AuthContext';
import { format, addDays, startOfWeek, subMonths, setDate, isWithinInterval } from 'date-fns';
import { toast } from 'sonner';
import { Modal } from '@/components/Modal';

// --- Types ---
interface AttendanceLog { id: number; member_name: string; date: string; shift: string; ot_start_time?: string; ot_end_time?: string; overtime_hours: number; overtime_desc: string; [key: string]: unknown; }
interface LeaveReq { id: number; member_name: string; leave_type: string; application_date: string; start_date: string; end_date: string; days_count: number; reason: string; status: string; approved_by: string; userName?: string; [key: string]: unknown; }
interface LeaveBalance { id: string | number; member_name: string; balance: number; last_accrual_month: string; [key: string]: unknown; }

const SHIFT_OPTIONS_STAFF = ['Shift 1', 'Shift 2', 'Shift 3', 'Off', 'Leave'];
const SHIFT_OPTIONS_MGMT = ['Normal Shift', 'Off', 'Leave'];
const LEAVE_TYPES = ['Annual Leave', 'Compassionate Leave', 'Maternity Leave', 'Paternity Leave', 'Marriage Leave', 'No Pay Leave'];

export default function AttendancePage() {
  const { currentUser, members } = useAuth();
  const isManager = ['Senior', 'Supervisor', 'Manager'].some(role => currentUser?.role?.includes(role));
  
  // API Data
  const { data: logs, refetch: fetchLogs, create: createLog } = useApi<AttendanceLog>('attendance');
  const { data: leaves, refetch: fetchLeaves, create: createLeave, update: updateLeave } = useApi<LeaveReq>('leaves');
  const { data: balances, refetch: fetchBalances, update: updateBalance } = useApi<LeaveBalance>('leave-balances');
  
  // Refresh on mount
  useEffect(() => { fetchLogs(); fetchLeaves(); fetchBalances(); }, [fetchLogs, fetchLeaves, fetchBalances]);
  
  const [activeTab, setActiveTab] = useState<'roster' | 'overtime' | 'leave'>('roster');
  
  // Tab 1: Roster State
  const [weekStart, setWeekStart] = useState(startOfWeek(new Date(), { weekStartsOn: 1 }));
  const rosterDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const [savingShift, setSavingShift] = useState(false);
  
  // Tab 2: Overtime State
  const [otMonthOffset, setOtMonthOffset] = useState(0); // 0 = Current Cut-off
  const [otSearch, setOtSearch] = useState('');
  const [isOtModalOpen, setIsOtModalOpen] = useState(false);
  const [editingOtLog, setEditingOtLog] = useState<Partial<AttendanceLog> | null>(null);
  
  // Tab 3: Leave State
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [isBalanceModalOpen, setIsBalanceModalOpen] = useState(false);
  const [editingBalanceMember, setEditingBalanceMember] = useState('');
  
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

  const handleCopyMonday = async (memberName: string) => {
    const mondayStr = format(rosterDates[0], 'yyyy-MM-dd');
    const mondayShift = logs.find(l => l.member_name === memberName && l.date === mondayStr)?.shift;
    if (!mondayShift || mondayShift === 'Off' || mondayShift === 'Leave') {
      return toast.error('Set a valid active shift on Monday first!');
    }
    setSavingShift(true);
    try {
      for (let i = 1; i < 7; i++) {
        const dateStr = format(rosterDates[i], 'yyyy-MM-dd');
        await createLog({ member_name: memberName, date: dateStr, shift: mondayShift, userName: currentUser?.name || '' } as unknown as AttendanceLog);
      }
      toast.success(`Copied Monday's shift for ${memberName}`);
      fetchLogs();
    } catch { toast.error('Failed to copy shift'); }
    finally { setSavingShift(false); }
  };
  
  const handleAutoRotateNextWeek = async () => {
    setSavingShift(true);
    let count = 0;
    try {
      const nextWeekMonday = addDays(weekStart, 7);
      for (const m of members) {
        if (m.status !== 'Active' || !m.role.includes('Analyst & Support')) continue;
        
        const thisMondayStr = format(rosterDates[0], 'yyyy-MM-dd');
        const currentShift = logs.find(l => l.member_name === m.name && l.date === thisMondayStr)?.shift;
        
        if (currentShift && currentShift.includes('Shift')) {
          let nextShift = 'Shift 1';
          if (currentShift === 'Shift 1') nextShift = 'Shift 3';
          else if (currentShift === 'Shift 3') nextShift = 'Shift 2';
          else if (currentShift === 'Shift 2') nextShift = 'Shift 1';
          
          for (let i = 0; i < 7; i++) {
            const dateStr = format(addDays(nextWeekMonday, i), 'yyyy-MM-dd');
            await createLog({ member_name: m.name, date: dateStr, shift: nextShift, userName: currentUser?.name || '' } as unknown as AttendanceLog);
          }
          count++;
        }
      }
      toast.success(`Auto-rotated shifts for ${count} staff next week.`);
      setWeekStart(nextWeekMonday);
      fetchLogs();
    } catch { toast.error('Error auto-rotating shifts'); }
    finally { setSavingShift(false); }
  };

  const RosterTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-foreground">Weekly Shift Roster</h3>
        <div className="flex items-center gap-2 bg-muted p-1 rounded-lg border border-border">
          {isManager && <button onClick={handleAutoRotateNextWeek} className="px-3 py-1 bg-primary text-primary-foreground text-xs font-medium rounded shadow-sm mr-2 hover:bg-primary/90 transition-colors" title="Rotate staff shifts 1->2->3->1 for next week">Auto-Rotate (Next Wk)</button>}
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
              const isNormalShift = !member.role.includes('Analyst & Support');
              const opts = isNormalShift ? SHIFT_OPTIONS_MGMT : SHIFT_OPTIONS_STAFF;
              return (
                <tr key={member.id} className="hover:bg-primary/5 transition-colors">
                  <td className="px-4 py-3 border-r border-border">
                    <div className="font-medium text-foreground truncate">{member.name}</div>
                    <div className="flex items-center justify-between mt-1">
                      <div className="text-[10px] text-muted-foreground truncate">{member.role}</div>
                      {isManager && opts === SHIFT_OPTIONS_STAFF && (
                        <button onClick={() => handleCopyMonday(member.name)} className="text-[10px] font-semibold text-primary/80 hover:text-primary transition-colors flex-shrink-0" title="Copy Monday shift to entire week">Copy Wk</button>
                      )}
                    </div>
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
  const calculateJamHidup = (jamMati: number, role: string) => {
    const r = role.toUpperCase();
    const isMOrS = /S[1-3]|M[1-3]/.test(r) || ['SENIOR', 'SUPERVISOR', 'MANAGER'].some(x => r.includes(x));
    if (isMOrS) return jamMati;
    // Line/Staff calculation: 1.5x for 1st hour, 2.0x remaining
    if (jamMati <= 1) return jamMati * 1.5;
    return 1.5 + ((jamMati - 1) * 2);
  };

  const handleOTSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    try {
      const dateStr = fd.get('date') as string;
      const mem = fd.get('member_name') as string;
      const start = fd.get('ot_start_time') as string;
      const end = fd.get('ot_end_time') as string;
      
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      let diff = (eh * 60 + em) - (sh * 60 + sm);
      if (diff < 0) diff += 24 * 60; // if shifted past midnight
      const hours = diff / 60;

      const existingShift = logs.find(l => l.member_name === mem && l.date === dateStr)?.shift || 'Off';
      
      await createLog({
        member_name: mem, 
        date: dateStr, 
        shift: existingShift,
        ot_start_time: start,
        ot_end_time: end,
        overtime_hours: Number(hours.toFixed(2)), 
        overtime_desc: fd.get('reason') as string, 
        userName: currentUser?.name || ''
      } as unknown as AttendanceLog);
      
      toast.success('Overtime recorded successfully');
      setIsOtModalOpen(false);
      fetchLogs();
    } catch { toast.error('Failed to record overtime'); }
  };
  
  const handleRemoveOT = async (log: AttendanceLog) => {
    if(!confirm('Remove this overtime record?')) return;
    try {
      await createLog({ member_name: log.member_name, date: log.date, shift: log.shift, overtime_hours: 0, overtime_desc: '', userName: currentUser?.name || '' } as unknown as AttendanceLog);
      fetchLogs(); toast.success('Overtime removed');
    } catch { toast.error('Error removing OT'); }
  };

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
            <p className="text-xs text-muted-foreground">Detailed calculation including physical vs formulated hours.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-48 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input placeholder="Search member..." value={otSearch} onChange={e => setOtSearch(e.target.value)} className="w-full bg-surface border border-border rounded-lg pl-9 pr-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none" />
            </div>
            <select value={otMonthOffset} onChange={e => setOtMonthOffset(Number(e.target.value))} className="bg-surface border border-border w-full sm:w-auto rounded-lg px-3 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none cursor-pointer">
              <option value="0">Current Cut-off ({format(endOfCutoff, 'MMM yyyy')})</option>
              <option value="1">Last Month ({format(subMonths(endOfCutoff, 1), 'MMM yyyy')})</option>
              <option value="2">2 Months Ago ({format(subMonths(endOfCutoff, 2), 'MMM yyyy')})</option>
            </select>
            <button onClick={() => { setEditingOtLog(null); setIsOtModalOpen(true); }} className="px-4 py-2 w-full sm:w-auto bg-primary text-primary-foreground text-sm font-medium rounded-lg shadow whitespace-nowrap hover:bg-primary/90">
              + Add Overtime
            </button>
          </div>
        </div>
        
        <div className="bg-surface border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted text-muted-foreground text-xs uppercase">
              <tr>
                <th className="px-4 py-3 border-b border-border">Name & Role</th>
                <th className="px-4 py-3 border-b border-border">Date & Description</th>
                <th className="px-4 py-3 border-b border-border text-center">Time Range</th>
                <th className="px-4 py-3 border-b border-border text-center">Jam Mati<br/><span className="lowercase font-normal mt-0.5 text-[9px] block">Actual</span></th>
                <th className="px-4 py-3 border-b border-border text-center">Jam Hidup<br/><span className="lowercase font-normal mt-0.5 text-[9px] block">Formulated</span></th>
                {isManager && <th className="px-4 py-3 border-b border-border text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {stats.map(s => {
                if (s.logsToEdit.length === 0) return null;
                const totalMati = s.periodOt;
                const totalHidup = s.logsToEdit.reduce((acc, l) => acc + calculateJamHidup(l.overtime_hours, s.member.role), 0);
                return (
                  <React.Fragment key={s.member.id}>
                    {s.logsToEdit.map((l, idx) => {
                      const jnHidup = calculateJamHidup(l.overtime_hours, s.member.role);
                      return (
                        <tr key={l.id} className="hover:bg-muted/30 transition-colors">
                          {idx === 0 && (
                            <td className="px-4 py-3 align-top border-r border-border bg-muted/10 w-[200px]" rowSpan={s.logsToEdit.length}>
                              <div className="font-semibold text-foreground">{s.member.name}</div>
                              <div className="text-[10px] text-muted-foreground">{s.member.role}</div>
                              <div className="mt-4 pt-3 border-t border-border/50">
                                <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1 mt-1">Total (P)</div>
                                <div className="flex gap-4">
                                  <div>
                                    <div className="text-sm font-bold text-foreground">{totalMati.toFixed(1)}h</div>
                                    <div className="text-[9px] text-muted-foreground">Mati</div>
                                  </div>
                                  <div>
                                    <div className="text-sm font-bold text-primary">{totalHidup.toFixed(1)}h</div>
                                    <div className="text-[9px] text-muted-foreground">Hidup</div>
                                  </div>
                                </div>
                              </div>
                            </td>
                          )}
                          <td className="px-4 py-3 w-[250px]">
                            <div className="font-medium">{format(new Date(l.date), 'dd MMM yyyy')}</div>
                            <div className="text-xs text-muted-foreground truncate" title={l.overtime_desc}>{l.overtime_desc || 'No reason specified'}</div>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span className="bg-background border border-border px-2 py-1 rounded text-xs font-mono">
                              {l.ot_start_time || '--:--'} - {l.ot_end_time || '--:--'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center font-bold text-foreground/80">{Number(l.overtime_hours).toFixed(1)}h</td>
                          <td className="px-4 py-3 text-center font-bold text-primary">{jnHidup.toFixed(1)}h</td>
                          {isManager && (
                            <td className="px-4 py-3 text-right space-x-2">
                               <button onClick={() => { setEditingOtLog(l); setIsOtModalOpen(true); }} className="text-[10px] font-medium text-primary hover:underline">Edit</button>
                               <button onClick={() => handleRemoveOT(l)} className="text-[10px] font-medium text-destructive hover:underline">Remove</button>
                            </td>
                          )}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
              {stats.every(s => s.logsToEdit.length === 0) && (
                <tr>
                  <td colSpan={6} className="text-center py-10 text-muted-foreground italic">No overtime records found in this period.</td>
                </tr>
              )}
            </tbody>
          </table>
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

  const handleUpdateBalance = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.target as HTMLFormElement);
    try {
      await updateBalance({
        member_name: editingBalanceMember,
        balance: Number(fd.get('balance')),
        last_accrual_month: format(new Date(), 'yyyy-MM'),
        userName: currentUser?.name || ''
      } as unknown as LeaveBalance);
      toast.success('Balance updated');
      setIsBalanceModalOpen(false);
      fetchBalances();
    } catch { toast.error('Failed to update balance'); }
  };

  const LeaveTab = () => {
    const balancesDisplay = members.filter(m => m.status === 'Active').map(m => {
      const bObj = balances?.find(b => b.member_name === m.name);
      return {
        name: m.name,
        balance: bObj?.balance || 0,
        lastAccrual: bObj?.last_accrual_month || 'Not Set'
      };
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
                {balancesDisplay.map(b => (
                  <div key={b.name} className="flex justify-between items-center text-sm p-2 hover:bg-muted/50 rounded transition-colors group">
                    <div className="flex flex-col">
                      <span className="text-foreground font-medium">{b.name}</span>
                      <span className="text-[10px] text-muted-foreground">Accrued: {b.lastAccrual}</span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className={`font-bold ${b.balance <= 3 ? 'text-destructive' : 'text-success'}`}>{b.balance} Left</span>
                      {isManager && (
                        <button onClick={() => { setEditingBalanceMember(b.name); setIsBalanceModalOpen(true); }} className="opacity-0 group-hover:opacity-100 text-[10px] text-primary hover:underline transition-opacity">Edit</button>
                      )}
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
      
      {/* Absolute Root Modals (Independent of Tabs) */}
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

      <Modal isOpen={isOtModalOpen} onClose={() => setIsOtModalOpen(false)} title={editingOtLog?.date ? "Edit Overtime" : "Add Overtime"}>
        <form onSubmit={handleOTSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Employee Name *</label>
            <select name="member_name" required defaultValue={editingOtLog?.member_name || currentUser?.name} className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-foreground focus:ring-1 focus:ring-primary outline-none">
              {isManager ? members.filter(m => m.status === 'Active').map(m => <option key={m.id} value={m.name}>{m.name}</option>) : <option value={currentUser?.name}>{currentUser?.name}</option>}
            </select>
          </div>
          <div>
             <label className="block text-sm font-medium text-muted-foreground mb-1.5">Date *</label>
             <input name="date" type="date" required defaultValue={editingOtLog?.date || format(new Date(), 'yyyy-MM-dd')} className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-foreground focus:ring-1 focus:ring-primary outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Start Hour *</label>
                <input name="ot_start_time" type="time" required defaultValue={editingOtLog?.ot_start_time || '18:00'} className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-foreground focus:ring-1 focus:ring-primary outline-none" />
             </div>
             <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">Finish Hour *</label>
                <input name="ot_end_time" type="time" required defaultValue={editingOtLog?.ot_end_time || '20:00'} className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-foreground focus:ring-1 focus:ring-primary outline-none" />
             </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">Reason / Details *</label>
            <textarea name="reason" rows={2} required defaultValue={editingOtLog?.overtime_desc || ''} className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-foreground focus:ring-1 focus:ring-primary outline-none" placeholder="Reason for overtime..."></textarea>
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-border mt-6">
            <button type="button" onClick={() => setIsOtModalOpen(false)} className="px-4 py-2 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-surface">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium shadow-sm">Save Overtime</button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isBalanceModalOpen} onClose={() => setIsBalanceModalOpen(false)} title="Update Leave Balance">
        <form onSubmit={handleUpdateBalance} className="space-y-4">
          <p className="text-sm text-muted-foreground">Set the initial manual balance for <strong className="text-foreground">{editingBalanceMember}</strong>. The system will auto-add +1 day per month starting next month.</p>
          <div>
             <label className="block text-sm font-medium text-muted-foreground mb-1.5">Current Balance (Days) *</label>
             <input name="balance" type="number" required defaultValue={balances?.find(b => b.member_name === editingBalanceMember)?.balance || 0} className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-foreground focus:ring-1 focus:ring-primary outline-none" />
          </div>
          <div className="pt-4 flex justify-end gap-3 border-t border-border mt-6">
            <button type="button" onClick={() => setIsBalanceModalOpen(false)} className="px-4 py-2 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-surface">Cancel</button>
            <button type="submit" className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg text-sm font-medium shadow-sm">Save Balance</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

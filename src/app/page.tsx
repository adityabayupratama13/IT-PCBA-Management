'use client';
import { useEffect, useState } from 'react';
import { Users, Ticket, CheckSquare, Activity, Clock, BarChart3, AlertCircle } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend
} from 'recharts';

interface Stats { members: number; tickets: { total: number; open: number; inProgress: number; resolved: number }; tasks: { total: number; backlog: number; inProgress: number; done: number }; logs: number; }
interface AuditLog { id: number; action: string; module: string; details: string; user_name: string; timestamp: string; }

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats>({ members: 0, tickets: { total: 0, open: 0, inProgress: 0, resolved: 0 }, tasks: { total: 0, backlog: 0, inProgress: 0, done: 0 }, logs: 0 });
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/members').then(r => r.json()),
      fetch('/api/tickets').then(r => r.json()),
      fetch('/api/tasks').then(r => r.json()),
      fetch('/api/daily-logs').then(r => r.json()),
      fetch('/api/audit').then(r => r.json()),
    ]).then(([m, t, tk, dl, al]) => {
      setRecentLogs(al.slice(0, 8));
      setStats({
        members: m.length,
        tickets: {
          total: t.length,
          open: t.filter((x: { status: string }) => x.status === 'Open').length,
          inProgress: t.filter((x: { status: string }) => x.status === 'In Progress').length,
          resolved: t.filter((x: { status: string }) => ['Resolved', 'Closed'].includes(x.status)).length,
        },
        tasks: {
          total: tk.length,
          backlog: tk.filter((x: { status: string }) => x.status === 'Backlog').length,
          inProgress: tk.filter((x: { status: string }) => x.status === 'In Progress').length,
          done: tk.filter((x: { status: string }) => x.status === 'Done').length,
        },
        logs: dl.length,
      });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const ticketPie = [
    { name: 'Open', value: stats.tickets.open, color: '#3B82F6' },
    { name: 'In Progress', value: stats.tickets.inProgress, color: '#8B5CF6' },
    { name: 'Resolved', value: stats.tickets.resolved, color: '#10B981' },
  ].filter(d => d.value > 0);

  const taskBar = [
    { name: 'Backlog', count: stats.tasks.backlog, fill: '#64748B' },
    { name: 'In Progress', count: stats.tasks.inProgress, fill: '#3B82F6' },
    { name: 'Done', count: stats.tasks.done, fill: '#10B981' },
  ];

  const actionStyle = (a: string) => {
    if (['Created', 'Logged In'].includes(a)) return 'bg-emerald-500/15 text-emerald-400';
    if (a === 'Deleted') return 'bg-rose-500/15 text-rose-400';
    if (a === 'Updated') return 'bg-blue-500/15 text-blue-400';
    return 'bg-gray-500/15 text-gray-400';
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" /></div>;

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Team Members', val: stats.members + 1, sub: 'Incl. Master', icon: <Users className="w-5 h-5" />, cls: 'text-primary bg-primary/10 border-primary/20' },
          { label: 'Active Tickets', val: stats.tickets.open + stats.tickets.inProgress, sub: `${stats.tickets.resolved} resolved`, icon: <Ticket className="w-5 h-5" />, cls: 'text-orange-400 bg-orange-500/10 border-orange-500/20' },
          { label: 'Tasks', val: stats.tasks.total, sub: `${stats.tasks.done} done`, icon: <CheckSquare className="w-5 h-5" />, cls: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' },
          { label: 'Daily Logs', val: stats.logs, sub: 'All time', icon: <Activity className="w-5 h-5" />, cls: 'text-violet-400 bg-violet-500/10 border-violet-500/20' },
        ].map(s => (
          <div key={s.label} className="rounded-2xl border p-4 flex items-center gap-4" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
            <div className={`p-2.5 rounded-xl border ${s.cls}`}>{s.icon}</div>
            <div>
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="text-2xl font-bold text-foreground">{s.val}</p>
              <p className="text-xs text-muted-foreground">{s.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl p-5 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4"><BarChart3 className="w-4 h-4 text-primary" /> Task Status</h2>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={taskBar} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {taskBar.map((e, i) => <Cell key={i} fill={e.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl p-5 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4"><AlertCircle className="w-4 h-4 text-orange-400" /> Ticket Breakdown</h2>
          {ticketPie.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={ticketPie} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={3} dataKey="value">
                  {ticketPie.map((e, i) => <Cell key={i} fill={e.color} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-sm text-muted-foreground text-center py-12">No tickets yet</p>}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-2xl p-5 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
        <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4"><Clock className="w-4 h-4 text-primary" /> Recent Activity</h2>
        <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
          {recentLogs.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No activity yet</p>}
          {recentLogs.map(log => (
            <div key={log.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/30 transition-colors">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${actionStyle(log.action)} flex-shrink-0 mt-0.5`}>{log.action}</span>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate">{log.details}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {log.user_name} · {log.module} · {new Date(log.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

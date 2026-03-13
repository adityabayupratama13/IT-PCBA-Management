'use client';
import { useEffect, useState } from 'react';
import { Users, Ticket, CheckSquare, Activity, Clock, TrendingUp, AlertCircle, BarChart3, Calendar } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend
} from 'recharts';

interface StatData { members: number; tickets: { total: number; open: number; inProgress: number; resolved: number }; tasks: { total: number; backlog: number; inProgress: number; done: number }; logs: number; }
interface AuditLog { id: number; action: string; module: string; details: string; user_name: string; timestamp: string; }
interface Member { id: number; name: string; status: string; }
interface Task { id: number; status: string; assignee: string; }

function StatCard({ title, value, subtitle, icon, color, trend }: { title: string; value: string | number; subtitle?: string; icon: React.ReactNode; color: string; trend?: string }) {
  return (
    <div className="rounded-2xl border p-5 flex items-center gap-4 transition-all hover:border-primary/30 hover:shadow-lg group" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <div className={`p-3 rounded-xl border flex-shrink-0 ${color} transition-transform group-hover:scale-110`}>{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
        <p className="text-3xl font-bold text-foreground mt-0.5">{value}</p>
        {subtitle && <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
      {trend && <div className="text-xs font-semibold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">{trend}</div>}
    </div>
  );
}

export default function DashboardPage() {
  const [stats, setStats] = useState<StatData>({ members: 0, tickets: { total: 0, open: 0, inProgress: 0, resolved: 0 }, tasks: { total: 0, backlog: 0, inProgress: 0, done: 0 }, logs: 0 });
  const [recentLogs, setRecentLogs] = useState<AuditLog[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/members').then(r => r.json()),
      fetch('/api/tickets').then(r => r.json()),
      fetch('/api/tasks').then(r => r.json()),
      fetch('/api/daily-logs').then(r => r.json()),
      fetch('/api/audit').then(r => r.json()),
    ]).then(([m, t, tk, dl, al]) => {
      setMembers(m);
      setTasks(tk);
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

  // Task by assignee workload
  const workloadData = Object.entries(
    tasks.reduce((acc: Record<string, number>, t: Task) => {
      acc[t.assignee] = (acc[t.assignee] || 0) + 1;
      return acc;
    }, {})
  ).map(([name, tasks]) => ({ name, tasks })).sort((a, b) => b.tasks - a.tasks).slice(0, 6);

  // Ticket status pie
  const ticketPie = [
    { name: 'Open', value: stats.tickets.open, color: '#3B82F6' },
    { name: 'In Progress', value: stats.tickets.inProgress, color: '#8B5CF6' },
    { name: 'Resolved/Closed', value: stats.tickets.resolved, color: '#10B981' },
  ].filter(d => d.value > 0);

  // Task status bar
  const taskBar = [
    { name: 'Backlog', count: stats.tasks.backlog, fill: '#64748B' },
    { name: 'In Progress', count: stats.tasks.inProgress, fill: '#3B82F6' },
    { name: 'Done', count: stats.tasks.done, fill: '#10B981' },
  ];

  const actionColor = (action: string) => {
    if (['Created', 'Logged In'].includes(action)) return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25';
    if (action === 'Deleted') return 'bg-rose-500/15 text-rose-400 border-rose-500/25';
    if (action === 'Updated') return 'bg-blue-500/15 text-blue-400 border-blue-500/25';
    return 'bg-gray-500/15 text-gray-400 border-gray-500/25';
  };

  const ChartCard = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
    <div className="rounded-2xl p-5 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
      <h2 className="text-sm font-semibold text-foreground flex items-center gap-2 mb-4">{icon}{title}</h2>
      {children}
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">IT Operations Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Live overview — {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Team Members" value={stats.members + 1} subtitle="Incl. IT Master" icon={<Users className="w-5 h-5" />} color="bg-primary/10 border-primary/20 text-primary" />
        <StatCard title="Active Tickets" value={stats.tickets.open + stats.tickets.inProgress} subtitle={`${stats.tickets.resolved} resolved`} icon={<Ticket className="w-5 h-5" />} color="bg-orange-500/10 border-orange-500/20 text-orange-400" />
        <StatCard title="Tasks Total" value={stats.tasks.total} subtitle={`${stats.tasks.done} completed`} icon={<CheckSquare className="w-5 h-5" />} color="bg-emerald-500/10 border-emerald-500/20 text-emerald-400" />
        <StatCard title="Daily Log Entries" value={stats.logs} subtitle="All time" icon={<Activity className="w-5 h-5" />} color="bg-violet-500/10 border-violet-500/20 text-violet-400" />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Task Status Distribution */}
        <ChartCard title="Task Status" icon={<BarChart3 className="w-4 h-4 text-primary" />}>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={taskBar} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {taskBar.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Ticket Status Pie */}
        <ChartCard title="Ticket Breakdown" icon={<AlertCircle className="w-4 h-4 text-orange-400" />}>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={ticketPie} cx="50%" cy="50%" innerRadius={45} outerRadius={70} paddingAngle={3} dataKey="value">
                {ticketPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11, color: 'var(--muted-foreground)' }} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Workload by Assignee */}
        <ChartCard title="Task Workload" icon={<TrendingUp className="w-4 h-4 text-violet-400" />}>
          <div className="space-y-2.5">
            {workloadData.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No tasks yet</p>}
            {workloadData.slice(0, 5).map(({ name, tasks: count }) => {
              const pct = Math.round((count / (workloadData[0]?.tasks || 1)) * 100);
              return (
                <div key={name}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-foreground">{name}</span>
                    <span className="text-muted-foreground">{count} tasks</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </ChartCard>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Recent Activity */}
        <ChartCard title="Recent Activity" icon={<Clock className="w-4 h-4 text-primary" />}>
          <div className="space-y-2.5 max-h-64 overflow-y-auto custom-scrollbar">
            {recentLogs.length === 0 && <p className="text-sm text-muted-foreground text-center py-6">No activity yet</p>}
            {recentLogs.map(log => (
              <div key={log.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${actionColor(log.action)} flex-shrink-0 mt-0.5`}>{log.action}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{log.details}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    <span className="font-medium">{log.user_name}</span> · {log.module} · {new Date(log.timestamp).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </ChartCard>

        {/* Team Online Status */}
        <ChartCard title="Team Members" icon={<Users className="w-4 h-4 text-emerald-400" />}>
          <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
            {/* Master account */}
            <div className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
              <div className="relative">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/40 to-violet-500/40 flex items-center justify-center text-foreground font-bold text-sm border border-white/10">A</div>
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-[var(--surface)] shadow-[0_0_6px_rgba(52,211,153,0.6)]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">Aditya Bayu Pratama</p>
                <p className="text-xs text-muted-foreground">IT Master · Management</p>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/15 text-primary border border-primary/25">MASTER</span>
            </div>
            {members.map(m => {
              const avatarColors = ['from-violet-500/40 to-blue-500/40', 'from-emerald-500/40 to-cyan-500/40', 'from-orange-500/40 to-pink-500/40'];
              return (
                <div key={m.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                  <div className="relative">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${avatarColors[m.id % avatarColors.length]} flex items-center justify-center text-foreground font-bold text-sm border border-white/10`}>
                      {m.name.charAt(0)}
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[var(--surface)] ${m.status === 'Active' ? 'bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)]' : 'bg-gray-500'}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{m.status}</p>
                  </div>
                </div>
              );
            })}
          </div>
          {members.length === 0 && (
            <div className="text-center py-6">
              <Calendar className="w-8 h-8 text-muted-foreground mx-auto mb-2 opacity-40" />
              <p className="text-sm text-muted-foreground">No members registered yet</p>
            </div>
          )}
        </ChartCard>
      </div>
    </div>
  );
}

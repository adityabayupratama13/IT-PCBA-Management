'use client';

import { useState, useMemo } from 'react';
import { Users, Ticket, CheckSquare, Activity, Clock, BarChart3 } from 'lucide-react';
import { StatCard } from '@/components/StatCard';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  LineChart, Line
} from 'recharts';
import { format, subDays } from 'date-fns';

const generateData = (days: number) =>
  Array.from({ length: days }).map((_, i) => ({
    name: format(subDays(new Date(), days - 1 - i), 'MMM dd'),
    completed: Math.floor(Math.random() * 20) + 5,
    resolutionTime: Math.floor(Math.random() * 48) + 12,
  }));



const WORKLOAD_DATA = [
  { name: 'Adi', tasks: 12 },
  { name: 'Budi', tasks: 8 },
  { name: 'Citra', tasks: 15 },
  { name: 'Deni', tasks: 5 },
];

const PROJECT_COMPLETION = [
  { name: 'ERP Upgrade', value: 75, fill: '#3B82F6' },
  { name: 'Network Sync', value: 40, fill: '#8B5CF6' },
  { name: 'Cloud Migration', value: 90, fill: '#10B981' },
];

const RECENT_ACTIVITY = [
  { id: 1, type: 'ticket', message: 'Ticket #104 created by Adi', time: '2 hours ago', color: '#3B82F6' },
  { id: 2, type: 'task', message: 'Server Maintenance task marked as Done', time: '4 hours ago', color: '#10B981' },
  { id: 3, type: 'asset', message: 'New Laptop assigned to Budi', time: '1 day ago', color: '#8B5CF6' },
  { id: 4, type: 'ticket', message: 'Ticket #102 resolved by Citra', time: '1 day ago', color: '#10B981' },
];

const TEAM_MEMBERS = [
  { id: 1, name: 'Adi', isOnline: true, initials: 'AD' },
  { id: 2, name: 'Budi', isOnline: true, initials: 'BU' },
  { id: 3, name: 'Citra', isOnline: false, initials: 'CI' },
  { id: 4, name: 'Deni', isOnline: true, initials: 'DE' },
  { id: 5, name: 'Eka', isOnline: false, initials: 'EK' },
];

// Reusable chart container
function ChartCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl p-6 border transition-all duration-300 hover:border-primary/40"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <h2 className="text-base font-semibold text-foreground flex items-center gap-2 mb-5">
        {icon} {title}
      </h2>
      {children}
    </div>
  );
}

export default function Dashboard() {
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month'>('week');

  const chartData = useMemo(() => {
    switch (dateRange) {
      case 'today': return generateData(1);
      case 'month': return generateData(30);
      default: return generateData(7);
    }
  }, [dateRange]);

  const stats = useMemo(() => {
    const m = dateRange === 'month' ? 3 : dateRange === 'today' ? 0.2 : 1;
    return [
      { title: 'Total Members',  value: 5, icon: <Users className="w-5 h-5" />, trend: { value: 0, isUp: true }, accent: 'blue' as const },
      { title: 'Open Tickets',   value: Math.ceil(3 * m), icon: <Ticket className="w-5 h-5" />, trend: { value: Math.ceil(12 * m), isUp: false }, accent: 'violet' as const },
      { title: 'Active Tasks',   value: Math.ceil(8 * m), icon: <CheckSquare className="w-5 h-5" />, trend: { value: Math.ceil(5 * m), isUp: true }, accent: 'emerald' as const },
    ];
  }, [dateRange]);

  // Tooltip style based on CSS vars
  const tooltipStyle = {
    backgroundColor: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    color: 'var(--foreground)',
    fontSize: '13px',
  };

  return (
    <div className="space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard Overview</h1>
          <p className="text-muted-foreground mt-1 text-sm">Advanced analytics and telemetry</p>
        </div>
        <div className="flex rounded-xl p-1 gap-1 border"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          {(['today', 'week', 'month'] as const).map(range => (
            <button
              key={range}
              onClick={() => setDateRange(range)}
              className={`px-4 py-1.5 text-sm font-medium rounded-lg capitalize transition-all ${
                dateRange === range
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {range === 'today' ? 'Today' : `This ${range}`}
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards */}
      <div id="dashboard-stats" className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {stats.map((stat, i) => (
          <StatCard key={i} {...stat} />
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <ChartCard title="Task Completion Trend" icon={<Activity className="w-4 h-4 text-primary" />}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'var(--primary-glow)' }} contentStyle={tooltipStyle} />
                <Bar dataKey="completed" fill="var(--primary)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        <ChartCard title="Avg Resolution Time (Hours)" icon={<Clock className="w-4 h-4 text-secondary" />}>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Line
                  type="monotone" dataKey="resolutionTime" stroke="var(--secondary)"
                  strokeWidth={2.5} dot={{ fill: 'var(--secondary)', r: 4, strokeWidth: 0 }}
                  activeDot={{ r: 6, fill: 'var(--secondary)', strokeWidth: 0 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Team Workload */}
        <ChartCard title="Team Workload" icon={<BarChart3 className="w-4 h-4 text-amber-500" />}>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={WORKLOAD_DATA} layout="vertical" margin={{ left: -20 }}>
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" stroke="var(--muted-foreground)" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'var(--primary-glow)' }} contentStyle={tooltipStyle} />
                <Bar dataKey="tasks" fill="#F59E0B" radius={[0, 6, 6, 0]} barSize={22} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ChartCard>

        {/* Project Completion */}
        <ChartCard title="Project Progress" icon={<Activity className="w-4 h-4 text-violet-500" />}>
          <div className="space-y-4 mt-2">
            {PROJECT_COMPLETION.map(project => (
              <div key={project.name}>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="font-medium text-foreground">{project.name}</span>
                  <span className="text-muted-foreground font-semibold">{project.value}%</span>
                </div>
                <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: 'var(--muted)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${project.value}%`, backgroundColor: project.fill }}
                  />
                </div>
              </div>
            ))}
          </div>
        </ChartCard>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Team Online */}
        <div className="lg:col-span-2 rounded-2xl p-6 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h2 className="text-base font-semibold text-foreground mb-5">Team Online Status</h2>
          <div className="flex flex-wrap gap-4">
            {TEAM_MEMBERS.map(member => (
              <div key={member.id} className="relative group cursor-pointer">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-sm border-2 transition-transform group-hover:scale-110 ${
                  member.isOnline
                    ? 'border-primary/40 bg-primary/10 text-primary shadow-[0_0_12px_rgba(59,130,246,0.2)]'
                    : 'border-border bg-muted text-muted-foreground opacity-50'
                }`}>
                  {member.initials}
                </div>
                <div className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2`}
                  style={{ borderColor: 'var(--surface)', background: member.isOnline ? 'var(--success)' : 'var(--muted-foreground)' }}
                />
                {member.isOnline && <div className="w-full h-full absolute inset-0 rounded-xl bg-primary/10 animate-ping opacity-20" />}
                {/* Tooltip */}
                <div className="absolute -top-9 left-1/2 -translate-x-1/2 px-2.5 py-1.5 rounded-lg text-xs text-foreground opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap z-10 shadow-lg"
                  style={{ background: 'var(--surface-2)', border: '1px solid var(--border)' }}
                >
                  {member.name} · <span style={{ color: member.isOnline ? 'var(--success)' : 'var(--muted-foreground)' }}>{member.isOnline ? 'Online' : 'Offline'}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 pt-4 border-t flex items-center justify-between text-sm"
            style={{ borderColor: 'var(--border)' }}
          >
            <span className="text-muted-foreground">
              <span className="font-semibold text-success">{TEAM_MEMBERS.filter(m => m.isOnline).length}</span> online
            </span>
            <span className="text-muted-foreground">
              <span className="font-semibold text-foreground">{TEAM_MEMBERS.length}</span> total
            </span>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-3 rounded-2xl p-6 border" style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}>
          <h2 className="text-base font-semibold text-foreground mb-5">Recent Activity</h2>
          <div className="space-y-4">
            {RECENT_ACTIVITY.map(activity => (
              <div key={activity.id} className="flex gap-3.5 group">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 border transition-all group-hover:scale-110"
                    style={{ background: `${activity.color}15`, borderColor: `${activity.color}30` }}
                  >
                    <div className="w-2 h-2 rounded-full" style={{ background: activity.color }} />
                  </div>
                </div>
                <div className="flex-1 min-w-0 pt-1">
                  <p className="text-sm text-foreground/90 group-hover:text-foreground transition-colors leading-snug">{activity.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-5 py-2.5 rounded-xl text-sm font-medium text-primary border transition-all hover:bg-primary/8"
            style={{ borderColor: 'var(--primary)', opacity: 0.7 }}
          >
            View All Activity →
          </button>
        </div>
      </div>
    </div>
  );
}

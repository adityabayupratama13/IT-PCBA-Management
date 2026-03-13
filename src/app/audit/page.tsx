'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useApi } from '@/hooks/useApi';
import { History, Search, Filter } from 'lucide-react';
import { ExportButtons } from '@/components/ExportButtons';
import { EmptyState } from '@/components/EmptyState';

interface AuditLog { id: number; action: string; module: string; details: string; user_name: string; timestamp: string; }

export default function AuditLogPage() {
  const { auditLogs: contextLogs } = useAuth();
  const { data: dbLogs } = useApi<AuditLog>('audit');
  // Prefer fresh DB logs; fall back to context (optimistic updates)
  const auditLogs = dbLogs.length > 0 ? dbLogs : contextLogs;
  const [searchTerm, setSearchTerm] = useState('');
  const [filterModule, setFilterModule] = useState('All');

  const modules = ['All', ...Array.from(new Set(auditLogs.map(log => log.module)))];

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.details.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          log.user_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = filterModule === 'All' || log.module === filterModule;
    return matchesSearch && matchesModule;
  });

  const columns = [
    { header: 'Timestamp', key: 'timestamp' },
    { header: 'User', key: 'user' },
    { header: 'Action', key: 'action' },
    { header: 'Module', key: 'module' },
    { header: 'Details', key: 'details' }
  ];

  const exportData = filteredLogs.map(log => ({
    ...log,
    timestamp: new Date(log.timestamp).toLocaleString()
  }));

  return (
    <div className="space-y-6 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Audit Log</h1>
          <p className="text-muted-foreground mt-1">System-wide activity tracking and history</p>
        </div>
        <ExportButtons data={exportData} filename="System_Audit_Log" columns={columns} />
      </div>

      <div className="bg-white dark:bg-surface border border-border rounded-xl shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-border flex flex-col sm:flex-row gap-4 bg-gray-50 dark:bg-background/50">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search history..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white dark:bg-background border border-border rounded-lg pl-10 pr-4 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all"
            />
          </div>
          
          <div className="relative min-w-[150px]">
            <select
              value={filterModule}
              onChange={(e) => setFilterModule(e.target.value)}
              className="w-full bg-white dark:bg-background border border-border rounded-lg pl-3 pr-10 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
            >
              {modules.map(mod => (
                <option key={mod} value={mod}>{mod}</option>
              ))}
            </select>
            <Filter className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
        </div>

        <div className="flex-1 overflow-auto custom-scrollbar">
          {filteredLogs.length === 0 ? (
            <EmptyState 
              icon={History} 
              title="No Logs Found" 
              description="No audit logs match your current search and filter criteria." 
            />
          ) : (
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-background/80 sticky top-0 z-10 backdrop-blur-sm border-b border-border">
                <tr>
                  <th className="px-6 py-4 font-medium text-muted-foreground">Timestamp</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground">User</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground">Action</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground">Module</th>
                  <th className="px-6 py-4 font-medium text-muted-foreground">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-4 text-muted-foreground group-hover:text-foreground transition-colors">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-[10px] font-bold">
                          {(log.user_name || 'S').charAt(0).toUpperCase()}
                        </div>
                        <span className="text-foreground">{(log.user_name || '').split('@')[0]}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 rounded-md text-xs font-medium border ${
                        log.action === 'Created' || log.action === 'Logged In' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                        log.action === 'Deleted' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' :
                        log.action === 'Exported' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                        'bg-blue-500/10 text-blue-500 border-blue-500/20'
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-foreground">{log.module}</td>
                    <td className="px-6 py-4 text-muted-foreground truncate max-w-[300px]">
                      {log.details}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

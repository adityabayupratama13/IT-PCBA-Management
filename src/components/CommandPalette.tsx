'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Search, FolderKanban, Users, Monitor, Tickets, CalendarDays, Archive } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const router = useRouter();
  const { addAuditLog } = useAuth();

  // Handle Cmd+K / Ctrl+K
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Prevent scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => document.getElementById('cmd-input')?.focus(), 100);
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelect = (path: string, label: string) => {
    addAuditLog('Created', 'Search', `Searched and navigated to ${label}`);
    setIsOpen(false);
    setSearchQuery('');
    router.push(path);
  };

  const results = [
    { id: 'projects', label: 'Projects & Planning', icon: FolderKanban, path: '/projects' },
    { id: 'tasks', label: 'Tasks & Sprints', icon: Archive, path: '/tasks' },
    { id: 'assets', label: 'Hardware Inventory', icon: Monitor, path: '/assets' },
    { id: 'team', label: 'Team Members', icon: Users, path: '/team' },
    { id: 'tickets', label: 'Support Tickets', icon: Tickets, path: '/tickets' },
    { id: 'schedule', label: 'Weekly Schedule', icon: CalendarDays, path: '/schedule' },
    { id: 'daily', label: 'Daily Logs', icon: CalendarDays, path: '/daily' }
  ].filter(item => item.label.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]">
      <div 
        className="fixed inset-0 bg-black/60 dark:bg-background/80 backdrop-blur-sm transition-opacity" 
        onClick={() => setIsOpen(false)}
      />
      
      <div className="relative w-full max-w-lg bg-white dark:bg-surface border border-border rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center px-4 border-b border-border bg-gray-50 dark:bg-background">
          <Search className="w-5 h-5 text-muted-foreground mr-3" />
          <input
            id="cmd-input"
            className="flex h-14 w-full bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
            placeholder="Search team, tasks, assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button 
            onClick={() => setIsOpen(false)}
            className="p-1 rounded bg-gray-100 dark:bg-surface border border-border text-muted-foreground hover:bg-gray-200 dark:hover:bg-white/5 ml-2 text-xs font-mono"
          >
            ESC
          </button>
        </div>
        
        <div className="max-h-[300px] overflow-y-auto p-2 custom-scrollbar">
          {results.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">
              No results found.
            </div>
          ) : (
            <div className="space-y-1">
              <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">Modules</div>
              {results.map((result) => {
                const Icon = result.icon;
                return (
                  <button
                    key={result.id}
                    onClick={() => handleSelect(result.path, result.label)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg hover:bg-primary/10 hover:text-primary transition-colors text-foreground text-left group"
                  >
                    <div className="p-1.5 bg-background border border-border group-hover:border-primary/50 group-hover:bg-primary/20 rounded-md transition-colors text-muted-foreground group-hover:text-primary">
                      <Icon className="w-4 h-4" />
                    </div>
                    {result.label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

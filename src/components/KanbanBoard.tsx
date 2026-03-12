import { ReactNode } from 'react';

const COLUMN_STYLES: Record<string, { dot: string; badge: string }> = {
  'Backlog':     { dot: 'bg-muted-foreground', badge: 'bg-muted text-muted-foreground border-border' },
  'In Progress': { dot: 'bg-primary animate-pulse',  badge: 'bg-primary/10 text-primary border-primary/20' },
  'Review':      { dot: 'bg-warning',          badge: 'bg-warning/10 text-warning border-warning/20 dark:text-amber-400' },
  'Done':        { dot: 'bg-success',          badge: 'bg-success/10 text-success border-success/20' },
};

interface KanbanColumnProps {
  title: string;
  children: ReactNode;
  count: number;
}

export function KanbanColumn({ title, children, count }: KanbanColumnProps) {
  const styles = COLUMN_STYLES[title] || COLUMN_STYLES['Backlog'];
  return (
    <div className="flex flex-col rounded-2xl w-80 flex-shrink-0 overflow-hidden border"
      style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}
    >
      <div className="px-4 py-3.5 flex justify-between items-center border-b" style={{ borderColor: 'var(--border)', background: 'var(--surface)' }}>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${styles.dot}`} />
          <h3 className="font-semibold text-foreground text-sm">{title}</h3>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-bold border ${styles.badge}`}>
          {count}
        </span>
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 custom-scrollbar">
        {children}
      </div>
    </div>
  );
}

interface KanbanCardProps {
  children: ReactNode;
  onClick?: () => void;
}

export function KanbanCard({ children, onClick }: KanbanCardProps) {
  return (
    <div
      onClick={onClick}
      className={`rounded-xl p-4 border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-card-hover group ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 4px 20px var(--primary-glow)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = ''; }}
    >
      {children}
    </div>
  );
}

export interface GanttRowProps {
  name: string;
  pic: string;
  startDate: Date;
  endDate: Date;
  minDate: Date;
  maxDate: Date;
  progress: number;
  status: 'Planning' | 'Active' | 'On Hold' | 'Completed';
}

export function GanttRow({ name, pic, startDate, endDate, minDate, maxDate, progress, status }: GanttRowProps) {
  const totalDuration = maxDate.getTime() - minDate.getTime();
  const startOffset = Math.max(0, startDate.getTime() - minDate.getTime());
  const taskDuration = Math.min(endDate.getTime() - startDate.getTime(), totalDuration - startOffset);
  
  const leftPercent = (startOffset / totalDuration) * 100;
  const widthPercent = (taskDuration / totalDuration) * 100;
  
  const FILL_COLORS = {
    'Planning':  '#7C3AED',
    'Active':    '#2563EB',
    'On Hold':   '#EF4444',
    'Completed': '#10B981',
  };
  
  const TRACK_COLORS = {
    'Planning':  'rgba(124,58,237,0.15)',
    'Active':    'rgba(37,99,235,0.15)',
    'On Hold':   'rgba(239,68,68,0.15)',
    'Completed': 'rgba(16,185,129,0.15)',
  };

  const fill = FILL_COLORS[status] || '#2563EB';
  const track = TRACK_COLORS[status] || 'rgba(37,99,235,0.15)';

  return (
    <div className="flex items-center py-3.5 border-b border-border/40 last:border-0 transition-colors group px-2 rounded-lg"
      onMouseEnter={e => { e.currentTarget.style.background = 'var(--muted)'; }}
      onMouseLeave={e => { e.currentTarget.style.background = ''; }}
    >
      <div className="w-1/4 pr-4 flex flex-col pl-2">
        <span className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">{name}</span>
        <span className="text-xs text-muted-foreground truncate mt-0.5">PIC: {pic}</span>
      </div>
      <div className="w-3/4 flex items-center pr-4">
        <div className="relative h-5 w-full rounded-full overflow-hidden border border-border/50"
          style={{ background: 'var(--background)' }}
        >
          {/* Track background */}
          <div
            className="absolute top-0 bottom-0 rounded-full"
            style={{ left: `${leftPercent}%`, width: `${widthPercent}%`, background: track }}
          />
          {/* Progress fill */}
          <div
            className="absolute top-0 bottom-0 rounded-full transition-all"
            style={{ left: `${leftPercent}%`, width: `${widthPercent * progress / 100}%`, background: fill }}
          />
          {/* Completion marker */}
          {progress === 100 && (
            <div
              className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white shadow-md"
              style={{ left: `calc(${leftPercent + widthPercent}% - 8px)` }}
            />
          )}
        </div>
        <div className="w-10 ml-3 text-right flex-shrink-0">
          <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors">{progress}%</span>
        </div>
      </div>
    </div>
  );
}

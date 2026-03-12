export function Skeleton() {
  return (
    <div className="w-full h-full min-h-[1em] bg-border/50 animate-pulse rounded-md" />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-surface border border-border p-6 rounded-2xl flex items-center justify-between">
      <div className="space-y-3 w-1/2">
        <Skeleton />
        <div className="w-2/3 h-8">
          <Skeleton />
        </div>
      </div>
      <div className="w-12 h-12 rounded-xl bg-border/50 animate-pulse" />
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <div className="w-1/3 h-10"><Skeleton /></div>
        <div className="w-32 h-10"><Skeleton /></div>
      </div>
      <div className="rounded-xl border border-border bg-surface overflow-hidden">
        <div className="h-12 border-b border-border bg-background/50 flex items-center px-4 gap-4">
          <div className="w-1/4 h-4"><Skeleton /></div>
          <div className="w-1/4 h-4"><Skeleton /></div>
          <div className="w-1/4 h-4"><Skeleton /></div>
          <div className="w-1/4 h-4"><Skeleton /></div>
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 border-b border-border/50 flex items-center px-4 gap-4">
            <div className="w-1/4 h-5"><Skeleton /></div>
            <div className="w-1/4 h-5"><Skeleton /></div>
            <div className="w-1/4 h-5"><Skeleton /></div>
            <div className="w-1/4 h-5"><Skeleton /></div>
          </div>
        ))}
      </div>
    </div>
  );
}

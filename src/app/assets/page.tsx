'use client';
import { Monitor, ExternalLink, Server } from 'lucide-react';

export default function AssetsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="bg-primary/10 dark:bg-primary/20 p-6 rounded-full mb-6">
        <Monitor className="w-16 h-16 text-primary" />
      </div>
      
      <h1 className="text-3xl font-bold text-foreground mb-3">Asset Management</h1>
      <p className="text-muted-foreground text-lg mb-8 max-w-md">
        Asset management is handled by a dedicated application
      </p>
      
      <a 
        href="http://10.0.2.212:3001"
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-3 bg-primary hover:bg-primary/90 text-white px-8 py-4 rounded-xl font-semibold text-lg transition-all shadow-lg hover:shadow-primary/25 hover:scale-[1.02] active:scale-[0.98]"
      >
        Open Asset Management App
        <ExternalLink className="w-5 h-5" />
      </a>
      
      <div className="mt-6 flex items-center gap-2 text-sm text-muted-foreground bg-gray-100 dark:bg-surface border border-border px-4 py-2 rounded-lg">
        <Server className="w-4 h-4" />
        Running on internal server 10.0.2.212:3001
      </div>
    </div>
  );
}

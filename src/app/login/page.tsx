'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { ShieldAlert, User, Shield } from 'lucide-react';

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();

  const handleLogin = (email: string, role: 'Admin' | 'Member') => {
    login(email, role);
    router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-background p-4 relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[128px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-[128px] pointer-events-none" />
      
      <div className="w-full max-w-md bg-white dark:bg-surface border border-border rounded-2xl p-8 shadow-2xl relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4 border border-primary/20 shadow-[0_0_30px_rgba(59,130,246,0.2)]">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Welcome Back</h1>
          <p className="text-muted-foreground mt-2">Sign in to IT Management Dashboard</p>
        </div>

        <div className="space-y-4">
          <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2">Demo Accounts</div>
          
          <button 
            onClick={() => handleLogin('admin@giken.com', 'Admin')}
            className="w-full flex items-center justify-between p-4 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="p-2 bg-primary/20 rounded-lg text-primary">
                <Shield className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-foreground group-hover:text-primary transition-colors">Admin Access</div>
                <div className="text-xs text-muted-foreground">admin@giken.com</div>
              </div>
            </div>
            <div className="text-xs font-mono bg-gray-100 dark:bg-background border border-border px-2 py-1 rounded text-muted-foreground">admin123</div>
          </button>

          <button 
            onClick={() => handleLogin('member@giken.com', 'Member')}
            className="w-full flex items-center justify-between p-4 rounded-xl border border-border bg-gray-50 dark:bg-background hover:bg-gray-100 dark:hover:bg-white/5 transition-all group"
          >
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gray-100 dark:bg-surface border border-border text-muted-foreground rounded-lg group-hover:text-foreground transition-colors">
                <User className="w-5 h-5" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-foreground">Member Access</div>
                <div className="text-xs text-muted-foreground">member@giken.com</div>
              </div>
            </div>
            <div className="text-xs font-mono bg-gray-100 dark:bg-surface border border-border px-2 py-1 rounded text-muted-foreground">member123</div>
          </button>
        </div>
      </div>
    </div>
  );
}

'use client';
import { useState } from 'react';
import { Shield, Eye, EyeOff, AlertCircle, IdCard } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function LoginPage() {
  const [badge, setBadge]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    await new Promise(r => setTimeout(r, 600)); // slight delay for UX

    const ok = login(badge, password);
    if (ok) {
      toast.success('Welcome back!');
      router.push('/');
    } else {
      setError('Badge Number or Password is incorrect. Please try again.');
    }
    setLoading(false);
  };

  const inputClass = `w-full rounded-xl px-4 py-3 text-sm text-foreground border transition-all focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary`;

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--background)' }}>
      {/* Background glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full blur-[120px] opacity-20"
          style={{ background: 'radial-gradient(circle, var(--primary) 0%, transparent 70%)' }} />
      </div>

      <div className="w-full max-w-md relative">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4 shadow-glow-blue">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">IT PCBA Management</h1>
          <p className="text-muted-foreground mt-1 text-sm">Sign in with your IT credentials</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8 border shadow-card-hover"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Badge Number */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
                <IdCard className="w-3.5 h-3.5" />
                Badge Number
              </label>
              <input
                type="text"
                value={badge}
                onChange={e => setBadge(e.target.value)}
                placeholder="e.g. 36443"
                required
                autoFocus
                className={inputClass}
                style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-foreground mb-2">Password</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  required
                  className={`${inputClass} pr-11`}
                  style={{ background: 'var(--muted)', borderColor: 'var(--border)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl border text-sm"
                style={{ background: 'rgba(239,68,68,0.08)', borderColor: 'rgba(239,68,68,0.25)', color: 'var(--destructive)' }}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all disabled:opacity-60 disabled:cursor-not-allowed hover:opacity-90 active:scale-[0.98] shadow-glow-sm"
              style={{ background: 'linear-gradient(135deg, var(--primary), var(--secondary))' }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : 'Sign In'}
            </button>
          </form>
        </div>

        {/* Footer note */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Access restricted to registered IT Department members only.
          <br />Contact your IT Leader if you need an account.
        </p>
      </div>
    </div>
  );
}

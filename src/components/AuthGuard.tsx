'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { role } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !role && pathname !== '/login') {
      router.push('/login');
    }
  }, [isMounted, role, pathname, router]);

  // Don't render content until mounted to prevent hydration errors
  if (!isMounted) return null;

  // Render children normally, or null if on a protected page without a role
  return <>{children}</>;
}

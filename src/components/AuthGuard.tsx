'use client';
import { useAuth } from '@/context/AuthContext';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (isMounted && !currentUser && pathname !== '/login') {
      router.push('/login');
    }
  }, [isMounted, currentUser, pathname, router]);

  if (!isMounted) return null;
  return <>{children}</>;
}

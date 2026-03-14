'use client';

import { ThemeProvider } from 'next-themes';
import { AuthProvider } from './AuthContext';
import { Toaster } from 'sonner';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        {children}
        <Toaster position="top-right" richColors theme="system" />
      </ThemeProvider>
    </AuthProvider>
  );
}

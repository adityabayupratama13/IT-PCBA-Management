'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Role = 'Admin' | 'Member' | null;

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: 'Created' | 'Updated' | 'Deleted' | 'Exported' | 'Logged In';
  module: string;
  details: string;
}

interface AuthContextType {
  role: Role;
  userEmail: string | null;
  login: (email: string, role: Role) => void;
  logout: () => void;
  auditLogs: AuditLog[];
  addAuditLog: (action: AuditLog['action'], module: string, details: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Load auth state from localStorage
    const storedRole = localStorage.getItem('it-mgt-role') as Role;
    const storedEmail = localStorage.getItem('it-mgt-email');
    if (storedRole && storedEmail) {
      setRole(storedRole);
      setUserEmail(storedEmail);
    }

    // Load audit logs from localStorage (or initialize empty)
    const storedLogs = localStorage.getItem('it-mgt-audit');
    if (storedLogs) {
      try {
        setAuditLogs(JSON.parse(storedLogs));
      } catch {
        setAuditLogs([]);
      }
    }
  }, []);

  // Save audit logs to localStorage whenever they change
  useEffect(() => {
    if (isMounted) {
      localStorage.setItem('it-mgt-audit', JSON.stringify(auditLogs));
    }
  }, [auditLogs, isMounted]);

  const login = (email: string, newRole: Role) => {
    setRole(newRole);
    setUserEmail(email);
    localStorage.setItem('it-mgt-role', newRole || '');
    localStorage.setItem('it-mgt-email', email);
    
    // Log the login action
    const log: AuditLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      user: email,
      action: 'Logged In',
      module: 'Authentication',
      details: `User logged in as ${newRole}`
    };
    setAuditLogs(prev => [log, ...prev]);
  };

  const logout = () => {
    setRole(null);
    setUserEmail(null);
    localStorage.removeItem('it-mgt-role');
    localStorage.removeItem('it-mgt-email');
  };

  const addAuditLog = (action: AuditLog['action'], module: string, details: string) => {
    if (!userEmail) return;

    const log: AuditLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      user: userEmail,
      action,
      module,
      details
    };
    setAuditLogs(prev => [log, ...prev]);
  };

  return (
    <AuthContext.Provider value={{ role, userEmail, login, logout, auditLogs, addAuditLog }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

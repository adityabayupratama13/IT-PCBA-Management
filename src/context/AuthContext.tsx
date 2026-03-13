'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export interface Member {
  id: number;
  name: string;
  badge: string;
  password: string;
  role: string;
  division: string;
  email?: string;
  phone?: string;
  status: string;
  created_at?: string;
}

export interface AuditLog {
  id: number;
  action: string;
  module: string;
  details: string;
  user_name: string;
  timestamp: string;
}

// Master account — hardcoded fallback for initial access
export const MASTER_ACCOUNT: Member = {
  id: 0,
  name: 'Aditya Bayu Pratama',
  badge: '36443',
  password: 'Giken@212',
  role: 'IT Leader',
  division: 'Management',
  status: 'Active',
};

interface AuthContextType {
  currentUser: Member | null;
  isMaster: boolean;
  members: Member[];
  login: (badge: string, password: string) => Promise<boolean>;
  logout: () => void;
  addMember: (member: Omit<Member, 'id'>) => Promise<void>;
  updateMember: (member: Member) => Promise<void>;
  deleteMember: (id: number) => Promise<void>;
  refreshMembers: () => Promise<void>;
  auditLogs: AuditLog[];
  addAuditLog: (action: string, module: string, details: string) => void;
  // Legacy compat
  role: string | null;
  userEmail: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  useEffect(() => {
    // Restore session from localStorage
    const stored = localStorage.getItem('it-mgt-user');
    if (stored) {
      try { setCurrentUser(JSON.parse(stored)); } catch { /* ignore */ }
    }
    // Fetch members from API
    fetchMembers();
    // Fetch audit logs from API
    fetchAuditLogs();
  }, []);

  const fetchMembers = async () => {
    try {
      const res = await fetch('/api/members');
      if (res.ok) {
        const data = await res.json();
        setMembers(data);
      }
    } catch { /* silent — will use empty array */ }
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch('/api/audit');
      if (res.ok) {
        const data = await res.json();
        setAuditLogs(data);
      }
    } catch { /* silent */ }
  };

  const refreshMembers = useCallback(async () => {
    await fetchMembers();
  }, []);

  const login = async (badge: string, password: string): Promise<boolean> => {
    // Check master account first (hardcoded)
    if (badge.trim() === MASTER_ACCOUNT.badge && password === MASTER_ACCOUNT.password) {
      setCurrentUser(MASTER_ACCOUNT);
      localStorage.setItem('it-mgt-user', JSON.stringify(MASTER_ACCOUNT));
      // Log to DB
      try {
        await fetch('/api/members', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'login', badge: 'ABP001', password: 'Passw0rd!' }),
        });
      } catch { /* silent */ }
      return true;
    }

    // Try API login (checks DB members)
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'login', badge: badge.trim(), password }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.member) {
          const member: Member = data.member;
          setCurrentUser(member);
          localStorage.setItem('it-mgt-user', JSON.stringify(member));
          return true;
        }
      }
    } catch { /* fall through */ }

    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('it-mgt-user');
  };

  const addMember = async (member: Omit<Member, 'id'>) => {
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...member, userName: currentUser?.name }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to add member');
      }
      await fetchMembers();
      await fetchAuditLogs();
    } catch (err) {
      throw err;
    }
  };

  const updateMember = async (member: Member) => {
    try {
      await fetch('/api/members', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...member, userName: currentUser?.name }),
      });
      await fetchMembers();
      await fetchAuditLogs();
      // If currently logged-in user was updated, refresh session
      if (currentUser?.id === member.id) {
        setCurrentUser(member);
        localStorage.setItem('it-mgt-user', JSON.stringify(member));
      }
    } catch { /* silent */ }
  };

  const deleteMember = async (id: number) => {
    try {
      await fetch(`/api/members?id=${id}`, { method: 'DELETE' });
      await fetchMembers();
      await fetchAuditLogs();
    } catch { /* silent */ }
  };

  const addAuditLog = (action: string, module: string, details: string) => {
    // Fire and forget to API
    fetch('/api/audit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, module, details, userName: currentUser?.name || 'System' }),
    }).catch(() => {});
    // Optimistic local update
    const log: AuditLog = {
      id: Date.now(),
      action,
      module,
      details,
      user_name: currentUser?.name || 'System',
      timestamp: new Date().toISOString(),
    };
    setAuditLogs(prev => [log, ...prev]);
  };

  const isMaster = currentUser?.id === MASTER_ACCOUNT.id || currentUser?.badge === MASTER_ACCOUNT.badge;

  return (
    <AuthContext.Provider value={{
      currentUser,
      isMaster,
      members,
      login,
      logout,
      addMember,
      updateMember,
      deleteMember,
      refreshMembers,
      auditLogs,
      addAuditLog,
      role: currentUser ? (isMaster ? 'Master' : 'Member') : null,
      userEmail: currentUser?.name ?? null,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

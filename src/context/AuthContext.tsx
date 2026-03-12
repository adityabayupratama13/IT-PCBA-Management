'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface Member {
  id: number;
  name: string;
  badge: string;
  password: string;
  role: string;
  division: string;
  status: 'Active' | 'Inactive';
  joinDate: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: 'Created' | 'Updated' | 'Deleted' | 'Exported' | 'Logged In';
  module: string;
  details: string;
}

// Master account — can register/manage all members
export const MASTER_ACCOUNT: Member = {
  id: 0,
  name: 'Aditya Bayu Pratama',
  badge: '36443',
  password: 'Giken@212',
  role: 'IT Leader',
  division: 'Management',
  status: 'Active',
  joinDate: '2023-01-01',
};

const DEFAULT_MEMBERS: Member[] = [
  { id: 1, name: 'Budi',  badge: '36001', password: 'Budi@2024',  role: 'Software Engineer', division: 'Development',    status: 'Active',   joinDate: '2023-03-20' },
  { id: 2, name: 'Citra', badge: '36002', password: 'Citra@2024', role: 'Network Admin',      division: 'Infrastructure', status: 'Active',   joinDate: '2023-06-10' },
  { id: 3, name: 'Deni',  badge: '36003', password: 'Deni@2024',  role: 'IT Support',         division: 'Helpdesk',       status: 'Inactive', joinDate: '2024-01-05' },
  { id: 4, name: 'Eka',   badge: '36004', password: 'Eka@2024',   role: 'IT Support',         division: 'Helpdesk',       status: 'Active',   joinDate: '2024-02-12' },
];

interface AuthContextType {
  currentUser: Member | null;
  isMaster: boolean;
  members: Member[];
  login: (badge: string, password: string) => boolean;
  logout: () => void;
  addMember: (member: Omit<Member, 'id'>) => void;
  updateMember: (member: Member) => void;
  deleteMember: (id: number) => void;
  auditLogs: AuditLog[];
  addAuditLog: (action: AuditLog['action'], module: string, details: string) => void;
  // Legacy compat
  role: string | null;
  userEmail: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<Member | null>(null);
  const [members, setMembers] = useState<Member[]>(DEFAULT_MEMBERS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    // Load persisted auth
    const stored = localStorage.getItem('it-mgt-user');
    if (stored) {
      try { setCurrentUser(JSON.parse(stored)); } catch { /* ignore */ }
    }
    // Load members
    const storedMembers = localStorage.getItem('it-mgt-members');
    if (storedMembers) {
      try { setMembers(JSON.parse(storedMembers)); } catch { /* ignore */ }
    }
    // Load audit logs
    const storedLogs = localStorage.getItem('it-mgt-audit');
    if (storedLogs) {
      try { setAuditLogs(JSON.parse(storedLogs)); } catch { /* ignore */ }
    }
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem('it-mgt-audit', JSON.stringify(auditLogs));
  }, [auditLogs, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem('it-mgt-members', JSON.stringify(members));
  }, [members, isMounted]);

  const login = (badge: string, password: string): boolean => {
    // Check master account
    if (
      badge.trim() === MASTER_ACCOUNT.badge &&
      password === MASTER_ACCOUNT.password
    ) {
      setCurrentUser(MASTER_ACCOUNT);
      localStorage.setItem('it-mgt-user', JSON.stringify(MASTER_ACCOUNT));
      const log: AuditLog = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        user: MASTER_ACCOUNT.name,
        action: 'Logged In',
        module: 'Authentication',
        details: `Master login: ${MASTER_ACCOUNT.name} (Badge: ${MASTER_ACCOUNT.badge})`,
      };
      setAuditLogs(prev => [log, ...prev]);
      return true;
    }
    // Check registered members
    const found = members.find(
      m =>
        m.badge.trim() === badge.trim() &&
        m.password === password &&
        m.status === 'Active'
    );
    if (found) {
      setCurrentUser(found);
      localStorage.setItem('it-mgt-user', JSON.stringify(found));
      const log: AuditLog = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        user: found.name,
        action: 'Logged In',
        module: 'Authentication',
        details: `Login: ${found.name} (Badge: ${found.badge})`,
      };
      setAuditLogs(prev => [log, ...prev]);
      return true;
    }
    return false;
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('it-mgt-user');
  };

  const addMember = (member: Omit<Member, 'id'>) => {
    const newMember: Member = { ...member, id: Date.now() };
    setMembers(prev => [...prev, newMember]);
    addAuditLog('Created', 'Team', `Registered member: ${newMember.name} (Badge: ${newMember.badge})`);
  };

  const updateMember = (member: Member) => {
    setMembers(prev => prev.map(m => (m.id === member.id ? member : m)));
    // If currently logged-in user was updated, refresh session
    if (currentUser?.id === member.id) {
      setCurrentUser(member);
      localStorage.setItem('it-mgt-user', JSON.stringify(member));
    }
    addAuditLog('Updated', 'Team', `Updated member: ${member.name} (Badge: ${member.badge})`);
  };

  const deleteMember = (id: number) => {
    const m = members.find(m => m.id === id);
    setMembers(prev => prev.filter(m => m.id !== id));
    if (m) addAuditLog('Deleted', 'Team', `Deleted member: ${m.name} (Badge: ${m.badge})`);
  };

  const addAuditLog = (action: AuditLog['action'], module: string, details: string) => {
    if (!currentUser) return;
    const log: AuditLog = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      user: currentUser.name,
      action,
      module,
      details,
    };
    setAuditLogs(prev => [log, ...prev]);
  };

  const isMaster = currentUser?.id === MASTER_ACCOUNT.id;

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
      auditLogs,
      addAuditLog,
      // Legacy compat for other pages
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

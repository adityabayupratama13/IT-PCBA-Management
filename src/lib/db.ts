import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Database file location — use /data in production (Docker volume), fallback to project root
const DB_DIR = process.env.DB_PATH || path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'it-management.db');

// Ensure directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_FILE);
    // Performance optimizations
    _db.pragma('journal_mode = WAL');
    _db.pragma('synchronous = NORMAL');
    _db.pragma('cache_size = -64000'); // 64MB cache
    _db.pragma('foreign_keys = ON');
    _db.pragma('temp_store = MEMORY');
    initSchema(_db);
    seedIfEmpty(_db);
  }
  return _db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      badge TEXT UNIQUE NOT NULL,
      role TEXT NOT NULL DEFAULT 'IT Support',
      division TEXT NOT NULL DEFAULT 'IT Department',
      email TEXT DEFAULT '',
      phone TEXT DEFAULT '',
      password TEXT NOT NULL DEFAULT 'Password123',
      status TEXT NOT NULL DEFAULT 'Active',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      reporter TEXT NOT NULL,
      priority TEXT NOT NULL DEFAULT 'Medium',
      status TEXT NOT NULL DEFAULT 'Open',
      created_date TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Backlog',
      priority TEXT NOT NULL DEFAULT 'Medium',
      assignee TEXT NOT NULL,
      initials TEXT NOT NULL DEFAULT '',
      due_date TEXT DEFAULT ''
    );

    CREATE TABLE IF NOT EXISTS schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'Meeting',
      recurrence TEXT NOT NULL DEFAULT 'weekly',
      day INTEGER DEFAULT 0,
      date TEXT DEFAULT '',
      day_of_month INTEGER DEFAULT 0,
      month_of_year INTEGER DEFAULT 0,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      assignee TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS daily_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      member TEXT NOT NULL,
      activity TEXT NOT NULL,
      hours REAL DEFAULT 0,
      location TEXT DEFAULT 'Office',
      source TEXT DEFAULT 'manual',
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      pic TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      progress INTEGER DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Planning',
      linked_tasks TEXT DEFAULT '[]',
      linked_schedules TEXT DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      action TEXT NOT NULL,
      module TEXT NOT NULL,
      details TEXT DEFAULT '',
      user_name TEXT DEFAULT 'System',
      timestamp TEXT DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
    CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee);
    CREATE INDEX IF NOT EXISTS idx_daily_logs_date ON daily_logs(date);
    CREATE INDEX IF NOT EXISTS idx_daily_logs_source ON daily_logs(source);
    CREATE INDEX IF NOT EXISTS idx_schedules_recurrence ON schedules(recurrence);
    CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
    CREATE INDEX IF NOT EXISTS idx_members_badge ON members(badge);
  `);
}

function seedIfEmpty(db: Database.Database) {
  const count = db.prepare('SELECT COUNT(*) as c FROM members').get() as { c: number };
  if (count.c > 0) return; // Already seeded

  // Seed members
  const insertMember = db.prepare('INSERT INTO members (name, badge, role, division, password, status) VALUES (?, ?, ?, ?, ?, ?)');
  const seedMembers = db.transaction(() => {
    insertMember.run('Aditya Bayu Pratama', 'ABP001', 'IT Manager', 'IT Department', 'Passw0rd!', 'Active');
    insertMember.run('Adi Nugroho', 'IT001', 'IT Support', 'Helpdesk', 'Password123', 'Active');
    insertMember.run('Budi Santoso', 'IT002', 'Developer', 'Software Dev', 'Password123', 'Active');
    insertMember.run('Citra Dewi', 'IT003', 'Network Engineer', 'Infrastructure', 'Password123', 'Active');
    insertMember.run('Deni Pratama', 'IT004', 'Hardware Tech', 'Hardware', 'Password123', 'Active');
    insertMember.run('Eka Putri', 'IT005', 'IT Support', 'Helpdesk', 'Password123', 'Active');
  });
  seedMembers();

  // Seed tickets
  const insertTicket = db.prepare('INSERT INTO tickets (id, title, reporter, priority, status, created_date) VALUES (?, ?, ?, ?, ?, ?)');
  const seedTickets = db.transaction(() => {
    insertTicket.run('TKT-104', 'Network down in meeting room A', 'Sales Director', 'Critical', 'Open', '2026-03-11T14:30');
    insertTicket.run('TKT-103', 'Cannot access ERP system', 'Finance Manager', 'High', 'In Progress', '2026-03-11T10:15');
    insertTicket.run('TKT-102', 'Request new monitor setup', 'HR Team', 'Low', 'Resolved', '2026-03-10T16:45');
    insertTicket.run('TKT-101', 'Printer ink replacement on 2nd floor', 'Admin Office', 'Medium', 'Closed', '2026-03-09T09:20');
    insertTicket.run('TKT-100', 'Laptop blue screen issue', 'Marketing Staff', 'High', 'In Progress', '2026-03-08T11:00');
    insertTicket.run('TKT-099', 'Update software license', 'Engineering Dept', 'Low', 'Closed', '2026-03-05T14:10');
    insertTicket.run('TKT-098', 'Wi-Fi slow connection', 'Warehouse Team', 'Medium', 'Open', '2026-03-11T08:05');
    insertTicket.run('TKT-097', 'New onboarding account creation', 'HR Team', 'Medium', 'Open', '2026-03-11T15:22');
  });
  seedTickets();

  // Seed tasks
  const insertTask = db.prepare('INSERT INTO tasks (title, status, priority, assignee, initials, due_date) VALUES (?, ?, ?, ?, ?, ?)');
  const seedTasks = db.transaction(() => {
    insertTask.run('Update server infrastructure', 'Backlog', 'High', 'Citra', 'CI', '2026-03-15');
    insertTask.run('Design new employee onboarding flow', 'In Progress', 'Medium', 'Adi', 'AD', '2026-03-20');
    insertTask.run('Fix bug in ticketing system', 'In Progress', 'High', 'Budi', 'BU', '2026-03-12');
    insertTask.run('Audit software licenses', 'Review', 'Low', 'Eka', 'EK', '2026-03-25');
    insertTask.run('Deploy internal dashboard', 'Done', 'High', 'Budi', 'BU', '2026-03-10');
    insertTask.run('Order new laptops for sales team', 'Backlog', 'Medium', 'Deni', 'DE', '2026-03-30');
    insertTask.run('Setup network for branch office', 'In Progress', 'High', 'Citra', 'CI', '2026-04-05');
    insertTask.run('Update security policies', 'Review', 'Medium', 'Adi', 'AD', '2026-03-18');
    insertTask.run('Renew domain names', 'Done', 'High', 'Deni', 'DE', '2026-03-01');
    insertTask.run('Create documentation for API', 'Backlog', 'Low', 'Eka', 'EK', '2026-04-10');
  });
  seedTasks();

  // Seed schedules
  const insertSchedule = db.prepare('INSERT INTO schedules (title, type, recurrence, day, date, day_of_month, month_of_year, start_time, end_time, assignee) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
  const seedSchedules = db.transaction(() => {
    insertSchedule.run('Server Maintenance', 'Maintenance', 'weekly', 1, '', 0, 0, '22:00', '02:00', 'Citra');
    insertSchedule.run('Weekly IT Sync', 'Meeting', 'weekly', 1, '', 0, 0, '10:00', '11:00', 'All Team');
    insertSchedule.run('On-Call Support', 'On-Call', 'weekly', 2, '', 0, 0, '08:00', '17:00', 'Budi');
    insertSchedule.run('Network Upgrades', 'Maintenance', 'weekly', 4, '', 0, 0, '21:00', '23:00', 'Adi');
    insertSchedule.run('Security Review', 'Meeting', 'weekly', 3, '', 0, 0, '14:00', '15:30', 'Adi, Citra');
    insertSchedule.run('On-Call Support', 'On-Call', 'weekly', 5, '', 0, 0, '08:00', '17:00', 'Eka');
    insertSchedule.run('ERP Vendor Sync', 'Meeting', 'weekly', 4, '', 0, 0, '13:00', '14:00', 'Budi');
  });
  seedSchedules();

  // Seed daily logs
  const insertLog = db.prepare('INSERT INTO daily_logs (date, member, activity, hours, location, source) VALUES (?, ?, ?, ?, ?, ?)');
  const seedLogs = db.transaction(() => {
    insertLog.run('2026-03-11', 'Adi', 'Reviewed API documentation & team sync', 4, 'Office', 'manual');
    insertLog.run('2026-03-11', 'Budi', 'Fixed login bug on ERP staging', 6, 'WFH', 'manual');
    insertLog.run('2026-03-11', 'Citra', 'Reconfigured firewall rules for new VLAN', 5, 'Server Room', 'manual');
    insertLog.run('2026-03-10', 'Deni', 'Hardware maintenance on 3rd floor', 8, 'Office', 'manual');
    insertLog.run('2026-03-10', 'Eka', 'Resolved 5 helpdesk tickets', 7, 'Office', 'manual');
    insertLog.run('2026-03-09', 'Adi', 'Project planning for Q2 migration', 8, 'Office', 'manual');
  });
  seedLogs();

  // Seed projects
  const insertProject = db.prepare('INSERT INTO projects (name, pic, start_date, end_date, progress, status, linked_tasks, linked_schedules) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
  const seedProjects = db.transaction(() => {
    insertProject.run('ERP System Upgrade', 'Adi', '2026-02-01', '2026-05-30', 45, 'Active', '[]', '[]');
    insertProject.run('Q1 Hardware Refresh', 'Deni', '2026-01-15', '2026-03-31', 80, 'Active', '[]', '[]');
    insertProject.run('Cloud Migration Phase 2', 'Budi', '2026-04-01', '2026-08-15', 0, 'Planning', '[]', '[]');
    insertProject.run('New Branch Network Setup', 'Citra', '2026-02-15', '2026-04-10', 60, 'Active', '[]', '[]');
    insertProject.run('Legacy System Decommission', 'Adi', '2025-11-01', '2026-01-30', 100, 'Completed', '[]', '[]');
    insertProject.run('Security Audit Remediation', 'Citra', '2026-03-01', '2026-04-30', 15, 'On Hold', '[]', '[]');
  });
  seedProjects();

  // Seed audit log
  db.prepare('INSERT INTO audit_logs (action, module, details, user_name) VALUES (?, ?, ?, ?)').run('System', 'Startup', 'Database initialized with seed data', 'System');
}

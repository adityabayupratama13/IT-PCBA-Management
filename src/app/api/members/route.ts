import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET all members
export async function GET() {
  const db = getDb();
  const members = db.prepare('SELECT * FROM members ORDER BY id').all();
  return NextResponse.json(members);
}

// POST create or login
export async function POST(req: NextRequest) {
  const body = await req.json();
  const db = getDb();

  // Login action
  if (body.action === 'login') {
    const member = db.prepare('SELECT * FROM members WHERE badge = ? AND password = ?').get(body.badge, body.password) as Record<string, unknown> | undefined;
    if (member) {
      db.prepare('INSERT INTO audit_logs (action, module, details, user_name) VALUES (?, ?, ?, ?)').run('Login', 'Auth', `User logged in: ${member.name}`, member.name as string);
      return NextResponse.json({ success: true, member });
    }
    return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 });
  }

  // Create member
  try {
    const existing = db.prepare('SELECT id FROM members WHERE badge = ?').get(body.badge);
    if (existing) return NextResponse.json({ error: 'Badge already exists' }, { status: 400 });

    const result = db.prepare('INSERT INTO members (name, badge, role, division, email, phone, password, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
      body.name, body.badge, body.role || 'IT Support', body.division || 'IT Department',
      body.email || '', body.phone || '', body.password || 'Password123', body.status || 'Active'
    );
    db.prepare('INSERT INTO audit_logs (action, module, details, user_name) VALUES (?, ?, ?, ?)').run('Created', 'Team', `Added member: ${body.name}`, body.userName || 'System');
    return NextResponse.json({ id: result.lastInsertRowid });
  } catch {
    return NextResponse.json({ error: 'Failed to create member' }, { status: 500 });
  }
}

// PUT update member
export async function PUT(req: NextRequest) {
  const body = await req.json();
  const db = getDb();
  try {
    db.prepare('UPDATE members SET name=?, badge=?, role=?, division=?, email=?, phone=?, password=?, status=? WHERE id=?').run(
      body.name, body.badge, body.role, body.division, body.email || '', body.phone || '', body.password || 'Password123', body.status || 'Active', body.id
    );
    db.prepare('INSERT INTO audit_logs (action, module, details, user_name) VALUES (?, ?, ?, ?)').run('Updated', 'Team', `Updated member: ${body.name}`, body.userName || 'System');
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
  }
}

// DELETE member
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const db = getDb();
  const member = db.prepare('SELECT name FROM members WHERE id=?').get(Number(id)) as { name: string } | undefined;
  db.prepare('DELETE FROM members WHERE id=?').run(Number(id));
  db.prepare('INSERT INTO audit_logs (action, module, details, user_name) VALUES (?, ?, ?, ?)').run('Deleted', 'Team', `Deleted member: ${member?.name || id}`, 'System');
  return NextResponse.json({ success: true });
}

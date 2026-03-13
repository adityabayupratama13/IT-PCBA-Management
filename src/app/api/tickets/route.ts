import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const tickets = db.prepare('SELECT * FROM tickets ORDER BY created_date DESC').all();
  return NextResponse.json(tickets);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const db = getDb();
  try {
    const count = db.prepare('SELECT COUNT(*) as c FROM tickets').get() as { c: number };
    const id = body.id || `TKT-${String(count.c + 100).padStart(3, '0')}`;
    db.prepare('INSERT INTO tickets (id, title, reporter, priority, status, created_date) VALUES (?, ?, ?, ?, ?, ?)').run(
      id, body.title, body.reporter, body.priority || 'Medium', body.status || 'Open', body.createdDate || new Date().toISOString()
    );
    // Auto-create daily log entry linked to this ticket
    db.prepare('INSERT INTO daily_logs (date, member, activity, hours, location, source) VALUES (?, ?, ?, ?, ?, ?)').run(
      new Date().toISOString().split('T')[0], body.userName || 'System',
      `[Ticket ${id}] Created — ${body.title}`, 0, 'System', `ticket:${id}`
    );
    db.prepare('INSERT INTO audit_logs (action, module, details, user_name) VALUES (?, ?, ?, ?)')
      .run('Created', 'Tickets', `Created ticket: ${id} — ${body.title}`, body.userName || 'System');
    return NextResponse.json({ id });
  } catch {
    return NextResponse.json({ error: 'Failed to create ticket' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const db = getDb();
  db.prepare('UPDATE tickets SET title=?, reporter=?, priority=?, status=? WHERE id=?')
    .run(body.title, body.reporter, body.priority, body.status, body.id);
  // Update related daily log entries for this ticket
  db.prepare("UPDATE daily_logs SET activity = ? WHERE source = ?")
    .run(`[Ticket ${body.id}] ${body.status} — ${body.title}`, `ticket:${body.id}`);
  db.prepare('INSERT INTO audit_logs (action, module, details, user_name) VALUES (?, ?, ?, ?)')
    .run('Updated', 'Tickets', `Updated ticket: ${body.id} — ${body.title} (${body.status})`, body.userName || 'System');
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const db = getDb();
  const ticket = db.prepare('SELECT title FROM tickets WHERE id=?').get(id) as { title: string } | undefined;
  // Delete the ticket
  db.prepare('DELETE FROM tickets WHERE id=?').run(id);
  // Delete ALL related daily log entries for this ticket
  db.prepare("DELETE FROM daily_logs WHERE source = ?").run(`ticket:${id}`);
  db.prepare('INSERT INTO audit_logs (action, module, details, user_name) VALUES (?, ?, ?, ?)')
    .run('Deleted', 'Tickets', `Deleted ticket: ${id} — ${ticket?.title || ''}`, 'System');
  return NextResponse.json({ success: true });
}

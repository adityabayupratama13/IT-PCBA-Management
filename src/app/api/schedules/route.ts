export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const schedules = db.prepare('SELECT * FROM schedules ORDER BY id').all();
  return NextResponse.json(schedules);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const db = getDb();
  const result = db.prepare('INSERT INTO schedules (title, type, recurrence, day, date, end_date, day_of_month, month_of_year, start_time, end_time, assignee) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
    body.title, body.type || 'Meeting', body.recurrence || 'weekly', body.day || 0, body.date || '', body.endDate || '', body.dayOfMonth || 0, body.monthOfYear || 0, body.startTime, body.endTime, body.assignee
  );
  db.prepare('INSERT INTO audit_logs (action, module, details, user_name) VALUES (?, ?, ?, ?)').run('Created', 'Schedule', `Created schedule: ${body.title}`, body.userName || 'System');
  return NextResponse.json({ id: result.lastInsertRowid });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const db = getDb();
  db.prepare('UPDATE schedules SET title=?, type=?, recurrence=?, day=?, date=?, end_date=?, day_of_month=?, month_of_year=?, start_time=?, end_time=?, assignee=? WHERE id=?').run(
    body.title, body.type, body.recurrence, body.day || 0, body.date || '', body.endDate || '', body.dayOfMonth || 0, body.monthOfYear || 0, body.startTime, body.endTime, body.assignee, body.id
  );
  db.prepare('INSERT INTO audit_logs (action, module, details, user_name) VALUES (?, ?, ?, ?)').run('Updated', 'Schedule', `Updated schedule: ${body.title}`, body.userName || 'System');
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const db = getDb();
  const sch = db.prepare('SELECT title FROM schedules WHERE id=?').get(Number(id)) as { title: string } | undefined;
  db.prepare('DELETE FROM schedules WHERE id=?').run(Number(id));
  db.prepare('INSERT INTO audit_logs (action, module, details, user_name) VALUES (?, ?, ?, ?)').run('Deleted', 'Schedule', `Deleted schedule: ${sch?.title || id}`, 'System');
  return NextResponse.json({ success: true });
}

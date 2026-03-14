export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const projects = db.prepare('SELECT * FROM projects ORDER BY id').all();
  return NextResponse.json(projects);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const db = getDb();
  const result = db.prepare('INSERT INTO projects (name, pic, start_date, end_date, progress, status, linked_tasks, linked_schedules) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
    body.name, body.pic, body.startDate, body.endDate, body.progress || 0, body.status || 'Planning',
    JSON.stringify(body.linkedTasks || []), JSON.stringify(body.linkedSchedules || [])
  );
  db.prepare('INSERT INTO audit_logs (action, module, details, user_name) VALUES (?, ?, ?, ?)').run('Created', 'Projects', `Created project: ${body.name}`, body.userName || 'System');
  return NextResponse.json({ id: result.lastInsertRowid });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const db = getDb();
  db.prepare('UPDATE projects SET name=?, pic=?, start_date=?, end_date=?, progress=?, status=?, linked_tasks=?, linked_schedules=? WHERE id=?').run(
    body.name, body.pic, body.startDate, body.endDate, body.progress, body.status,
    JSON.stringify(body.linkedTasks || []), JSON.stringify(body.linkedSchedules || []), body.id
  );
  db.prepare('INSERT INTO audit_logs (action, module, details, user_name) VALUES (?, ?, ?, ?)').run('Updated', 'Projects', `Updated project: ${body.name}`, body.userName || 'System');
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const db = getDb();
  const proj = db.prepare('SELECT name FROM projects WHERE id=?').get(Number(id)) as { name: string } | undefined;
  db.prepare('DELETE FROM projects WHERE id=?').run(Number(id));
  db.prepare('INSERT INTO audit_logs (action, module, details, user_name) VALUES (?, ?, ?, ?)').run('Deleted', 'Projects', `Deleted project: ${proj?.name || id}`, 'System');
  return NextResponse.json({ success: true });
}

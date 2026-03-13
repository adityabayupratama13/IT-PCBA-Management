import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  const tasks = db.prepare('SELECT * FROM tasks ORDER BY id').all();
  return NextResponse.json(tasks);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const db = getDb();
  const result = db.prepare('INSERT INTO tasks (title, status, priority, assignee, initials, due_date) VALUES (?, ?, ?, ?, ?, ?)').run(
    body.title, body.status || 'Backlog', body.priority || 'Medium', body.assignee, body.initials || '', body.dueDate || ''
  );
  db.prepare('INSERT INTO audit_logs (action, module, details, user_name) VALUES (?, ?, ?, ?)').run('Created', 'Tasks', `Created task: ${body.title}`, body.userName || 'System');
  return NextResponse.json({ id: result.lastInsertRowid });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const db = getDb();
  db.prepare('UPDATE tasks SET title=?, status=?, priority=?, assignee=?, initials=?, due_date=? WHERE id=?').run(
    body.title, body.status, body.priority, body.assignee, body.initials || '', body.dueDate || '', body.id
  );
  db.prepare('INSERT INTO audit_logs (action, module, details, user_name) VALUES (?, ?, ?, ?)').run('Updated', 'Tasks', `Updated task: ${body.title}`, body.userName || 'System');
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const db = getDb();
  const task = db.prepare('SELECT title FROM tasks WHERE id=?').get(Number(id)) as { title: string } | undefined;
  db.prepare('DELETE FROM tasks WHERE id=?').run(Number(id));
  db.prepare('INSERT INTO audit_logs (action, module, details, user_name) VALUES (?, ?, ?, ?)').run('Deleted', 'Tasks', `Deleted task: ${task?.title || id}`, 'System');
  return NextResponse.json({ success: true });
}

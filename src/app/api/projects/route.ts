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
  
  // Create schedule link automatically
  const schRes = db.prepare('INSERT INTO schedules (title, type, recurrence, day, date, end_date, day_of_month, month_of_year, start_time, end_time, assignee) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
    body.name, 'Project', 'one-time', 0, body.startDate, body.endDate, 0, 0, '08:00', '17:00', body.pic || 'Unassigned'
  );
  const newScheduleId = schRes.lastInsertRowid;
  const schedulesArr = body.linkedSchedules || [];
  if (!schedulesArr.includes(newScheduleId)) schedulesArr.push(newScheduleId);

  const result = db.prepare('INSERT INTO projects (name, pic, start_date, end_date, progress, status, linked_tasks, linked_schedules) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
    body.name, body.pic, body.startDate, body.endDate, body.progress || 0, body.status || 'Planning',
    JSON.stringify(body.linkedTasks || []), JSON.stringify(schedulesArr)
  );
  db.prepare('INSERT INTO audit_logs (action, module, details, user_name) VALUES (?, ?, ?, ?)').run('Created', 'Projects', `Created project: ${body.name}`, body.userName || 'System');
  return NextResponse.json({ id: result.lastInsertRowid });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const db = getDb();

  // Retrieve current project to manage existing auto-created schedule
  const currentProj = db.prepare('SELECT linked_schedules FROM projects WHERE id=?').get(body.id) as { linked_schedules: string } | undefined;
  const currentSchedules: number[] = JSON.parse(currentProj?.linked_schedules || '[]');
  
  // Attempt to find a schedule with type 'Project' and title matching
  const matchingSch = db.prepare("SELECT id FROM schedules WHERE type='Project' AND title=? AND id IN (" + (currentSchedules.length ? currentSchedules.join(',') : '0') + ") LIMIT 1").get(body.name) as { id: number } | undefined;
  
  const schedulesArr = body.linkedSchedules || [];
  
  if (matchingSch) {
    // Update existing schedule
    db.prepare('UPDATE schedules SET date=?, end_date=?, assignee=? WHERE id=?').run(body.startDate, body.endDate, body.pic || 'Unassigned', matchingSch.id);
  } else {
    // Create new schedule if none exists
    const schRes = db.prepare('INSERT INTO schedules (title, type, recurrence, day, date, end_date, day_of_month, month_of_year, start_time, end_time, assignee) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
      body.name, 'Project', 'one-time', 0, body.startDate, body.endDate, 0, 0, '08:00', '17:00', body.pic || 'Unassigned'
    );
    const newScheduleId = schRes.lastInsertRowid;
    if (!schedulesArr.includes(newScheduleId)) schedulesArr.push(newScheduleId);
  }

  db.prepare('UPDATE projects SET name=?, pic=?, start_date=?, end_date=?, progress=?, status=?, linked_tasks=?, linked_schedules=? WHERE id=?').run(
    body.name, body.pic, body.startDate, body.endDate, body.progress, body.status,
    JSON.stringify(body.linkedTasks || []), JSON.stringify(schedulesArr), body.id
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

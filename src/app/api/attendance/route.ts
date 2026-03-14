import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET all attendance logs (we will filter by dates on the frontend)
export async function GET(req: NextRequest) {
  const db = getDb();
  const { searchParams } = new URL(req.url);
  const employee = searchParams.get('member_name');
  
  let q = 'SELECT * FROM attendance_logs ORDER BY date DESC, id DESC';
  const params: string[] = [];
  if (employee) {
    q = 'SELECT * FROM attendance_logs WHERE member_name = ? ORDER BY date DESC, id DESC';
    params.push(employee);
  }
  
  const logs = db.prepare(q).all(...params);
  return NextResponse.json(logs);
}

// POST or PUT to create/update an attendance log
export async function POST(req: NextRequest) {
  const body = await req.json();
  const db = getDb();
  
  // Upsert logic: if there is already an entry for this member and date, update it.
  const existing = db.prepare('SELECT id FROM attendance_logs WHERE member_name = ? AND date = ?').get(body.member_name, body.date) as { id: number } | undefined;
  
  if (existing) {
    db.prepare('UPDATE attendance_logs SET shift = ?, overtime_hours = ?, overtime_desc = ? WHERE id = ?').run(
      body.shift, body.overtime_hours || 0, body.overtime_desc || '', existing.id
    );
    db.prepare('INSERT INTO audit_logs (action, module, details, user_name) VALUES (?, ?, ?, ?)').run(
      'Updated', 'Attendance', `Updated attendance for ${body.member_name} on ${body.date}`, body.userName || 'System'
    );
    return NextResponse.json({ id: existing.id, updated: true });
  } else {
    const result = db.prepare('INSERT INTO attendance_logs (member_name, date, shift, overtime_hours, overtime_desc) VALUES (?, ?, ?, ?, ?)').run(
      body.member_name, body.date, body.shift || 'Off', body.overtime_hours || 0, body.overtime_desc || ''
    );
    db.prepare('INSERT INTO audit_logs (action, module, details, user_name) VALUES (?, ?, ?, ?)').run(
      'Created', 'Attendance', `Logged attendance for ${body.member_name} on ${body.date}`, body.userName || 'System'
    );
    return NextResponse.json({ id: result.lastInsertRowid, created: true });
  }
}

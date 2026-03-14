import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  const db = getDb();
  const logs = db.prepare('SELECT * FROM daily_logs ORDER BY date DESC, created_at DESC').all();
  return NextResponse.json(logs);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const db = getDb();
  const result = db.prepare('INSERT INTO daily_logs (date, member, activity, hours, location, source) VALUES (?, ?, ?, ?, ?, ?)').run(
    body.date, body.member, body.activity, body.hours || 0, body.location || 'Office', body.source || 'manual'
  );
  db.prepare('INSERT INTO audit_logs (action, module, details, user_name) VALUES (?, ?, ?, ?)').run('Created', 'Daily Log', `Added log by ${body.member}`, body.userName || 'System');
  return NextResponse.json({ id: result.lastInsertRowid });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const db = getDb();
  db.prepare('UPDATE daily_logs SET date=?, member=?, activity=?, hours=?, location=? WHERE id=?').run(
    body.date, body.member, body.activity, body.hours, body.location, body.id
  );
  db.prepare('INSERT INTO audit_logs (action, module, details, user_name) VALUES (?, ?, ?, ?)').run('Updated', 'Daily Log', `Updated log by ${body.member}`, body.userName || 'System');
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const db = getDb();
  db.prepare('DELETE FROM daily_logs WHERE id=?').run(Number(id));
  db.prepare('INSERT INTO audit_logs (action, module, details, user_name) VALUES (?, ?, ?, ?)').run('Deleted', 'Daily Log', `Deleted daily log #${id}`, 'System');
  return NextResponse.json({ success: true });
}

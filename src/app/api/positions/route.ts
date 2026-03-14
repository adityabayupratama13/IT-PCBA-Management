export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  try {
    const db = getDb();
    const positions = db.prepare(
      `SELECT * FROM positions ORDER BY
        CASE level
          WHEN 'Manager' THEN 1
          WHEN 'Supervisor' THEN 2
          WHEN 'Senior' THEN 3
          ELSE 4
        END, name ASC`
    ).all();
    return NextResponse.json(positions);
  } catch (err) {
    console.error('Positions GET error:', err);
    return NextResponse.json([], { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const db = getDb();

  const existing = db.prepare('SELECT id FROM positions WHERE LOWER(name) = LOWER(?)').get(body.name);
  if (existing) return NextResponse.json({ error: 'Position name already exists' }, { status: 409 });

  const result = db.prepare(
    'INSERT INTO positions (name, division, level, description) VALUES (?, ?, ?, ?)'
  ).run(body.name, body.division || 'IT Department', body.level || 'Staff', body.description || '');

  db.prepare('INSERT INTO audit_logs (action, module, details, user_name) VALUES (?, ?, ?, ?)')
    .run('Created', 'Positions', `Created position: ${body.name}`, body.userName || 'System');

  return NextResponse.json({ id: result.lastInsertRowid, name: body.name, division: body.division, level: body.level, description: body.description }, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const db = getDb();

  // Check duplicate name (excluding self)
  const existing = db.prepare('SELECT id FROM positions WHERE LOWER(name) = LOWER(?) AND id != ?').get(body.name, body.id);
  if (existing) return NextResponse.json({ error: 'Position name already exists' }, { status: 409 });

  db.prepare(
    'UPDATE positions SET name = ?, division = ?, level = ?, description = ? WHERE id = ?'
  ).run(body.name, body.division, body.level, body.description || '', body.id);

  db.prepare('INSERT INTO audit_logs (action, module, details, user_name) VALUES (?, ?, ?, ?)')
    .run('Updated', 'Positions', `Updated position: ${body.name}`, body.userName || 'System');

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  const db = getDb();
  const pos = db.prepare('SELECT name FROM positions WHERE id = ?').get(id) as { name: string } | undefined;
  if (!pos) return NextResponse.json({ error: 'Position not found' }, { status: 404 });

  db.prepare('DELETE FROM positions WHERE id = ?').run(id);
  db.prepare('INSERT INTO audit_logs (action, module, details, user_name) VALUES (?, ?, ?, ?)')
    .run('Deleted', 'Positions', `Deleted position: ${pos.name}`, 'System');

  return NextResponse.json({ success: true });
}

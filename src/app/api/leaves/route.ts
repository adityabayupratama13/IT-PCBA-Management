export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  // We left join with leave_balances to output leave tracking metrics natively
  const requests = db.prepare('SELECT * FROM leave_requests ORDER BY application_date DESC, id DESC').all();
  return NextResponse.json(requests);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const db = getDb();
  
  const result = db.prepare(
    'INSERT INTO leave_requests (member_name, leave_type, application_date, start_date, end_date, days_count, reason, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
  ).run(
    body.member_name, body.leave_type, body.application_date, body.start_date, body.end_date, body.days_count, body.reason || '', 'Pending'
  );
  
  db.prepare('INSERT INTO audit_logs (action, module, details, user_name) VALUES (?, ?, ?, ?)').run(
    'Created', 'Leave Request', `${body.member_name} requested ${body.leave_type} for ${body.days_count} days`, body.userName || body.member_name
  );
  
  return NextResponse.json({ id: result.lastInsertRowid });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const db = getDb();
  
  const existing = db.prepare('SELECT * FROM leave_requests WHERE id = ?').get(body.id) as { id: number, member_name: string, start_date: string, end_date: string, status: string, leave_type: string, days_count: number } | undefined;
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Handle Action: FULL EDIT (meaning user updated the form properties themselves)
  if (body.start_date || body.end_date || body.leave_type || body.reason) {
    const isEditingApproved = existing.status === 'Approved';
    
    db.prepare('UPDATE leave_requests SET leave_type = ?, start_date = ?, end_date = ?, days_count = ?, reason = ?, status = ?, approved_by = ? WHERE id = ?').run(
      body.leave_type || existing.leave_type, body.start_date || existing.start_date, body.end_date || existing.end_date, 
      body.days_count || existing.days_count, body.reason || '', 'Pending', '', body.id
    );

    // If it WAS Approved, we must REVERT the balances and the roster shifts back to NORMAL/OFF.
    if (isEditingApproved) {
      if (existing.leave_type === 'Annual Leave') {
        const balanceRecord = db.prepare('SELECT balance FROM user_leave_balances WHERE member_name = ?').get(existing.member_name) as { balance: number } | undefined;
        if (balanceRecord) db.prepare('UPDATE user_leave_balances SET balance = balance + ? WHERE member_name = ?').run(existing.days_count, existing.member_name);
      }
      
      const currTarget = new Date(existing.start_date);
      const endDateObj = new Date(existing.end_date);
      while (currTarget <= endDateObj) {
        const yyyy = currTarget.getFullYear();
        const mm = String(currTarget.getMonth() + 1).padStart(2, '0');
        const dd = String(currTarget.getDate()).padStart(2, '0');
        const dStr = `${yyyy}-${mm}-${dd}`;
        db.prepare("UPDATE attendance_logs SET shift = 'Off' WHERE member_name = ? AND date = ? AND shift = 'Leave'").run(existing.member_name, dStr);
        currTarget.setDate(currTarget.getDate() + 1);
      }
    }

    db.prepare('INSERT INTO audit_logs (action, module, details, user_name) VALUES (?, ?, ?, ?)').run(
      'Updated', 'Leave Request', `${body.userName || existing.member_name} edited leave ${body.id} and it is now Pending`, body.userName || 'System'
    );
    return NextResponse.json({ success: true, status: 'Pending' });
  }

  // Handle Action: STATUS APPROVAL/REJECTION ONLY
  db.prepare('UPDATE leave_requests SET status = ?, approved_by = ? WHERE id = ?').run(body.status, body.approved_by || '', body.id);
  
  if (body.status === 'Approved' && existing.status !== 'Approved') {
    const currTarget = new Date(existing.start_date);
    const endDateObj = new Date(existing.end_date);
    while (currTarget <= endDateObj) {
      const yyyy = currTarget.getFullYear();
      const mm = String(currTarget.getMonth() + 1).padStart(2, '0');
      const dd = String(currTarget.getDate()).padStart(2, '0');
      const dStr = `${yyyy}-${mm}-${dd}`;
      const attns = db.prepare('SELECT id FROM attendance_logs WHERE member_name = ? AND date = ?').get(existing.member_name, dStr) as { id: number } | undefined;
      if (attns) db.prepare("UPDATE attendance_logs SET shift = 'Leave' WHERE id = ?").run(attns.id);
      else db.prepare("INSERT INTO attendance_logs (member_name, date, shift) VALUES (?, ?, 'Leave')").run(existing.member_name, dStr);
      currTarget.setDate(currTarget.getDate() + 1);
    }
    if (existing.leave_type === 'Annual Leave') {
      const balanceRecord = db.prepare('SELECT balance FROM user_leave_balances WHERE member_name = ?').get(existing.member_name) as { balance: number } | undefined;
      if (balanceRecord) db.prepare('UPDATE user_leave_balances SET balance = balance - ? WHERE member_name = ?').run(existing.days_count, existing.member_name);
    }
  }
  
  db.prepare('INSERT INTO audit_logs (action, module, details, user_name) VALUES (?, ?, ?, ?)').run(
    'Updated', 'Leave Request', `${body.approved_by} marked leave ${body.id} as ${body.status}`, body.userName || 'System'
  );
  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  const userName = searchParams.get('userName') || 'System';
  const db = getDb();

  const existing = db.prepare('SELECT * FROM leave_requests WHERE id = ?').get(Number(id)) as { id: number, member_name: string, start_date: string, end_date: string, status: string, leave_type: string, days_count: number } | undefined;
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Revert consequences if it was approved
  if (existing.status === 'Approved') {
    if (existing.leave_type === 'Annual Leave') {
      const balanceRecord = db.prepare('SELECT balance FROM user_leave_balances WHERE member_name = ?').get(existing.member_name) as { balance: number } | undefined;
      if (balanceRecord) db.prepare('UPDATE user_leave_balances SET balance = balance + ? WHERE member_name = ?').run(existing.days_count, existing.member_name);
    }
    const currTarget = new Date(existing.start_date);
    const endDateObj = new Date(existing.end_date);
    while (currTarget <= endDateObj) {
      const yyyy = currTarget.getFullYear();
      const mm = String(currTarget.getMonth() + 1).padStart(2, '0');
      const dd = String(currTarget.getDate()).padStart(2, '0');
      const dStr = `${yyyy}-${mm}-${dd}`;
      db.prepare("UPDATE attendance_logs SET shift = 'Off' WHERE member_name = ? AND date = ? AND shift = 'Leave'").run(existing.member_name, dStr);
      currTarget.setDate(currTarget.getDate() + 1);
    }
  }

  db.prepare('DELETE FROM leave_requests WHERE id = ?').run(Number(id));
  db.prepare('INSERT INTO audit_logs (action, module, details, user_name) VALUES (?, ?, ?, ?)').run('Deleted', 'Leave Request', `${userName} deleted leave ${id} for ${existing.member_name}`, userName);
  return NextResponse.json({ success: true });
}

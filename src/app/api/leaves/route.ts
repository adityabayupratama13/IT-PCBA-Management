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
  
  db.prepare('UPDATE leave_requests SET status = ?, approved_by = ? WHERE id = ?').run(
    body.status, body.approved_by || '', body.id
  );
  
  // If approved, system automatically creates attendance_log entries for those dates pointing to "Leave"
  if (body.status === 'Approved' && existing.status !== 'Approved') {
    // Basic date loop from start_date to end_date
    const currTarget = new Date(existing.start_date);
    const endDateObj = new Date(existing.end_date);
    while (currTarget <= endDateObj) {
      const dStr = currTarget.toISOString().split('T')[0];
      // Skip weekends for shift replacements if you prefer, but standard is insert over all days
      
      const attns = db.prepare('SELECT id FROM attendance_logs WHERE member_name = ? AND date = ?').get(existing.member_name, dStr) as { id: number } | undefined;
      if (attns) {
        db.prepare("UPDATE attendance_logs SET shift = 'Leave' WHERE id = ?").run(attns.id);
      } else {
        db.prepare("INSERT INTO attendance_logs (member_name, date, shift) VALUES (?, ?, 'Leave')").run(existing.member_name, dStr);
      }
      
      currTarget.setDate(currTarget.getDate() + 1);
    }
    
    // Deduct from manual Leave Balance if it's Annual Leave
    if (existing.leave_type === 'Annual Leave') {
      const balanceRecord = db.prepare('SELECT balance FROM user_leave_balances WHERE member_name = ?').get(existing.member_name) as { balance: number } | undefined;
      if (balanceRecord) {
        db.prepare('UPDATE user_leave_balances SET balance = balance - ? WHERE member_name = ?').run(existing.days_count, existing.member_name);
      }
    }
  }
  
  db.prepare('INSERT INTO audit_logs (action, module, details, user_name) VALUES (?, ?, ?, ?)').run(
    'Updated', 'Leave Request', `${body.approved_by} marked leave ${body.id} as ${body.status}`, body.userName || 'System'
  );
  
  return NextResponse.json({ success: true });
}

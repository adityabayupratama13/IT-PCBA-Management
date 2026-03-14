import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET() {
  const db = getDb();
  
  // 1. Get all active members
  const members = db.prepare("SELECT name FROM members WHERE status = 'Active'").all() as { name: string }[];
  
  // Current month string "YYYY-MM"
  const currentMonth = new Date().toISOString().substring(0, 7);
  
  // 2. Fetch or initialize balances
  for (const m of members) {
    const record = db.prepare('SELECT * FROM user_leave_balances WHERE member_name = ?').get(m.name) as { member_name: string, balance: number, last_accrual_month: string } | undefined;
    if (!record) {
      // Default: Initial 0 balance, and set accrual month to current so they only accrue next month
      db.prepare('INSERT INTO user_leave_balances (member_name, balance, last_accrual_month) VALUES (?, ?, ?)')
        .run(m.name, 0, currentMonth);
    } else {
      // Auto-Accrual logic
      // If last_accrual_month is behind, add 1 for every month behind
      if (record.last_accrual_month && record.last_accrual_month < currentMonth) {
        const [lastY, lastM] = record.last_accrual_month.split('-').map(Number);
        const [currY, currM] = currentMonth.split('-').map(Number);
        const monthsDiff = (currY - lastY) * 12 + (currM - lastM);
        
        if (monthsDiff > 0) {
          const newBalance = record.balance + monthsDiff;
          db.prepare('UPDATE user_leave_balances SET balance = ?, last_accrual_month = ? WHERE member_name = ?')
            .run(newBalance, currentMonth, m.name);
          
          db.prepare('INSERT INTO audit_logs (action, module, details, user_name) VALUES (?, ?, ?, ?)')
            .run('Auto-Accrual', 'Leave Balance', `Auto added ${monthsDiff} days to ${m.name}. New Bal: ${newBalance}`, 'System');
        }
      } else if (!record.last_accrual_month) {
         // Fix legacy records without accrual month
         db.prepare('UPDATE user_leave_balances SET last_accrual_month = ? WHERE member_name = ?')
           .run(currentMonth, m.name);
      }
    }
  }
  
  // Return updated balances
  const updatedBalances = db.prepare('SELECT * FROM user_leave_balances').all();
  return NextResponse.json(updatedBalances);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const db = getDb();
  
  // Manual Update
  db.prepare('INSERT INTO user_leave_balances (member_name, balance, last_accrual_month) VALUES (?, ?, ?) ON CONFLICT(member_name) DO UPDATE SET balance = ?, last_accrual_month = ?')
    .run(body.member_name, body.balance, body.last_accrual_month, body.balance, body.last_accrual_month);
    
  db.prepare('INSERT INTO audit_logs (action, module, details, user_name) VALUES (?, ?, ?, ?)')
    .run('Manual Update', 'Leave Balance', `Set balance to ${body.balance} for ${body.member_name}`, body.userName || 'System');
    
  return NextResponse.json({ success: true });
}

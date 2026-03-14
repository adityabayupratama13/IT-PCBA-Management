const Database = require('better-sqlite3');
const db = new Database('./data/it-management.db');
try {
  const rowCount = db.prepare('SELECT COUNT(*) as count FROM tasks').get();
  console.log('Tasks Count:', rowCount.count);
  const ticketCount = db.prepare('SELECT COUNT(*) as count FROM tickets').get();
  console.log('Tickets Count:', ticketCount.count);
} catch (e) {
  console.error(e);
}

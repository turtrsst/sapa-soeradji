import { getDb } from '@/lib/db';
import { isAdmin } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  if (!(await isAdmin())) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  const db = getDb();
  const count = (sql: string, ...args: unknown[]) => (db.prepare(sql).get(...(args as any[])) as any);
  const ticketsByStatus = db.prepare('SELECT status, COUNT(*) as n FROM tickets GROUP BY status').all();
  const logsPerDay = db.prepare(`SELECT strftime('%Y-%m-%d', created_at/1000, 'unixepoch') as day, COUNT(*) as n FROM chat_logs GROUP BY day ORDER BY day DESC LIMIT 14`).all();
  const intentStats = db.prepare('SELECT intent, COUNT(*) as n FROM chat_logs GROUP BY intent ORDER BY n DESC LIMIT 10').all();
  const modeStats = db.prepare('SELECT mode, COUNT(*) as n FROM chat_logs GROUP BY mode').all();
  const recentTickets = db.prepare('SELECT ticket_number, name, category, subject, status, created_at FROM tickets ORDER BY created_at DESC LIMIT 5').all();
  const recentHomecare = db.prepare('SELECT id, name, service, status, created_at FROM homecare_requests ORDER BY created_at DESC LIMIT 5').all();
  return Response.json({
    totals: {
      conversations: count('SELECT COUNT(*) as n FROM conversations').n,
      messages: count('SELECT COUNT(*) as n FROM messages').n,
      tickets: count('SELECT COUNT(*) as n FROM tickets').n,
      homecareRequests: count('SELECT COUNT(*) as n FROM homecare_requests').n,
      campaigns: count('SELECT COUNT(*) as n FROM campaigns WHERE active = 1').n,
      chatsToday: count("SELECT COUNT(*) as n FROM chat_logs WHERE strftime('%Y-%m-%d', created_at/1000, 'unixepoch') = strftime('%Y-%m-%d', 'now')").n,
    },
    ticketsByStatus, logsPerDay, intentStats, modeStats, recentTickets, recentHomecare,
  });
}

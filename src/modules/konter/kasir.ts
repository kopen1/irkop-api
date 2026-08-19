import { Hono } from 'hono'
import type { Bindings } from '../../index'
import { requireAuth } from '../../lib/auth-middleware'

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', requireAuth)

app.get('/sesi', async (c) => {
  const db = c.env.DB_KONTER
  const payload = c.get('jwtPayload' as never) as { sub: number }
  const session = await db.prepare(`
    SELECT * FROM cashier_sessions
    WHERE user_id = ? AND status = 'open'
    ORDER BY id DESC LIMIT 1
  `).bind(payload.sub).first()
  if (!session) {
    return c.json({ status: 'closed' })
  }
  const { results: banks } = await db.prepare(`
    SELECT * FROM cashier_bank_accounts WHERE cashier_session_id = ?
  `).bind(session.id).all()
  return c.json({
    status: 'open',
    id: session.id,
    opening_balance: session.opening_balance,
    drawer_cash: session.drawer_cash,
    closing_balance: session.closing_balance,
    opened_at: session.opened_at,
    banks,
  })
})

app.post('/sesi/buka', async (c) => {
  const db = c.env.DB_KONTER
  const payload = c.get('jwtPayload' as never) as { sub: number }
  const body = await c.req.json()
  const opening_balance = body.opening_balance
  const info = await db.prepare(`
    INSERT INTO cashier_sessions
      (user_id, outlet_id, opening_balance, drawer_cash, status, opened_at)
    VALUES (?, 1, ?, ?, 'open', datetime('now'))
  `).bind(payload.sub, opening_balance, opening_balance).run()
  const id = info.meta?.last_row_id
  const session = await db.prepare('SELECT * FROM cashier_sessions WHERE id = ?').bind(id).first()
  return c.json(session)
})

app.post('/sesi/:id/rekonsiliasi', async (c) => {
  const id = c.req.param('id')
  return c.json({ message: 'rekonsiliasi ok', id })
})

app.post('/sesi/tutup', async (c) => {
  const db = c.env.DB_KONTER
  const payload = c.get('jwtPayload' as never) as { sub: number }
  const body = await c.req.json()
  const session_id = body.session_id
  const actual_cash = body.actual_cash
  const reason = body.reason ?? null
  await db.prepare(`
    UPDATE cashier_sessions
    SET status = 'closed', closing_balance = ?, closed_at = datetime('now')
    WHERE id = ? AND user_id = ?
  `).bind(actual_cash, session_id, payload.sub).run()
  await db.prepare(`
    INSERT INTO cashier_mutations
      (cashier_session_id, type, amount, note, created_at)
    VALUES (?, 'out', ?, ?, datetime('now'))
  `).bind(session_id, actual_cash, reason).run()
  return c.json({ message: 'sesi ditutup', id: session_id })
})

export default app

import { Hono } from 'hono'
import type { Bindings } from '../../index'
import { requireAuth, requireRole, requireNotifhookSecret } from '../../lib/auth-middleware'

const notifhook = new Hono<{ Bindings: Bindings }>()

notifhook.post('/', requireNotifhookSecret, async (c) => {
  const db = c.env.DB_KONTER
  const payload = await c.req.json()
  await db.prepare("INSERT INTO notif_logs (source_id, raw_content, status) VALUES (?, ?, 'pending')").bind(null, JSON.stringify(payload)).run()
  return c.json({ message: 'notifikasi diterima' })
})

notifhook.get('/sumber', requireAuth, requireRole('admin'), async (c) => {
  const db = c.env.DB_KONTER
  const { results } = await db.prepare("SELECT * FROM notif_sources ORDER BY id").all()
  return c.json(results)
})

notifhook.post('/sumber', requireAuth, requireRole('admin'), async (c) => {
  const db = c.env.DB_KONTER
  const body = await c.req.json<{ source_name: string, matcher_type: string, value: string }>()
  const info = await db.prepare("INSERT INTO notif_sources (source_name, matcher_type, value, status) VALUES (?, ?, ?, 'aktif')").bind(body.source_name, body.matcher_type, body.value).run()
  const row = await db.prepare("SELECT * FROM notif_sources WHERE id = ?").bind(info.meta?.last_row_id).first()
  return c.json(row)
})

notifhook.get('/status', requireAuth, async (c) => {
  const db = c.env.DB_KONTER
  const { results } = await db.prepare("SELECT status, COUNT(*) AS count FROM notif_logs GROUP BY status").all()
  const total = (results as { count: number }[]).reduce((acc, r) => acc + r.count, 0)
  return c.json({ totals: results, total })
})

export default notifhook

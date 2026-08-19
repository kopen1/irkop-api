import { Hono } from 'hono'
import type { Bindings } from '../../index'
import { requireAuth } from '../../lib/auth-middleware'

const cashbook = new Hono<{ Bindings: Bindings }>()

cashbook.use('*', requireAuth)

cashbook.get('/', async (c) => {
  const db = c.env.DB_KONTER
  const { results } = await db.prepare('SELECT * FROM cash_sessions ORDER BY session_date DESC').all()
  return c.json(results)
})

cashbook.post('/open', async (c) => {
  const body = await c.req.json()
  return c.json({ message: 'sesi kas dibuka', body })
})

cashbook.post('/:id/close', async (c) => {
  const body = await c.req.json()
  return c.json({ message: 'sesi kas ditutup', id: c.req.param('id'), body })
})

export default cashbook

import { Hono } from 'hono'
import type { Bindings } from '../../index'
import { requireAuth } from '../../lib/auth-middleware'

const pos = new Hono<{ Bindings: Bindings }>()

pos.use('*', requireAuth)

pos.get('/', async (c) => {
  const db = c.env.DB_KONTER
  const { results } = await db.prepare('SELECT * FROM transaksi ORDER BY created_at DESC LIMIT 50').all()
  return c.json(results)
})

pos.post('/', async (c) => {
  const db = c.env.DB_KONTER
  const body = await c.req.json()
  // TODO: insert transaksi, dukung split-payment
  return c.json({ message: 'transaksi dibuat', body })
})

export default pos

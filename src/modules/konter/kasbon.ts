import { Hono } from 'hono'
import type { Bindings } from '../../index'
import { requireAuth } from '../../lib/auth-middleware'

const kasbon = new Hono<{ Bindings: Bindings }>()

kasbon.use('*', requireAuth)

kasbon.get('/', async (c) => {
  const db = c.env.DB_KONTER
  const { results } = await db.prepare('SELECT * FROM kasbon WHERE deleted_at IS NULL').all()
  return c.json(results)
})

kasbon.post('/', async (c) => {
  const db = c.env.DB_KONTER
  const body = await c.req.json()
  return c.json({ message: 'kasbon dicatat', body })
})

export default kasbon

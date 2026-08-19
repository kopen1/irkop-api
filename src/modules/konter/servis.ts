import { Hono } from 'hono'
import type { Bindings } from '../../index'
import { requireAuth } from '../../lib/auth-middleware'

const servis = new Hono<{ Bindings: Bindings }>()

servis.use('*', requireAuth)

servis.get('/', async (c) => {
  const db = c.env.DB_KONTER
  const { results } = await db.prepare('SELECT * FROM servis_hp WHERE deleted_at IS NULL').all()
  return c.json(results)
})

servis.post('/', async (c) => {
  const db = c.env.DB_KONTER
  const body = await c.req.json()
  return c.json({ message: 'tiket servis dibuat', body })
})

export default servis

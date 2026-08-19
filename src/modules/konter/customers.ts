import { Hono } from 'hono'
import type { Bindings } from '../../index'
import { requireAuth } from '../../lib/auth-middleware'

const customers = new Hono<{ Bindings: Bindings }>()

customers.use('*', requireAuth)

customers.get('/', async (c) => {
  const db = c.env.DB_KONTER
  const { results } = await db.prepare('SELECT * FROM customers WHERE deleted_at IS NULL').all()
  return c.json(results)
})

customers.get('/:id', async (c) => {
  const db = c.env.DB_KONTER
  const row = await db.prepare('SELECT * FROM customers WHERE id = ?').bind(c.req.param('id')).first()
  if (!row) return c.json({ error: 'Not found' }, 404)
  return c.json(row)
})

customers.post('/', async (c) => {
  const body = await c.req.json()
  return c.json({ message: 'customer dibuat', body })
})

customers.put('/:id', async (c) => {
  const body = await c.req.json()
  return c.json({ message: 'customer diupdate', id: c.req.param('id'), body })
})

export default customers

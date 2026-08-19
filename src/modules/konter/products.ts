import { Hono } from 'hono'
import type { Bindings } from '../../index'
import { requireAuth } from '../../lib/auth-middleware'

const products = new Hono<{ Bindings: Bindings }>()

products.use('*', requireAuth)

products.get('/', async (c) => {
  const db = c.env.DB_KONTER
  const { results } = await db.prepare('SELECT * FROM products WHERE deleted_at IS NULL').all()
  return c.json(results)
})

products.post('/', async (c) => {
  const body = await c.req.json()
  return c.json({ message: 'produk dibuat', body })
})

products.put('/:id', async (c) => {
  const body = await c.req.json()
  return c.json({ message: 'produk diupdate', id: c.req.param('id'), body })
})

export default products

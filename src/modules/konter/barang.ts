import { Hono } from 'hono'
import type { Bindings } from '../../index'
import { requireAuth } from '../../lib/auth-middleware'

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', requireAuth)

// GET /v1/konter/barang -> list products (newest first)
app.get('/', async (c) => {
  const db = c.env.DB_KONTER
  const { results } = await db
    .prepare(
      'SELECT id,name,category_id,sell_price,cost_price,stock,is_active FROM products WHERE is_active=1 ORDER BY id DESC'
    )
    .all()
  return c.json(results)
})

// POST /v1/konter/barang -> create product
app.post('/', async (c) => {
  const { name, category_id, sell_price, cost_price, stock } = await c.req.json()
  const db = c.env.DB_KONTER
  const info = await db
    .prepare(
      `INSERT INTO products (name, category_id, sell_price, cost_price, stock, outlet_id, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, 1, 1, datetime('now'), datetime('now'))`
    )
    .bind(name, category_id, sell_price, cost_price, stock)
    .run()
  const id = info.meta?.last_row_id
  const row = await db
    .prepare('SELECT id,name,category_id,sell_price,cost_price,stock,is_active FROM products WHERE id=?')
    .bind(id)
    .first()
  return c.json(row)
})

// PUT /v1/konter/barang/:id -> update product (dynamic fields)
app.put('/:id', async (c) => {
  const id = c.req.param('id')
  const body = await c.req.json()
  const fields: string[] = []
  const values: unknown[] = []
  if (body.name !== undefined) { fields.push('name=?'); values.push(body.name) }
  if (body.category_id !== undefined) { fields.push('category_id=?'); values.push(body.category_id) }
  if (body.sell_price !== undefined) { fields.push('sell_price=?'); values.push(body.sell_price) }
  if (body.cost_price !== undefined) { fields.push('cost_price=?'); values.push(body.cost_price) }
  if (body.stock !== undefined) { fields.push('stock=?'); values.push(body.stock) }
  fields.push("updated_at=datetime('now')")
  values.push(id)

  const db = c.env.DB_KONTER
  await db
    .prepare(`UPDATE products SET ${fields.join(', ')} WHERE id=?`)
    .bind(...values)
    .run()
  const row = await db
    .prepare('SELECT id,name,category_id,sell_price,cost_price,stock,is_active FROM products WHERE id=?')
    .bind(id)
    .first()
  return c.json(row)
})

// DELETE /v1/konter/barang/:id -> soft delete (is_active=0)
app.delete('/:id', async (c) => {
  const id = c.req.param('id')
  const db = c.env.DB_KONTER
  await db
    .prepare(`UPDATE products SET is_active=0, updated_at=datetime('now') WHERE id=?`)
    .bind(id)
    .run()
  return c.json({ message: 'ok', id })
})

// GET /v1/konter/barang/kategori -> list product categories
app.get('/kategori', async (c) => {
  const db = c.env.DB_KONTER
  const { results } = await db.prepare('SELECT * FROM product_categories ORDER BY id').all()
  return c.json(results)
})

// POST /v1/konter/barang/kategori -> create category
app.post('/kategori', async (c) => {
  const { name } = await c.req.json()
  const db = c.env.DB_KONTER
  const info = await db
    .prepare(
      `INSERT INTO product_categories (name, outlet_id, created_at)
       VALUES (?, 1, datetime('now'))`
    )
    .bind(name)
    .run()
  const id = info.meta?.last_row_id
  const row = await db
    .prepare('SELECT * FROM product_categories WHERE id=?')
    .bind(id)
    .first()
  return c.json(row)
})

export default app

import { Hono } from 'hono'
import type { Bindings } from '../../index'
import { requireAuth } from '../../lib/auth-middleware'

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', requireAuth)

app.get('/', async (c) => {
  const db = c.env.DB_KONTER
  const { results } = await db.prepare('SELECT * FROM customers WHERE merged_into_id IS NULL ORDER BY id DESC').all()
  return c.json(results)
})

app.post('/', async (c) => {
  const db = c.env.DB_KONTER
  const b = await c.req.json()
  const info = await db.prepare(
    `INSERT INTO customers (name, phone, outlet_id, created_at)
     VALUES (?, ?, 1, datetime('now'))`
  ).bind(b.name, b.phone ?? null).run()
  const id = Number(info.meta?.last_row_id ?? 0)
  const row = await db.prepare('SELECT * FROM customers WHERE id = ?').bind(id).first()
  return c.json(row)
})

app.put('/:id', async (c) => {
  const db = c.env.DB_KONTER
  const id = Number(c.req.param('id'))
  const b = await c.req.json()
  const fields: string[] = []
  const values: any[] = []
  for (const f of ['name', 'phone']) {
    if (b[f] !== undefined) {
      fields.push(`${f} = ?`)
      values.push(b[f])
    }
  }
  if (fields.length > 0) {
    values.push(id)
    await db.prepare(`UPDATE customers SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run()
  }
  const row = await db.prepare('SELECT * FROM customers WHERE id = ?').bind(id).first()
  return c.json(row)
})

app.delete('/:id', async (c) => {
  const db = c.env.DB_KONTER
  const id = Number(c.req.param('id'))
  await db.prepare('DELETE FROM customers WHERE id = ?').bind(id).run()
  return c.json({ message: 'ok', id })
})

export default app

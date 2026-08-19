import { Hono } from 'hono'
import type { Bindings } from '../../index'
import { requireAuth } from '../../lib/auth-middleware'

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', requireAuth)

app.get('/', async (c) => {
  const db = c.env.DB_KONTER
  const { results } = await db.prepare('SELECT * FROM employees ORDER BY id DESC').all()
  return c.json(results)
})

app.post('/', async (c) => {
  const db = c.env.DB_KONTER
  const b = await c.req.json()
  const info = await db.prepare(
    `INSERT INTO employees (name, position, phone, is_active, outlet_id, created_at)
     VALUES (?, ?, ?, 1, 1, datetime('now'))`
  ).bind(b.name, b.position ?? null, b.phone ?? null).run()
  const id = Number(info.meta?.last_row_id ?? 0)
  const row = await db.prepare('SELECT * FROM employees WHERE id = ?').bind(id).first()
  return c.json(row)
})

app.put('/:id', async (c) => {
  const db = c.env.DB_KONTER
  const id = Number(c.req.param('id'))
  const b = await c.req.json()
  const fields: string[] = []
  const values: any[] = []
  for (const f of ['name', 'position', 'phone']) {
    if (b[f] !== undefined) {
      fields.push(`${f} = ?`)
      values.push(b[f])
    }
  }
  if (fields.length > 0) {
    values.push(id)
    await db.prepare(`UPDATE employees SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run()
  }
  const row = await db.prepare('SELECT * FROM employees WHERE id = ?').bind(id).first()
  return c.json(row)
})

app.delete('/:id', async (c) => {
  const db = c.env.DB_KONTER
  const id = Number(c.req.param('id'))
  await db.prepare('UPDATE employees SET is_active = 0 WHERE id = ?').bind(id).run()
  return c.json({ message: 'ok', id })
})

export default app

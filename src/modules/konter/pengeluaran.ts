import { Hono } from 'hono'
import type { Bindings } from '../../index'
import { requireAuth } from '../../lib/auth-middleware'

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', requireAuth)

app.get('/', async (c) => {
  const db = c.env.DB_KONTER
  const { results } = await db.prepare('SELECT * FROM expenses ORDER BY date DESC').all()
  return c.json(results)
})

app.post('/', async (c) => {
  const db = c.env.DB_KONTER
  const b = await c.req.json()
  const info = await db.prepare(
    `INSERT INTO expenses (category, amount, date, note, outlet_id, created_at)
     VALUES (?, ?, ?, ?, 1, datetime('now'))`
  ).bind(b.category ?? null, b.amount, b.date, b.note ?? null).run()
  const id = Number(info.meta?.last_row_id ?? 0)
  const row = await db.prepare('SELECT * FROM expenses WHERE id = ?').bind(id).first()
  return c.json(row)
})

app.put('/:id', async (c) => {
  const db = c.env.DB_KONTER
  const id = Number(c.req.param('id'))
  const b = await c.req.json()
  const fields: string[] = []
  const values: any[] = []
  for (const f of ['category', 'amount', 'date', 'note']) {
    if (b[f] !== undefined) {
      fields.push(`${f} = ?`)
      values.push(f === 'amount' ? Number(b[f]) : b[f])
    }
  }
  if (fields.length > 0) {
    values.push(id)
    await db.prepare(`UPDATE expenses SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run()
  }
  const row = await db.prepare('SELECT * FROM expenses WHERE id = ?').bind(id).first()
  return c.json(row)
})

app.delete('/:id', async (c) => {
  const db = c.env.DB_KONTER
  const id = Number(c.req.param('id'))
  await db.prepare('DELETE FROM expenses WHERE id = ?').bind(id).run()
  return c.json({ message: 'ok', id })
})

export default app

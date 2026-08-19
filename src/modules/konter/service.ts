import { Hono } from 'hono'
import type { Bindings } from '../../index'
import { requireAuth } from '../../lib/auth-middleware'

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', requireAuth)

app.get('/', async (c) => {
  const db = c.env.DB_KONTER
  const { results } = await db.prepare('SELECT * FROM service_orders ORDER BY id DESC').all()
  return c.json(results)
})

app.post('/', async (c) => {
  const db = c.env.DB_KONTER
  const b = await c.req.json()
  const serviceCost = Number(b.service_cost ?? 0)
  const costPrice = Number(b.cost_price ?? 0)
  const profit = serviceCost - costPrice
  const info = await db.prepare(
    `INSERT INTO service_orders (device_name, customer_id, phone_number, damage_description, service_cost, cost_price, profit, date_in, date_out, warranty, technician_id, notes, status, outlet_id, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'))`
  ).bind(
    b.device_name,
    b.customer_id ?? null,
    b.phone_number ?? null,
    b.damage_description ?? null,
    b.service_cost ?? null,
    b.cost_price ?? null,
    profit,
    b.date_in,
    b.date_out ?? null,
    b.warranty ?? null,
    b.technician_id ?? null,
    b.notes ?? null,
    b.status ?? 'diterima'
  ).run()
  const id = Number(info.meta?.last_row_id ?? 0)
  const row = await db.prepare('SELECT * FROM service_orders WHERE id = ?').bind(id).first()
  return c.json(row)
})

app.put('/:id', async (c) => {
  const db = c.env.DB_KONTER
  const id = Number(c.req.param('id'))
  const b = await c.req.json()
  const fields: string[] = []
  const values: any[] = []
  const numFields = ['customer_id', 'service_cost', 'cost_price', 'technician_id']
  for (const f of ['device_name', 'customer_id', 'phone_number', 'damage_description', 'service_cost', 'cost_price', 'date_in', 'date_out', 'warranty', 'technician_id', 'notes', 'status']) {
    if (b[f] !== undefined) {
      if (numFields.includes(f)) {
        fields.push(`${f} = ?`)
        values.push(Number(b[f]))
      } else {
        fields.push(`${f} = ?`)
        values.push(b[f])
      }
    }
  }
  if (b.service_cost !== undefined || b.cost_price !== undefined) {
    const cur = await db.prepare('SELECT service_cost, cost_price FROM service_orders WHERE id = ?').bind(id).first() as any
    const sc = Number(b.service_cost ?? cur?.service_cost ?? 0)
    const cp = Number(b.cost_price ?? cur?.cost_price ?? 0)
    fields.push('profit = ?')
    values.push(sc - cp)
  }
  if (fields.length === 0) {
    const row = await db.prepare('SELECT * FROM service_orders WHERE id = ?').bind(id).first()
    return c.json(row)
  }
  values.push(id)
  await db.prepare(`UPDATE service_orders SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run()
  const row = await db.prepare('SELECT * FROM service_orders WHERE id = ?').bind(id).first()
  return c.json(row)
})

app.delete('/:id', async (c) => {
  const db = c.env.DB_KONTER
  const id = Number(c.req.param('id'))
  await db.prepare('DELETE FROM service_orders WHERE id = ?').bind(id).run()
  return c.json({ message: 'ok', id })
})

app.get('/laporan', async (c) => {
  const db = c.env.DB_KONTER
  const { results } = await db.prepare(
    `SELECT status, COUNT(*) AS count, SUM(service_cost) AS total FROM service_orders GROUP BY status`
  ).all()
  return c.json(results)
})

export default app

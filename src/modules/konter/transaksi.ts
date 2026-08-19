import { Hono } from 'hono'
import type { Bindings } from '../../index'
import { requireAuth } from '../../lib/auth-middleware'

const app = new Hono<{ Bindings: Bindings }>()

app.use('*', requireAuth)

app.get('/', async (c) => {
  const db = c.env.DB_KONTER
  const { results } = await db.prepare(`
    SELECT t.id, t.product_id, t.category_id, t.sell_price, t.cost_price, t.profit,
           t.payment_method, t.customer_id, t.user_id, t.transaction_date,
           p.name AS product_name, c.name AS customer_name, u.name AS user_name
    FROM transactions t
    LEFT JOIN products p ON p.id = t.product_id
    LEFT JOIN customers c ON c.id = t.customer_id
    LEFT JOIN users u ON u.id = t.user_id
    ORDER BY t.created_at DESC
    LIMIT 50
  `).all()
  return c.json(results)
})

app.get('/hari-ini', async (c) => {
  const db = c.env.DB_KONTER
  const { results } = await db.prepare(`
    SELECT t.id, t.product_id, t.category_id, t.sell_price, t.cost_price, t.profit,
           t.payment_method, t.customer_id, t.user_id, t.transaction_date,
           p.name AS product_name, c.name AS customer_name, u.name AS user_name
    FROM transactions t
    LEFT JOIN products p ON p.id = t.product_id
    LEFT JOIN customers c ON c.id = t.customer_id
    LEFT JOIN users u ON u.id = t.user_id
    WHERE date(t.transaction_date) = date('now')
    ORDER BY t.created_at DESC
    LIMIT 50
  `).all()
  return c.json(results)
})

app.post('/', async (c) => {
  const db = c.env.DB_KONTER
  const payload = c.get('jwtPayload' as never) as { sub: number }
  const body = await c.req.json()
  const product_id = body.product_id ?? null
  const category_id = body.category_id ?? null
  const sell_price = body.sell_price
  const cost_price = body.cost_price
  const profit = body.profit
  const payment_method = body.payment_method ?? null
  const customer_id = body.customer_id ?? null
  const transaction_date = body.transaction_date || null
  const info = await db.prepare(`
    INSERT INTO transactions
      (product_id, category_id, sell_price, cost_price, profit, payment_method, customer_id, user_id, outlet_id, transaction_date, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, COALESCE(?, datetime('now')), datetime('now'))
  `).bind(
    product_id,
    category_id,
    sell_price,
    cost_price,
    profit,
    payment_method,
    customer_id,
    payload.sub,
    transaction_date
  ).run()
  const id = info.meta?.last_row_id
  const row = await db.prepare('SELECT * FROM transactions WHERE id = ?').bind(id).first()
  return c.json(row)
})

export default app

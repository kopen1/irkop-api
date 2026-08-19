import { Hono } from 'hono'
import type { Bindings } from '../../index'
import { requireAuth } from '../../lib/auth-middleware'

const expenses = new Hono<{ Bindings: Bindings }>()

expenses.use('*', requireAuth)

expenses.get('/', async (c) => {
  const db = c.env.DB_KONTER
  const { results } = await db.prepare('SELECT * FROM expenses WHERE deleted_at IS NULL ORDER BY created_at DESC').all()
  return c.json(results)
})

expenses.post('/', async (c) => {
  const body = await c.req.json()
  return c.json({ message: 'pengeluaran dicatat', body })
})

export default expenses

import { Hono } from 'hono'
import type { Bindings } from '../../index'
import { requireAuth, requireRole } from '../../lib/auth-middleware'

const payroll = new Hono<{ Bindings: Bindings }>()

// payroll data sensitif -> wajib login DAN role owner
payroll.use('*', requireAuth)
payroll.use('*', requireRole('owner'))

payroll.get('/', async (c) => {
  const db = c.env.DB_KONTER
  const { results } = await db.prepare('SELECT * FROM payroll WHERE deleted_at IS NULL').all()
  return c.json(results)
})

payroll.post('/', async (c) => {
  const body = await c.req.json()
  return c.json({ message: 'payroll dicatat', body })
})

export default payroll

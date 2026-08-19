import { Hono } from 'hono'
import type { Bindings } from '../../index'
import { requireAuth } from '../../lib/auth-middleware'

const reports = new Hono<{ Bindings: Bindings }>()

reports.use('*', requireAuth)

reports.get('/daily', async (c) => {
  return c.json({ message: 'laporan harian', date: c.req.query('date') })
})

reports.get('/summary', async (c) => {
  return c.json({ message: 'laporan ringkasan', from: c.req.query('from'), to: c.req.query('to') })
})

export default reports

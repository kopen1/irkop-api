import { Hono } from 'hono'
import type { Bindings } from '../../index'
import { requireAuth } from '../../lib/auth-middleware'

const laporan = new Hono<{ Bindings: Bindings }>()

laporan.use('*', requireAuth)

laporan.get('/', async (c) => {
  const db = c.env.DB_KONTER
  const total = await db.prepare("SELECT COALESCE(SUM(sell_price),0) AS omset_total, COALESCE(SUM(profit),0) AS laba_total, COUNT(*) AS transaksi_count FROM transactions").first<{ omset_total: number; laba_total: number; transaksi_count: number }>()
  const { results } = await db.prepare("SELECT payment_method, COUNT(*) AS count, SUM(sell_price) AS total FROM transactions GROUP BY payment_method").all()
  return c.json({
    omset_total: total?.omset_total ?? 0,
    laba_total: total?.laba_total ?? 0,
    transaksi_count: total?.transaksi_count ?? 0,
    by_method: results
  })
})

export default laporan

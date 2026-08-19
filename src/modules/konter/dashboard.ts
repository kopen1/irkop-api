import { Hono } from 'hono'
import type { Bindings } from '../../index'
import { requireAuth } from '../../lib/auth-middleware'

const dashboard = new Hono<{ Bindings: Bindings }>()

dashboard.use('*', requireAuth)

dashboard.get('/summary', async (c) => {
  const db = c.env.DB_KONTER
  const today = await db.prepare("SELECT COALESCE(SUM(sell_price),0) AS omset, COALESCE(SUM(profit),0) AS laba, COUNT(*) AS transaksi FROM transactions WHERE date(transaction_date)=date('now')").first<{ omset: number; laba: number; transaksi: number }>()
  const session = await db.prepare("SELECT drawer_cash FROM cashier_sessions WHERE status='open' ORDER BY id DESC LIMIT 1").first<{ drawer_cash: number }>()
  return c.json({
    omset: today?.omset ?? 0,
    laba: today?.laba ?? 0,
    transaksi: today?.transaksi ?? 0,
    saldo_kasir: session?.drawer_cash ?? 0
  })
})

export default dashboard

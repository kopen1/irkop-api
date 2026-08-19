import { Hono } from 'hono'
import type { Bindings } from '../../index'
import { requireNotifhookSecret } from '../../lib/auth-middleware'

const notifhook = new Hono<{ Bindings: Bindings }>()

// bukan JWT - app Android NotifHook kirim secret key tetap di header
// x-notifhook-secret, diverifikasi cocok dengan env.NOTIFHOOK_SECRET
notifhook.use('*', requireNotifhookSecret)

notifhook.post('/', async (c) => {
  const db = c.env.DB_KONTER
  const payload = await c.req.json()
  // TODO: parse notifikasi DANA/SeaBank/OrderKuota, auto-rekonsiliasi
  return c.json({ message: 'notifikasi diterima', payload })
})

export default notifhook

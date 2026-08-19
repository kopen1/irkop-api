// ============================================================
// Middleware autentikasi & otorisasi.
// Pakai JWT bawaan Hono (hono/jwt) - tidak reinvent JWT sendiri.
// Secret diambil dari c.env.JWT_SECRET, yang disimpan via:
//   wrangler secret put JWT_SECRET
// (JANGAN taruh secret ini di wrangler.toml / kode / git)
// ============================================================
import { jwt } from 'hono/jwt'
import type { MiddlewareHandler } from 'hono'
import type { Bindings } from '../index'

// Wajib login (token valid) untuk akses route ini
export const requireAuth: MiddlewareHandler<{ Bindings: Bindings }> = async (c, next) => {
  const middleware = jwt({ secret: c.env.JWT_SECRET })
  return middleware(c, next)
}

// Wajib login DAN role tertentu, contoh: requireRole('owner')
// Pasang SETELAH requireAuth di route yang butuh.
export function requireRole(...roles: string[]): MiddlewareHandler<{ Bindings: Bindings }> {
  return async (c, next) => {
    const payload = c.get('jwtPayload' as never) as { role?: string } | undefined
    if (!payload?.role || !roles.includes(payload.role)) {
      return c.json({ error: 'Forbidden: role tidak diizinkan mengakses ini' }, 403)
    }
    await next()
  }
}

// Untuk endpoint /notifhook (dari app Android) - bukan JWT,
// tapi secret key tetap di header. Secret disimpan via:
//   wrangler secret put NOTIFHOOK_SECRET
export const requireNotifhookSecret: MiddlewareHandler<{ Bindings: Bindings }> = async (c, next) => {
  const secret = c.req.header('x-notifhook-secret')
  if (!secret || secret !== c.env.NOTIFHOOK_SECRET) {
    return c.json({ error: 'Unauthorized' }, 401)
  }
  await next()
}

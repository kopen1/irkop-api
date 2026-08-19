import { Hono } from 'hono'
import { sign } from 'hono/jwt'
import type { Bindings } from '../../index'
import { hashPassword, verifyPassword } from '../../lib/password'
import { requireAuth, requireRole } from '../../lib/auth-middleware'

const auth = new Hono<{ Bindings: Bindings }>()

auth.post('/login', async (c) => {
  const { email, password } = await c.req.json<{ email?: string; password?: string }>()
  if (!email || !password) {
    return c.json({ error: 'email & password wajib diisi' }, 400)
  }

  const db = c.env.DB_KONTER
  const user = await db
    .prepare('SELECT * FROM users WHERE email = ? AND is_active = 1')
    .bind(email)
    .first<{ id: number; name: string; email: string; password_hash: string; role: string; outlet_id: number }>()

  if (!user) return c.json({ error: 'Email atau password salah' }, 401)

  const valid = await verifyPassword(password, user.password_hash)
  if (!valid) return c.json({ error: 'Email atau password salah' }, 401)

  const payload = {
    sub: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    outlet_id: user.outlet_id,
    project: 'konter',
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8, // token berlaku 8 jam
  }
  const token = await sign(payload, c.env.JWT_SECRET)

  return c.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role, outlet_id: user.outlet_id },
  })
})

// Bikin user baru - cuma admin yang login yang boleh bikin user lain
auth.post('/register', requireAuth, requireRole('admin'), async (c) => {
  const { email, password, name, role } = await c.req.json<{
    email?: string
    password?: string
    name?: string
    role?: string
  }>()
  if (!email || !password) {
    return c.json({ error: 'email & password wajib diisi' }, 400)
  }

  const db = c.env.DB_KONTER
  const existing = await db.prepare('SELECT id FROM users WHERE email = ?').bind(email).first()
  if (existing) return c.json({ error: 'Email sudah dipakai' }, 409)

  const passwordHash = await hashPassword(password)
  const info = await db
    .prepare(
      "INSERT INTO users (name, email, password_hash, role, is_active, outlet_id, created_at, updated_at) VALUES (?, ?, ?, ?, 1, 1, datetime('now'), datetime('now'))"
    )
    .bind(name || email, email, passwordHash, role || 'kasir')
    .run()

  const id = Number(info.meta?.last_row_id ?? 0)
  return c.json({ message: 'User dibuat', id, email, role: role || 'kasir' })
})

// Cek token masih valid (dipakai frontend untuk validasi sesi)
auth.get('/me', requireAuth, async (c) => {
  const payload = c.get('jwtPayload' as never) as { sub: number; email: string; name: string; role: string; outlet_id: number }
  return c.json({
    user: {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      outlet_id: payload.outlet_id,
    },
  })
})

auth.post('/logout', requireAuth, async (c) => {
  return c.json({ message: 'Logout berhasil' })
})

export default auth

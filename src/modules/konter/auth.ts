import { Hono } from 'hono'
import { sign } from 'hono/jwt'
import type { Bindings } from '../../index'
import { hashPassword, verifyPassword } from '../../lib/password'
import { requireAuth, requireRole } from '../../lib/auth-middleware'

const auth = new Hono<{ Bindings: Bindings }>()

auth.post('/login', async (c) => {
  const { username, password } = await c.req.json()
  if (!username || !password) {
    return c.json({ error: 'username & password wajib diisi' }, 400)
  }

  const db = c.env.DB_KONTER
  const user = await db
    .prepare('SELECT * FROM users WHERE username = ? AND deleted_at IS NULL')
    .bind(username)
    .first<{ id: string; username: string; password_hash: string; role: string }>()

  if (!user) return c.json({ error: 'Username atau password salah' }, 401)

  const valid = await verifyPassword(password, user.password_hash)
  if (!valid) return c.json({ error: 'Username atau password salah' }, 401)

  const payload = {
    sub: user.id,
    username: user.username,
    role: user.role,
    project: 'konter',
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 8, // token berlaku 8 jam
  }
  const token = await sign(payload, c.env.JWT_SECRET)

  return c.json({
    token,
    user: { id: user.id, username: user.username, role: user.role },
  })
})

// Bikin user baru - cuma owner yang login yang boleh bikin user lain
auth.post('/register', requireAuth, requireRole('owner'), async (c) => {
  const { username, password, role } = await c.req.json()
  if (!username || !password) {
    return c.json({ error: 'username & password wajib diisi' }, 400)
  }

  const db = c.env.DB_KONTER
  const existing = await db.prepare('SELECT id FROM users WHERE username = ?').bind(username).first()
  if (existing) return c.json({ error: 'Username sudah dipakai' }, 409)

  const passwordHash = await hashPassword(password)
  const id = crypto.randomUUID()

  await db
    .prepare(
      "INSERT INTO users (id, username, password_hash, role, created_at) VALUES (?, ?, ?, ?, datetime('now'))"
    )
    .bind(id, username, passwordHash, role || 'staff')
    .run()

  return c.json({ message: 'User dibuat', id, username, role: role || 'staff' })
})

// Cek token masih valid (dipakai frontend untuk validasi sesi)
auth.get('/me', requireAuth, async (c) => {
  const payload = c.get('jwtPayload' as never) as { sub: string; username: string; role: string }
  return c.json({ user: payload })
})

export default auth

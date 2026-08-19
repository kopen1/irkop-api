import { Hono } from 'hono'
import type { Bindings } from '../../index'
import { requireAuth, requireRole } from '../../lib/auth-middleware'
import { hashPassword } from '../../lib/password'

const pengaturan = new Hono<{ Bindings: Bindings }>()

pengaturan.use('*', requireAuth)

pengaturan.get('/user', async (c) => {
  const db = c.env.DB_KONTER
  const payload = c.get('jwtPayload' as never) as { role?: string, sub?: string }
  if (payload?.role === 'admin') {
    const { results } = await db.prepare("SELECT id,name,email,role,is_active,outlet_id FROM users ORDER BY id").all()
    return c.json(results)
  }
  const { results } = await db.prepare("SELECT id,name,email,role,is_active,outlet_id FROM users WHERE id = ?").bind(payload?.sub).all()
  return c.json(results)
})

pengaturan.post('/user', requireRole('admin'), async (c) => {
  const db = c.env.DB_KONTER
  const body = await c.req.json<{ name: string, email: string, password: string, role: string }>()
  const password_hash = await hashPassword(body.password)
  const info = await db.prepare("INSERT INTO users (name, email, password_hash, role, is_active, outlet_id) VALUES (?, ?, ?, ?, 1, 1)").bind(body.name, body.email, password_hash, body.role).run()
  const row = await db.prepare("SELECT id,name,email,role,is_active,outlet_id FROM users WHERE id = ?").bind(info.meta?.last_row_id).first()
  return c.json(row)
})

pengaturan.put('/user/:id', requireRole('admin'), async (c) => {
  const db = c.env.DB_KONTER
  const id = c.req.param('id')
  const body = await c.req.json<{ name?: string, email?: string, role?: string, password?: string }>()
  if (body.password) {
    const password_hash = await hashPassword(body.password)
    await db.prepare("UPDATE users SET name = ?, email = ?, role = ?, password_hash = ? WHERE id = ?").bind(body.name, body.email, body.role, password_hash, id).run()
  } else {
    await db.prepare("UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?").bind(body.name, body.email, body.role, id).run()
  }
  const row = await db.prepare("SELECT id,name,email,role,is_active,outlet_id FROM users WHERE id = ?").bind(id).first()
  return c.json(row)
})

pengaturan.get('/role', async (c) => {
  const db = c.env.DB_KONTER
  const { results } = await db.prepare("SELECT * FROM role_permissions ORDER BY id").all()
  return c.json(results)
})

pengaturan.put('/role', requireRole('admin'), async (c) => {
  const db = c.env.DB_KONTER
  const body = await c.req.json<{ role: string, module: string, access_level: string }>()
  const existing = await db.prepare("SELECT id FROM role_permissions WHERE role = ? AND module = ?").bind(body.role, body.module).first()
  if (existing) {
    await db.prepare("UPDATE role_permissions SET access_level = ? WHERE role = ? AND module = ?").bind(body.access_level, body.role, body.module).run()
  } else {
    await db.prepare("INSERT INTO role_permissions (role, module, access_level) VALUES (?, ?, ?)").bind(body.role, body.module, body.access_level).run()
  }
  const row = await db.prepare("SELECT * FROM role_permissions WHERE role = ? AND module = ?").bind(body.role, body.module).first()
  return c.json(row)
})

pengaturan.get('/master-akun', async (c) => {
  const db = c.env.DB_KONTER
  const { results } = await db.prepare("SELECT * FROM master_accounts ORDER BY id").all()
  return c.json(results)
})

pengaturan.post('/master-akun', requireRole('admin'), async (c) => {
  const db = c.env.DB_KONTER
  const body = await c.req.json<{ account_name: string, account_number?: string, balance?: number, is_custom?: number }>()
  const info = await db.prepare("INSERT INTO master_accounts (account_name, account_number, balance, is_custom) VALUES (?, ?, ?, ?)").bind(body.account_name, body.account_number ?? null, body.balance ?? 0, body.is_custom ?? 0).run()
  const row = await db.prepare("SELECT * FROM master_accounts WHERE id = ?").bind(info.meta?.last_row_id).first()
  return c.json(row)
})

pengaturan.put('/master-akun/:id', requireRole('admin'), async (c) => {
  const db = c.env.DB_KONTER
  const id = c.req.param('id')
  const body = await c.req.json<{ account_name?: string, account_number?: string, balance?: number, is_custom?: number }>()
  const sets: string[] = []
  const binds: unknown[] = []
  if (body.account_name !== undefined) { sets.push('account_name = ?'); binds.push(body.account_name) }
  if (body.account_number !== undefined) { sets.push('account_number = ?'); binds.push(body.account_number) }
  if (body.balance !== undefined) { sets.push('balance = ?'); binds.push(body.balance) }
  if (body.is_custom !== undefined) { sets.push('is_custom = ?'); binds.push(body.is_custom) }
  if (sets.length > 0) {
    binds.push(id)
    await db.prepare(`UPDATE master_accounts SET ${sets.join(', ')} WHERE id = ?`).bind(...binds).run()
  }
  const row = await db.prepare("SELECT * FROM master_accounts WHERE id = ?").bind(id).first()
  return c.json(row)
})

pengaturan.get('/audit-log', requireRole('admin'), async (c) => {
  const db = c.env.DB_KONTER
  const { results } = await db.prepare("SELECT * FROM audit_logs ORDER BY id DESC LIMIT 100").all()
  return c.json(results)
})

export default pengaturan

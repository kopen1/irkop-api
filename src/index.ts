import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { registerRoutes, REGISTERED_ROUTES } from './registry.generated'

// Bindings gabungan: semua D1 database (DB_KONTER, DB_LISTRIK, dst)
// ditambah secrets/vars global.
export type Bindings = Record<string, D1Database> & {
  JWT_SECRET: string
  NOTIFHOOK_SECRET: string
  ALLOWED_ORIGINS: string
}

const app = new Hono<{ Bindings: Bindings }>()

// CORS: cuma origin yang terdaftar di ALLOWED_ORIGINS (wrangler.toml [vars])
// yang boleh fetch API ini dari browser.
app.use('*', async (c, next) => {
  const allowed = (c.env.ALLOWED_ORIGINS || '').split(',').map((s) => s.trim())
  const corsMiddleware = cors({
    origin: (origin) => (allowed.includes(origin) ? origin : allowed[0] || ''),
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'x-notifhook-secret'],
  })
  return corsMiddleware(c, next)
})

app.get('/', (c) =>
  c.json({
    status: 'ok',
    service: 'irkop-api',
    registered_routes: REGISTERED_ROUTES,
  })
)

// Semua route project didaftarkan otomatis dari hasil scan
// src/modules/{project}/{module}.ts — lihat scripts/generate-routes.mjs
registerRoutes(app)

app.notFound((c) => c.json({ error: 'Not found' }, 404))

export default app

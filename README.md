# irkop-api

API multi-project untuk Irkop Cell, jalan di satu Cloudflare Worker
(`api.irkop.workers.dev`), tiap project punya D1 database sendiri.

## Cara kerja auto-routing

Route **tidak** didaftarkan manual di `src/index.ts`. Sebagai gantinya:

1. Setiap file di `src/modules/{project}/{module}.ts` otomatis jadi route
   `/v1/{project}/{module}`.
2. Script `scripts/generate-routes.mjs` scan folder itu dan generate
   `src/registry.generated.ts` (file ini otomatis dibuat ulang, jangan
   diedit manual, dan tidak ikut di-commit ke git).
3. Script ini jalan otomatis lewat npm hook `predev` / `prebuild` / `predeploy`
   — jadi setiap kali `npm run dev` atau `npm run deploy`, route selalu
   sinkron dengan isi folder `src/modules/`.

Yang **HARUS** diedit manual saat nambah project baru cuma **`wrangler.toml`**
(binding D1), karena itu batasan platform Cloudflare — binding wajib
didefinisikan saat deploy, tidak bisa dibuat dinamis di runtime.

## Keamanan

- **Login user (owner/staff)**: JWT, digenerate & diverifikasi sendiri oleh
  Worker ini (`hono/jwt`). User disimpan di tabel `users` per-project D1,
  password di-hash pakai PBKDF2 (`src/lib/password.ts`) — bukan plain text.
- **Route yang butuh login**: tinggal `.use('*', requireAuth)` di module-nya
  (lihat `pos.ts`, `kasbon.ts`, dll). Untuk role tertentu, tambah
  `.use('*', requireRole('owner'))` (contoh: `payroll.ts`).
- **Endpoint `/notifhook`** (dari app Android): bukan JWT, tapi secret key
  tetap di header `x-notifhook-secret`, dicocokkan ke `env.NOTIFHOOK_SECRET`.
- **CORS**: cuma origin yang terdaftar di `ALLOWED_ORIGINS` (wrangler.toml
  `[vars]`) yang boleh fetch API ini dari browser.
- **Secrets** (`JWT_SECRET`, `NOTIFHOOK_SECRET`) TIDAK boleh ditulis di
  `wrangler.toml` / kode / git. Simpan lewat:
  ```bash
  wrangler secret put JWT_SECRET
  wrangler secret put NOTIFHOOK_SECRET
  ```
  Untuk dev lokal, copy `.dev.vars.example` jadi `.dev.vars` (sudah masuk
  `.gitignore`, aman tidak ke-push ke GitHub) dan isi sendiri.

## Struktur database: migration vs seed vs data harian

Ini sering ketuker, jadi dipisah jelas:

| | Migration | Seed | Data harian |
|---|---|---|---|
| Isi | Perubahan **struktur** tabel (tambah kolom/tabel) | Data awal wajib (akun owner) + data contoh opsional | Transaksi, customer, dst — data asli |
| Folder | `migrations/{project}/` | `seed/` | — (masuk otomatis lewat API) |
| Kapan jalan | Tiap ada perubahan struktur | Sekali di awal setup | Otomatis tiap request POST/PUT dari app |
| Tercatat riwayat? | Ya (D1 catat migration mana yang sudah jalan, tidak akan dobel) | Tidak, jangan dijalankan berulang kali | - |

**Alur setup awal:**
```bash
npm run db:migrate:konter          # bikin struktur tabel (dari migrations/konter/)
npm run db:bootstrap:konter        # bikin akun owner pertama (WAJIB, sekali saja)
npm run db:seed:konter             # data contoh buat testing (OPSIONAL)
```

**Kalau nanti ada perubahan struktur** (misal nambah kolom `diskon` di tabel `products`):
```bash
npm run db:migrate:konter:new -- add_diskon_products
# edit file migrations/konter/000X_add_diskon_products.sql yang baru dibuat
npm run db:migrate:konter          # apply ke lokal
npm run db:migrate:konter:remote   # apply ke production
```

**Data yang terus bertambah** (transaksi baru, customer baru dari form frontend)
**TIDAK PERNAH** lewat seed atau migration — itu otomatis masuk ke D1 lewat
endpoint API (`POST /v1/konter/pos`, dst) begitu aplikasi dipakai sehari-hari.

## Setup awal

```bash
npm install
wrangler login
wrangler d1 create irkop-konter        # catat database_id yang muncul
```

Tempel `database_id` ke `wrangler.toml` (ganti `REPLACE_WITH_DATABASE_ID`).

Set secrets (lokal & production):

```bash
cp .dev.vars.example .dev.vars
# edit .dev.vars, isi JWT_SECRET & NOTIFHOOK_SECRET dengan string acak panjang

wrangler secret put JWT_SECRET          # untuk production
wrangler secret put NOTIFHOOK_SECRET    # untuk production
```

Pastikan tabel `users` sudah ada di schema D1-mu (lihat `migrations/konter/0001_create_users.sql`
kalau belum ada), lalu generate hash password untuk user pertama:

```bash
node scripts/hash-password.mjs "password-owner-kamu"
# copy hasil hash ke seed/01-bootstrap-owner.sql, kolom password_hash
```

## Jalankan lokal

```bash
npm run dev
```

Cek `http://localhost:8787/` — akan menampilkan daftar semua route yang
kegenerate otomatis (`registered_routes`).

## Deploy

```bash
git add .
git commit -m "deploy"
git push
npm run deploy
```

(`npm run deploy` otomatis generate ulang route sebelum `wrangler deploy`.)

## Seed data

```bash
npm run db:seed:konter          # ke database lokal
npm run db:seed:konter:remote   # ke database production
```

Sesuaikan dulu nama tabel/kolom di `seed/konter.sql` dengan schema D1
final-mu sebelum dijalankan.

## Nambah project baru (contoh: "listrik")

```bash
wrangler d1 create irkop-listrik
```

1. Tempel `database_id` hasil perintah di atas ke `wrangler.toml`:
   ```toml
   [[d1_databases]]
   binding = "DB_LISTRIK"
   database_name = "irkop-listrik"
   database_id = "..."
   ```
2. Buat folder `src/modules/listrik/` isi file module (`auth.ts`, `data.ts`, dst).
   Tiap module akses database lewat `c.env.DB_LISTRIK` (nama binding harus
   `DB_` + nama project huruf besar, konsisten dengan `wrangler.toml`).
3. **Tidak perlu edit `src/index.ts`** — route otomatis kegenerate saat
   `npm run dev` / `npm run deploy`.

## Struktur folder

```
src/
  index.ts                    # router utama, panggil registry auto-generated
  registry.generated.ts       # AUTO-GENERATED, jangan diedit, jangan di-commit
  modules/
    konter/
      auth.ts        -> /v1/konter/auth
      pos.ts         -> /v1/konter/pos
      kasbon.ts       -> /v1/konter/kasbon
      servis.ts       -> /v1/konter/servis
      notifhook.ts    -> /v1/konter/notifhook
      customers.ts    -> /v1/konter/customers
      products.ts     -> /v1/konter/products
      expenses.ts     -> /v1/konter/expenses
      payroll.ts      -> /v1/konter/payroll
      cashbook.ts     -> /v1/konter/cashbook
      reports.ts      -> /v1/konter/reports
scripts/
  generate-routes.mjs         # auto-scan folder modules, generate registry
seed/
  konter.sql                  # seed data (sesuaikan dengan schema asli)
```

# irkop-api

Gateway API tunggal untuk seluruh project IRKOP.

**Base URL (production):** `https://api.irkop.workers.dev/`

## Struktur Endpoint

### Auth (`/v1/auth`)
- `POST /v1/auth/login`
- `POST /v1/auth/logout`
- `POST /v1/auth/refresh`
- `GET /v1/auth/me`

### Konter (`/v1/konter`) — butuh auth
- `GET /v1/konter`
- `POST /v1/konter`
- `GET /v1/konter/{id}`
- `PUT /v1/konter/{id}`
- `DELETE /v1/konter/{id}`

### Transaksi (`/v1/transaksi`) — butuh auth
- `GET /v1/transaksi`
- `POST /v1/transaksi`
- `GET /v1/transaksi/{id}`

### Public (`/v1/public`) — tanpa auth
- `GET /v1/public/produk`
- `GET /v1/public/layanan`
- `POST /v1/public/contact`

## Database

Database D1: `irkop-api` (binding: `DB`)

Sesuai aturan: **1 project = 1 database**, nama database mengikuti nama project.

## Development

```bash
npm install
npm run dev
```

## Deploy

Alur wajib: **push ke GitHub dulu, baru deploy.**

```bash
git add .
git commit -m "init irkop-api"
git push origin main

npm run deploy
```

-- ============================================================
-- Tabel users - dibutuhkan untuk login (JWT).
-- Cek dulu apakah sudah ada di schema D1 final revisi 5-mu.
-- Kalau belum, tambahkan ke migration utama.
-- ============================================================

CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  username      TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT 'staff',  -- 'owner' | 'staff'
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  deleted_at    TEXT
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- ============================================================
-- Migration 0001: Tabel users (dibutuhkan untuk login/JWT)
-- Dijalankan lewat: wrangler d1 migrations apply irkop-konter --local
-- Kalau schema utama revisi 5-mu sudah punya tabel users dengan
-- struktur beda, sesuaikan file ini SEBELUM pertama kali di-apply.
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

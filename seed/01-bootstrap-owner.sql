-- ============================================================
-- WAJIB dijalankan sekali di awal - tanpa ini tidak ada akun
-- yang bisa dipakai login sama sekali.
--
-- Password default: admin123 - GANTI setelah login pertama kali.
-- Hash di bawah digenerate dari:
--   node scripts/hash-password.mjs "admin123"
-- Kalau mau password lain, generate ulang hash-nya dulu.
-- ============================================================

INSERT INTO users (id, username, password_hash, role, created_at) VALUES
  ('user_001', 'admin', '1ce14281c90a500ddaeee04678c29577:c26337b4f8f89bc74a98214d579d621ca66c175deef81a492d4cfa7203999ddf', 'owner', datetime('now'));

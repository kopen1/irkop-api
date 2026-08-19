-- ============================================================
-- SEED DATA - irkop-konter
-- Sesuaikan nama tabel & kolom dengan schema D1 final-mu.
-- Jalankan: wrangler d1 execute irkop-konter --file=./seed/konter.sql
-- Tambah --remote untuk seed ke database production.
-- ============================================================

-- User owner pertama. Password default: admin123
-- GANTI PASSWORD INI setelah login pertama kali!
-- Hash di bawah digenerate dari: node scripts/hash-password.mjs "admin123"
INSERT INTO users (id, username, password_hash, role, created_at) VALUES
  ('user_001', 'admin', '1ce14281c90a500ddaeee04678c29577:c26337b4f8f89bc74a98214d579d621ca66c175deef81a492d4cfa7203999ddf', 'owner', datetime('now'));

INSERT INTO customers (id, name, phone, created_at) VALUES
  ('cust_001', 'Budi Santoso', '081234567890', datetime('now')),
  ('cust_002', 'Siti Aminah', '081298765432', datetime('now'));

INSERT INTO products (id, name, category, price, stock, created_at) VALUES
  ('prod_001', 'Pulsa Telkomsel 10k', 'pulsa', 11000, 999, datetime('now')),
  ('prod_002', 'Token PLN 20k', 'ppob', 21500, 999, datetime('now')),
  ('prod_003', 'Kabel Data USB-C', 'aksesoris', 25000, 15, datetime('now'));

INSERT INTO servis_hp (id, customer_id, device, keluhan, status, created_at) VALUES
  ('srv_001', 'cust_001', 'iPhone 11', 'Ganti baterai', 'menunggu_part', datetime('now')),
  ('srv_002', 'cust_002', 'Samsung A32', 'Layar retak', 'dikerjakan', datetime('now'));

INSERT INTO kasbon (id, customer_id, jumlah, status, created_at) VALUES
  ('kasbon_001', 'cust_001', 50000, 'belum_lunas', datetime('now'));

INSERT INTO cash_sessions (id, session_date, opening_balance, status) VALUES
  ('cs_001', date('now'), 200000, 'open');

INSERT INTO expenses (id, kategori, jumlah, keterangan, created_at) VALUES
  ('exp_001', 'operasional', 15000, 'Beli galon air', datetime('now'));

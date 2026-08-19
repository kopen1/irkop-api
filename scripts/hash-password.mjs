// ============================================================
// Generate hash password buat seed user pertama (owner).
// Formatnya HARUS sama persis dengan src/lib/password.ts
// (PBKDF2-SHA256, 100000 iterasi) supaya bisa login.
//
// Pakai:
//   node scripts/hash-password.mjs "password-owner-kamu"
//
// Lalu copy hasilnya ke seed/konter.sql, kolom password_hash.
// ============================================================
import crypto from 'node:crypto'

const password = process.argv[2]
if (!password) {
  console.error('Pakai: node scripts/hash-password.mjs "password-kamu"')
  process.exit(1)
}

const ITERATIONS = 100_000
const salt = crypto.randomBytes(16)
const derived = crypto.pbkdf2Sync(password, salt, ITERATIONS, 32, 'sha256')

const hash = `${salt.toString('hex')}:${derived.toString('hex')}`
console.log('\nHash password (copy ke seed/konter.sql):\n')
console.log(hash)
console.log('')

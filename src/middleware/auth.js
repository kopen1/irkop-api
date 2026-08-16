/**
 * Middleware verifikasi token/session.
 * Ganti implementasi verifikasi sesuai metode auth yang dipakai
 * (JWT, session token di D1, dll).
 */
export async function verifyAuth(request, env) {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { valid: false };
  }

  const token = authHeader.replace("Bearer ", "");

  // TODO: ganti dengan verifikasi JWT asli, atau cek token di tabel sessions
  const { results } = await env.DB.prepare(
    "SELECT * FROM sessions WHERE token = ? AND expires_at > ?"
  )
    .bind(token, Date.now())
    .all();

  if (!results || results.length === 0) {
    return { valid: false };
  }

  return { valid: true, user: results[0] };
}

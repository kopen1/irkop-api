/**
 * Middleware verifikasi token/session untuk route yang butuh auth
 * (/v1/konter, /v1/transaksi). Cek tabel sessions di database irkop-api.
 */
export async function verifyAuth(request, env) {
  const authHeader = request.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { valid: false };
  }

  const token = authHeader.replace("Bearer ", "");

  const session = await env.DB.prepare(
    "SELECT * FROM sessions WHERE token = ? AND expires_at > ?"
  )
    .bind(token, Date.now())
    .first();

  if (!session) {
    return { valid: false };
  }

  const user = await env.DB.prepare(
    "SELECT id, username, role FROM users WHERE id = ?"
  )
    .bind(session.user_id)
    .first();

  if (!user) {
    return { valid: false };
  }

  return { valid: true, user };
}

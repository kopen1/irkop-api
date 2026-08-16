import { hashPassword, verifyPassword, generateToken } from "../utils/crypto.js";

const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 hari

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function getBearerToken(request) {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  return authHeader.replace("Bearer ", "");
}

export async function handleAuth(request, env, path) {
  // POST /v1/auth/login
  if (path === "/v1/auth/login" && request.method === "POST") {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return jsonResponse({ error: "username dan password wajib diisi" }, 400);
    }

    const user = await env.DB.prepare("SELECT * FROM users WHERE username = ?")
      .bind(username)
      .first();

    if (!user) {
      return jsonResponse({ error: "username atau password salah" }, 401);
    }

    const isValid = await verifyPassword(password, user.password_hash, user.salt);
    if (!isValid) {
      return jsonResponse({ error: "username atau password salah" }, 401);
    }

    const token = generateToken();
    const expiresAt = Date.now() + SESSION_TTL_MS;

    await env.DB.prepare(
      "INSERT INTO sessions (token, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)"
    )
      .bind(token, user.id, expiresAt, Date.now())
      .run();

    return jsonResponse({
      message: "login berhasil",
      token,
      user: { id: user.id, username: user.username, role: user.role },
    });
  }

  // POST /v1/auth/logout
  if (path === "/v1/auth/logout" && request.method === "POST") {
    const token = getBearerToken(request);
    if (!token) {
      return jsonResponse({ error: "token tidak ditemukan" }, 401);
    }

    await env.DB.prepare("DELETE FROM sessions WHERE token = ?").bind(token).run();
    return jsonResponse({ message: "logout berhasil" });
  }

  // POST /v1/auth/refresh
  if (path === "/v1/auth/refresh" && request.method === "POST") {
    const token = getBearerToken(request);
    if (!token) {
      return jsonResponse({ error: "token tidak ditemukan" }, 401);
    }

    const session = await env.DB.prepare(
      "SELECT * FROM sessions WHERE token = ? AND expires_at > ?"
    )
      .bind(token, Date.now())
      .first();

    if (!session) {
      return jsonResponse({ error: "session tidak valid atau kedaluwarsa" }, 401);
    }

    const newToken = generateToken();
    const expiresAt = Date.now() + SESSION_TTL_MS;

    await env.DB.prepare(
      "UPDATE sessions SET token = ?, expires_at = ? WHERE id = ?"
    )
      .bind(newToken, expiresAt, session.id)
      .run();

    return jsonResponse({ message: "refresh berhasil", token: newToken });
  }

  // GET /v1/auth/me
  if (path === "/v1/auth/me" && request.method === "GET") {
    const token = getBearerToken(request);
    if (!token) {
      return jsonResponse({ error: "token tidak ditemukan" }, 401);
    }

    const session = await env.DB.prepare(
      "SELECT * FROM sessions WHERE token = ? AND expires_at > ?"
    )
      .bind(token, Date.now())
      .first();

    if (!session) {
      return jsonResponse({ error: "session tidak valid atau kedaluwarsa" }, 401);
    }

    const user = await env.DB.prepare(
      "SELECT id, username, role, created_at FROM users WHERE id = ?"
    )
      .bind(session.user_id)
      .first();

    return jsonResponse({ user });
  }

  return jsonResponse({ error: "Not Found" }, 404);
}

// Diekspor supaya bisa dipakai untuk membuat user awal (lihat catatan di README)
export { hashPassword };

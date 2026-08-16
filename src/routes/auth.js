function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function handleAuth(request, env, path) {
  // POST /v1/auth/login
  if (path === "/v1/auth/login" && request.method === "POST") {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return jsonResponse({ error: "username dan password wajib diisi" }, 400);
    }

    // TODO: cek user di database, hash password, generate token
    // const user = await env.DB.prepare("SELECT * FROM users WHERE username = ?").bind(username).first();

    return jsonResponse({ message: "login berhasil (placeholder)", token: "TODO" });
  }

  // POST /v1/auth/logout
  if (path === "/v1/auth/logout" && request.method === "POST") {
    // TODO: hapus session/token dari DB
    return jsonResponse({ message: "logout berhasil (placeholder)" });
  }

  // POST /v1/auth/refresh
  if (path === "/v1/auth/refresh" && request.method === "POST") {
    // TODO: validasi refresh token, terbitkan token baru
    return jsonResponse({ message: "refresh berhasil (placeholder)", token: "TODO" });
  }

  // GET /v1/auth/me
  if (path === "/v1/auth/me" && request.method === "GET") {
    // TODO: ambil data user dari token yang sudah diverifikasi
    return jsonResponse({ message: "data user (placeholder)" });
  }

  return jsonResponse({ error: "Not Found" }, 404);
}

import { handleAuth } from "./routes/auth.js";
import { handleKonter } from "./routes/konter.js";
import { handleTransaksi } from "./routes/transaksi.js";
import { handlePublic } from "./routes/public.js";
import { verifyAuth } from "./middleware/auth.js";

/**
 * Gateway utama irkop-api
 * Base URL: https://api.irkop.workers.dev/
 *
 * Struktur route:
 *   /v1/auth/*        -> auth.js (login, logout, refresh, me)
 *   /v1/konter/*       -> konter.js (butuh auth)
 *   /v1/transaksi/*    -> transaksi.js (butuh auth)
 *   /v1/public/*        -> public.js (tanpa auth)
 */

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // Route publik, tidak butuh auth
      if (path.startsWith("/v1/public/")) {
        return await handlePublic(request, env, path);
      }

      if (path.startsWith("/v1/auth/")) {
        return await handleAuth(request, env, path);
      }

      // Route di bawah ini butuh auth
      if (path.startsWith("/v1/konter") || path.startsWith("/v1/transaksi")) {
        const authResult = await verifyAuth(request, env);
        if (!authResult.valid) {
          return jsonResponse({ error: "Unauthorized" }, 401);
        }
        request.user = authResult.user;

        if (path.startsWith("/v1/konter")) {
          return await handleKonter(request, env, path);
        }
        if (path.startsWith("/v1/transaksi")) {
          return await handleTransaksi(request, env, path);
        }
      }

      return jsonResponse({ error: "Not Found" }, 404);
    } catch (err) {
      return jsonResponse({ error: "Internal Server Error", detail: err.message }, 500);
    }
  },
};

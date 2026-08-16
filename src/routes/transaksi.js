function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function handleTransaksi(request, env, path) {
  const segments = path.split("/").filter(Boolean);
  const id = segments[2];

  // GET /v1/transaksi
  if (path === "/v1/transaksi" && request.method === "GET") {
    return jsonResponse({ message: "list transaksi (placeholder)", data: [] });
  }

  // POST /v1/transaksi
  if (path === "/v1/transaksi" && request.method === "POST") {
    const body = await request.json();
    return jsonResponse({ message: "transaksi dibuat (placeholder)", data: body }, 201);
  }

  // GET /v1/transaksi/{id}
  if (id && request.method === "GET") {
    return jsonResponse({ message: `detail transaksi ${id} (placeholder)` });
  }

  return jsonResponse({ error: "Not Found" }, 404);
}

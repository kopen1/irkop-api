function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function handleKonter(request, env, path) {
  const segments = path.split("/").filter(Boolean); // ["v1","konter", "{id}"?]
  const id = segments[2];

  // GET /v1/konter
  if (path === "/v1/konter" && request.method === "GET") {
    // TODO: query ke database konter (irkop-konter), bisa lewat proxy service binding
    return jsonResponse({ message: "list konter (placeholder)", data: [] });
  }

  // POST /v1/konter
  if (path === "/v1/konter" && request.method === "POST") {
    const body = await request.json();
    // TODO: insert konter baru
    return jsonResponse({ message: "konter dibuat (placeholder)", data: body }, 201);
  }

  // GET /v1/konter/{id}
  if (id && request.method === "GET") {
    return jsonResponse({ message: `detail konter ${id} (placeholder)` });
  }

  // PUT /v1/konter/{id}
  if (id && request.method === "PUT") {
    const body = await request.json();
    return jsonResponse({ message: `konter ${id} diupdate (placeholder)`, data: body });
  }

  // DELETE /v1/konter/{id}
  if (id && request.method === "DELETE") {
    return jsonResponse({ message: `konter ${id} dihapus (placeholder)` });
  }

  return jsonResponse({ error: "Not Found" }, 404);
}

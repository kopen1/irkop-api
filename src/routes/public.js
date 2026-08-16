function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function handlePublic(request, env, path) {
  // GET /v1/public/produk
  if (path === "/v1/public/produk" && request.method === "GET") {
    return jsonResponse({ message: "list produk (placeholder)", data: [] });
  }

  // GET /v1/public/layanan
  if (path === "/v1/public/layanan" && request.method === "GET") {
    return jsonResponse({ message: "list layanan (placeholder)", data: [] });
  }

  // POST /v1/public/contact
  if (path === "/v1/public/contact" && request.method === "POST") {
    const body = await request.json();
    // TODO: simpan pesan kontak / kirim notifikasi
    return jsonResponse({ message: "pesan diterima (placeholder)", data: body }, 201);
  }

  return jsonResponse({ error: "Not Found" }, 404);
}

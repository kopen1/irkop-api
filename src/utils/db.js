/**
 * Helper query ke database D1 (irkop-api).
 * Gunakan lewat env.DB (lihat binding di wrangler.toml).
 */

export async function queryAll(env, sql, params = []) {
  const stmt = env.DB.prepare(sql).bind(...params);
  const { results } = await stmt.all();
  return results;
}

export async function queryOne(env, sql, params = []) {
  const stmt = env.DB.prepare(sql).bind(...params);
  return await stmt.first();
}

export async function execute(env, sql, params = []) {
  const stmt = env.DB.prepare(sql).bind(...params);
  return await stmt.run();
}

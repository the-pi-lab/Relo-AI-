// Flow loading: cached for the webhook hot path (30s TTL — one cheap query
// serves thousands of events), fresh-by-id for the worker (jobs are rare,
// correctness beats caching there).
import { query } from "./db.js";

const CACHE_TTL_MS = 30_000;
let cache = { at: 0, flows: [] };

export async function refreshFlowCache() {
  const { rows } = await query(
    "SELECT * FROM flows WHERE is_active = TRUE ORDER BY created_at ASC"
  );
  cache = { at: Date.now(), flows: rows };
  return rows;
}

export async function getActiveFlows() {
  if (Date.now() - cache.at > CACHE_TTL_MS) {
    await refreshFlowCache();
  }
  return cache.flows;
}

export async function getFlowById(id) {
  const { rows } = await query("SELECT * FROM flows WHERE id = $1", [id]);
  return rows[0] || null;
}

export function invalidateFlowCache() {
  cache.at = 0;
}

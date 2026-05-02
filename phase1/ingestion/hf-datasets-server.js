import fs from "node:fs";
import path from "node:path";

const BASE_URL = "https://datasets-server.huggingface.co";

/**
 * @param {string} repoRoot
 * @param {string} datasetId
 * @returns {string}
 */
function cacheDir(repoRoot, datasetId) {
  const safe = datasetId.replaceAll("/", "__");
  return path.join(repoRoot, ".cache", "hf", safe);
}

/**
 * @param {string} repoRoot
 * @param {string} datasetId
 */
function ensureCacheDir(repoRoot, datasetId) {
  const dir = cacheDir(repoRoot, datasetId);
  fs.mkdirSync(dir, { recursive: true });
}

/**
 * @param {Response} res
 * @param {string} url
 */
async function assertOk(res, url) {
  if (res.ok) return;
  const text = await res.text().catch(() => "");
  throw new Error(`HTTP ${res.status} for ${url}\n${text}`);
}

/**
 * @param {number} ms
 */
async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

/**
 * Fetch with retries for transient errors (notably 429).
 *
 * @param {string} url
 * @param {RequestInit} init
 * @param {{ maxRetries?: number, baseDelayMs?: number }} [opts]
 */
async function fetchJsonWithRetry(url, init, opts = {}) {
  const maxRetries = opts.maxRetries ?? 8;
  const baseDelayMs = opts.baseDelayMs ?? 750;

  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    const res = await fetch(url, init);
    if (res.ok) return await res.json();

    // Rate limited (HF datasets-server returns HTML for 429)
    if (res.status === 429 && attempt < maxRetries) {
      const retryAfter = Number(res.headers.get("retry-after") ?? "");
      const backoff =
        Number.isFinite(retryAfter) && retryAfter > 0
          ? retryAfter * 1000
          : Math.min(60_000, baseDelayMs * 2 ** attempt);
      const jitter = Math.floor(Math.random() * 250);
      await sleep(backoff + jitter);
      continue;
    }

    // Other transient-ish errors
    if ([500, 502, 503, 504].includes(res.status) && attempt < maxRetries) {
      const backoff = Math.min(30_000, baseDelayMs * 2 ** attempt);
      const jitter = Math.floor(Math.random() * 250);
      await sleep(backoff + jitter);
      continue;
    }

    await assertOk(res, url);
  }

  throw new Error(`Exhausted retries for ${url}`);
}

/**
 * Returns available configs and splits for a dataset.
 * Endpoint: /splits?dataset={dataset}
 *
 * @param {{ datasetId: string }} args
 */
export async function fetchSplits({ datasetId }) {
  const url = `${BASE_URL}/splits?dataset=${encodeURIComponent(datasetId)}`;
  return await fetchJsonWithRetry(url, { method: "GET" });
}

/**
 * Fetch a slice of rows (length <= 100) from datasets-server.
 * Endpoint: /rows?dataset={dataset}&config={config}&split={split}&offset={offset}&length={length}
 *
 * @param {{
 *   datasetId: string,
 *   config: string,
 *   split: string,
 *   offset: number,
 *   length: number
 * }} args
 */
export async function fetchRowsSlice({ datasetId, config, split, offset, length }) {
  const url =
    `${BASE_URL}/rows?dataset=${encodeURIComponent(datasetId)}` +
    `&config=${encodeURIComponent(config)}` +
    `&split=${encodeURIComponent(split)}` +
    `&offset=${encodeURIComponent(String(offset))}` +
    `&length=${encodeURIComponent(String(length))}`;
  // Gentle throttle to reduce 429s (datasets-server can be strict).
  await sleep(175);
  return await fetchJsonWithRetry(url, { method: "GET" });
}

/**
 * Fetch dataset size metadata (includes split row counts).
 * Endpoint: /size?dataset={dataset}
 *
 * @param {{ datasetId: string }} args
 */
export async function fetchSize({ datasetId }) {
  const url = `${BASE_URL}/size?dataset=${encodeURIComponent(datasetId)}`;
  return await fetchJsonWithRetry(url, { method: "GET" });
}

/**
 * Get number of rows for a given config/split (best effort).
 *
 * @param {any} sizeJson
 * @param {{ config: string, split: string }} cfg
 * @returns {number|null}
 */
export function getNumRowsForSplit(sizeJson, { config, split }) {
  const splits = Array.isArray(sizeJson?.size?.splits) ? sizeJson.size.splits : [];
  const hit = splits.find((s) => s?.config === config && s?.split === split);
  const n = hit?.num_rows;
  return typeof n === "number" && Number.isFinite(n) ? n : null;
}

/**
 * Cached fetch of a rows slice (json) to speed iteration.
 *
 * @param {{
 *   repoRoot: string,
 *   datasetId: string,
 *   config: string,
 *   split: string,
 *   offset: number,
 *   length: number
 * }} args
 */
export async function fetchRowsSliceCached({
  repoRoot,
  datasetId,
  config,
  split,
  offset,
  length,
}) {
  ensureCacheDir(repoRoot, datasetId);
  const fname = `rows_${config}__${split}__${offset}__${length}.json`;
  const fpath = path.join(cacheDir(repoRoot, datasetId), fname);
  if (fs.existsSync(fpath)) {
    return JSON.parse(fs.readFileSync(fpath, "utf8"));
  }
  const data = await fetchRowsSlice({ datasetId, config, split, offset, length });
  fs.writeFileSync(fpath, JSON.stringify(data, null, 2), "utf8");
  return data;
}

/**
 * Pick a reasonable default config/split from /splits response.
 *
 * @param {any} splitsJson
 * @returns {{ config: string, split: string }}
 */
export function pickDefaultConfigSplit(splitsJson) {
  const configs = splitsJson?.splits?.map((s) => s.config) ?? [];
  const uniqueConfigs = Array.from(new Set(configs));
  const config = uniqueConfigs.includes("default") ? "default" : uniqueConfigs[0];

  const splitsForConfig =
    splitsJson?.splits?.filter((s) => s.config === config).map((s) => s.split) ?? [];
  const uniqueSplits = Array.from(new Set(splitsForConfig));
  const split = uniqueSplits.includes("train")
    ? "train"
    : uniqueSplits.includes("validation")
      ? "validation"
      : uniqueSplits[0];

  if (!config || !split) {
    throw new Error("Could not determine dataset config/split from /splits response.");
  }
  return { config, split };
}


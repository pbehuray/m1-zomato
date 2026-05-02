import path from "node:path";
import {
  fetchSize,
  fetchSplits,
  fetchRowsSliceCached,
  getNumRowsForSplit,
  pickDefaultConfigSplit,
} from "./hf-datasets-server.js";
import { rowToRestaurant } from "./restaurant.js";

/**
 * Load and normalize restaurants from the HF dataset via datasets-server.
 *
 * @param {{
 *   repoRoot: string,
 *   datasetId: string,
 *   config?: string,
 *   split?: string,
 *   limit?: number,
 *   pageSize?: number
 * }} args
 */
export async function loadRestaurants({
  repoRoot,
  datasetId,
  config,
  split,
  limit = 100,
  pageSize = 100,
}) {
  const splitsJson = await fetchSplits({ datasetId });
  const picked = pickDefaultConfigSplit(splitsJson);
  const effectiveConfig = config || picked.config;
  const effectiveSplit = split || picked.split;

  let effectiveLimit = limit;
  if (limit === Infinity) {
    const sizeJson = await fetchSize({ datasetId });
    const n = getNumRowsForSplit(sizeJson, {
      config: effectiveConfig,
      split: effectiveSplit,
    });
    if (n == null) {
      throw new Error(
        "Could not determine total row count for --all mode. Try using a numeric --limit.",
      );
    }
    effectiveLimit = n;
  }

  const restaurants = [];
  const seen = new Set();
  const max = Math.max(0, effectiveLimit);
  const pageLen = Math.min(100, Math.max(1, pageSize));

  for (let offset = 0; restaurants.length < max; offset += pageLen) {
    const slice = await fetchRowsSliceCached({
      repoRoot,
      datasetId,
      config: effectiveConfig,
      split: effectiveSplit,
      offset,
      length: Math.min(pageLen, max - restaurants.length),
    });

    const rows = Array.isArray(slice?.rows) ? slice.rows : [];
    if (rows.length === 0) break;

    for (const r of rows) {
      const rowObj = r?.row && typeof r.row === "object" ? r.row : null;
      if (!rowObj) continue;
      const restaurant = rowToRestaurant(rowObj, datasetId);
      if (!restaurant) continue;
      if (seen.has(restaurant.id)) continue;
      seen.add(restaurant.id);
      restaurants.push(restaurant);
      if (restaurants.length >= max) break;
    }

    // If we get fewer rows than requested, we likely reached the end.
    if (rows.length < pageLen) break;
  }

  return {
    datasetId,
    config: effectiveConfig,
    split: effectiveSplit,
    restaurants,
    cachePath: path.join(".cache", "hf", datasetId.replaceAll("/", "__")),
    requestedRows: max,
  };
}


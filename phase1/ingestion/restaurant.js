/**
 * Canonical restaurant model for Milestone 1.
 *
 * @typedef {Object} Restaurant
 * @property {string} id
 * @property {string} name
 * @property {string|null} location
 * @property {string[]} cuisines
 * @property {number|null} cost
 * @property {number|null} rating
 * @property {Record<string, unknown>} raw  // original row fields (useful for prompting later)
 */

/**
 * @param {string} input
 * @returns {string}
 */
export function normalizeText(input) {
  return String(input ?? "")
    .trim()
    .replace(/\s+/g, " ");
}

/**
 * @param {unknown} value
 * @returns {number|null}
 */
export function parseRating(value) {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const s = normalizeText(String(value));
  if (!s) return null;
  // examples: "4.2", "4.2/5", "NEW", "—"
  const m = s.match(/(\d+(\.\d+)?)/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

/**
 * @param {unknown} value
 * @returns {number|null}
 */
export function parseCost(value) {
  if (value == null) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const s = normalizeText(String(value));
  if (!s) return null;
  // examples: "₹500 for two", "500", "500–800"
  const m = s.match(/(\d{2,7})/);
  if (!m) return null;
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

/**
 * @param {unknown} value
 * @returns {string[]}
 */
export function parseCuisines(value) {
  if (value == null) return [];
  if (Array.isArray(value)) {
    return value.map((v) => normalizeText(String(v))).filter(Boolean);
  }
  const s = normalizeText(String(value));
  if (!s) return [];
  // examples: "Italian, Pizza"
  return s
    .split(",")
    .map((x) => normalizeText(x))
    .filter(Boolean);
}

/**
 * Deterministic small hash for stable IDs (not cryptographic).
 * @param {string} s
 * @returns {string}
 */
export function stableIdFromString(s) {
  let h = 5381;
  for (let i = 0; i < s.length; i += 1) h = ((h << 5) + h) ^ s.charCodeAt(i);
  // unsigned 32-bit
  return (h >>> 0).toString(16);
}

/**
 * @param {Record<string, unknown>} row
 * @param {string} datasetId
 * @returns {Restaurant|null}
 */
export function rowToRestaurant(row, datasetId) {
  const pick = (keys) => {
    for (const k of keys) {
      if (k in row && row[k] != null && String(row[k]).trim() !== "") return row[k];
    }
    return null;
  };

  const name = normalizeText(
    pick(["name", "restaurant_name", "Restaurant Name", "Name"]) ?? "",
  );
  if (!name) return null;

  const locationRaw = pick(["location", "city", "City", "listed_in(city)", "Locality"]);
  const location = locationRaw == null ? null : normalizeText(String(locationRaw));

  const cuisines = parseCuisines(pick(["cuisines", "Cuisine", "Cuisines"]));
  const cost = parseCost(
    pick([
      "cost",
      "approx_cost(for two people)",
      "approx_cost_for_two",
      "price_range",
      "Price Range",
    ]),
  );
  const rating = parseRating(pick(["rating", "rate", "Rating", "Rate"]));

  const idSeed = `${datasetId}::${name.toLowerCase()}::${(location ?? "").toLowerCase()}`;
  const id = stableIdFromString(idSeed);

  return {
    id,
    name,
    location,
    cuisines,
    cost,
    rating,
    raw: row,
  };
}


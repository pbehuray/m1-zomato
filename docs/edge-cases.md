## Edge cases: AI-Powered Restaurant Recommendation System

This document lists detailed edge cases to consider while implementing the system described in `docs/problemstatement.md` and the phases in `docs/phase-wise-architecture.md`.

---

## Phase 0 — Scope and foundations

### Requirements / documentation
- **Ambiguous “budget” definition**: dataset has numeric cost for two, price range, currency, or missing cost; “low/medium/high” must be defined and documented.
- **Ambiguous “location” definition**: dataset uses city vs locality vs address; user enters “Bangalore” but rows contain “Bengaluru” / “Bangalore Urban”.
- **Cuisine taxonomy mismatch**: dataset cuisine values differ from what users type (e.g., “North Indian” vs “Indian”).
- **Provider assumptions**: docs say “LLM” but provider/model not fixed; ensure configuration supports swapping providers without code changes.
- **Secrets handling**: app runs without `.env` but should not crash; show actionable message (“set API key”) and still allow deterministic fallback.
- **Reproducibility**: dataset changes upstream; pin a dataset revision and record it in `dataset-contract.md`.

---

## Phase 1 — Data ingestion and canonical model

### Dataset access / acquisition
- **No internet / Hugging Face blocked**: dataset download fails; must show error + suggest offline cache path.
- **Rate limiting / transient network errors**: retries/backoff needed; avoid partial corrupted cache.
- **Dataset schema changes**: columns renamed/added/removed; fail fast with a clear schema assertion error.
- **Different splits / subsets**: dataset exposes `train/test` or a single split; ingestion must handle whichever exists.

### Parsing / normalization
- **Missing values**: null/empty strings for rating, cuisines, cost, location; decide whether to drop rows or impute defaults.
- **Non-numeric ratings**: strings like `"NEW"`, `"—"`, `"4.5/5"`; handle parsing and define unknown rating behavior.
- **Out-of-range ratings**: negative values, > 5, or inconsistent scales (e.g., 0–10); clamp vs discard vs rescale must be specified.
- **Cost format variance**: currency symbols, commas, ranges (“₹500–₹800”), “for two”, or per-person cost; normalize to comparable representation.
- **Cuisine field shape**: single string with commas, list-like string, multiple cuisines; normalize to a list of trimmed tokens.
- **Duplicate restaurants**: same name/location appears multiple times; define dedupe key and keep best row (highest rating, most complete fields).
- **Unicode / encoding**: restaurant names with accents or non-Latin scripts; ensure ingestion preserves characters.
- **Whitespace / casing**: “ Delhi ” vs “delhi”; normalize for matching but preserve original for display.

### Canonical model integrity
- **Restaurant identifier**: dataset lacks stable IDs; generate deterministic IDs (e.g., hash of normalized name+location) and avoid collisions.
- **Partial records**: restaurant has name but no location/cuisine; decide if it can ever be recommended.
- **Large dataset memory**: loading entire dataset may be heavy; consider streaming, indexing, or caching filtered views.

---

## Phase 2 — User preferences and validation

### Input shape and UX
- **Empty form submission**: user provides nothing; decide defaults (e.g., no hard filters, only top-rated overall) vs require location.
- **Whitespace-only / emoji / special characters**: “   ” or “🍕”; sanitize and validate.
- **Case-insensitive matching**: “delhi” should match “Delhi”.
- **Spelling variations**: “Bangaluru” / “Bengaluru”; decide whether to do fuzzy matching or show suggestions.
- **Multiple cuisines**: user selects “Italian, Chinese” (AND) vs (OR); define semantics.
- **Conflicting constraints**: budget=low but minimum rating=4.8 in a small city → likely no matches; ensure helpful messaging.
- **Minimum rating edge**: rating exactly at threshold; inclusive vs exclusive.
- **Rating not provided**: treat as no rating filter rather than defaulting to 0 in a way that changes ranking unexpectedly.
- **Budget input mismatch**: user enters a number but system expects low/medium/high; support both or validate clearly.
- **Additional preferences free text**: extremely long input; limit length and strip unsafe content (prompt injection risk).

### Validation correctness
- **Unknown location**: decide behavior:
  - hard error and suggest known cities, or
  - allow it and fall back to broader match.
- **Unknown cuisine**: show closest matches from dataset cuisine set.
- **Internationalization**: users may enter currency in USD while dataset is INR; avoid misleading cost comparisons.

---

## Phase 3 — Integration layer (filtering + prompt assembly)

### Filtering behavior
- **No matches after hard filters**: return an empty candidate list with a helpful reason breakdown (which filter eliminated results).
- **Too many matches**: candidate cap reached; ensure selection is stable (deterministic sort) to avoid flickering results.
- **Borderline filters**: min_rating=0 or budget unspecified; ensure filter logic doesn’t accidentally exclude all.
- **Cuisine overlap logic**:
  - dataset has “Italian, Pizza” and user wants “Italian” → should match
  - user wants “Italian + Vegan” → decide AND vs OR; document
- **Location matching granularity**: city vs neighborhood; “Delhi” should include “New Delhi” if desired.
- **Sort stability**: ties on rating/cost; define tie-breakers (e.g., more reviews if available, then alphabetical).
- **Missing fields in candidates**: if cost is missing, do you allow it when user specified budget? likely exclude or treat as “unknown”.

### Prompt assembly / context limits
- **Context overflow**: too many candidates or large fields cause prompt > model limits; truncate fields and enforce hard cap.
- **Inconsistent candidate formatting**: JSON vs markdown; ensure one consistent schema to simplify parsing and reduce LLM errors.
- **Prompt injection from dataset**: restaurant names/descriptions could contain malicious strings; escape or sanitize before inserting into prompt.
- **Prompt injection from user text**: additional preferences tries to override system rules (“ignore the list”); keep strict system instructions and treat user text as untrusted.
- **Grounding enforcement**: candidate list must include stable IDs and names; prompt must instruct “only recommend from candidates”.

---

## Phase 4 — Recommendation engine (LLM)

### API / runtime failures
- **Missing API key**: return deterministic ranking fallback and an actionable message.
- **Provider outage / timeouts**: retry with backoff; after N retries fall back.
- **Rate limits**: detect 429 and backoff; avoid hammering provider.
- **Invalid configuration**: model name unsupported; fail clearly.

### Model behavior and safety
- **Hallucinated restaurants**: model suggests places not in candidate list; parser must reject or map only valid IDs.
- **Violates output schema**: returns prose instead of JSON; recover by re-asking once or using a robust extractor, else fall back.
- **Partial JSON**: truncated output; detect and retry with smaller max tokens or fewer candidates.
- **Duplicate recommendations**: same restaurant appears twice; dedupe and re-rank.
- **Low-quality explanations**: generic text (“great food”); enforce explanation rubric in prompt (must reference matching preference fields).
- **Overconfident claims**: model claims “family-friendly” when dataset doesn’t contain it; prompt must forbid unsupported attributes.
- **Ranking inconsistency**: model ignores min rating/budget; prompt must restate hard constraints and candidates already filtered accordingly.

### Parsing and validation
- **Unknown IDs**: model outputs an ID not in candidates; drop it and continue, or treat as error.
- **Wrong types**: rank is string, explanation null; validate and coerce if safe.
- **Unstable ordering**: if rank fields missing, preserve output order as implicit ranking.

---

## Phase 5 — Output display and UX

### Result rendering
- **Missing fields**: cost/rating/cuisine not available; show “Unknown” instead of blank/NaN.
- **Long names/explanations**: overflow UI; truncate with “read more”.
- **Sorting mismatch**: UI shows in a different order than the returned rank; ensure rank drives display.
- **Unit/currency confusion**: show currency symbol/units only if known; avoid implying a specific currency if not.

### Empty and error states
- **No matches**: provide next steps (relax filters, lower rating, broaden location).
- **LLM fallback used**: disclose lightly (“AI unavailable; showing best matches by rating”) and still provide helpful reasons.
- **Validation error display**: highlight exact field and allowable values.

### Performance
- **Slow first load**: dataset ingestion takes time; add loading state and optionally cache.
- **Repeated queries**: same preferences repeated; cache deterministic filter results and/or LLM responses if appropriate.

---

## Phase 6 — Hardening and handoff

### Testing edge cases
- **Determinism**: filtering should be deterministic; tests should not flake due to random ordering.
- **Golden fixtures for LLM parsing**: include:
  - perfect JSON
  - JSON with extra fields
  - prose response
  - truncated JSON
  - hallucinated restaurant entries
- **Schema regression tests**: fail when dataset schema changes (and explain what changed).

### Operational concerns
- **Logging**: ensure logs do not include API keys or full user free-text if it could contain sensitive info.
- **Token/cost runaway**: candidate cap + prompt size guardrails; surface token usage for debugging.
- **Cache invalidation**: if dataset revision changes, invalidate caches built from old revision.


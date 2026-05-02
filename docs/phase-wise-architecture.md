## Phase-wise architecture: Restaurant Recommendation System

This document breaks implementation into phases aligned with the workflow in `problemstatement.md`:
**data ingestion → user input → filtering + prompt preparation → LLM recommendation → output display**.

---

## Phase 0 — Scope and foundations

### Goal
Agree on a thin, demoable product slice for Milestone 1 and establish project foundations.

### Key decisions / components
- **Product slice**: Basic web UI for user input and results. Keep a CLI for development/diagnostics.
- **Stack**: language/runtime, dependency management, and where secrets live (use `.env`; never commit secrets).
- **Dataset contract**: confirm which dataset fields are supported in v1; document column → internal field mapping.
- **Non-goals**: explicitly defer items to avoid scope creep (e.g., user accounts, live Zomato API, maps).

### Deliverables
- `docs/phase0-scope.md`
- `docs/dataset-contract.md`
- `README.md`
- `.env.example`
- CLI commands (examples): `milestone1 info`, `milestone1 doctor`

### Exit criteria
- Written assumptions for stack, v1 UI, and supported preference fields
- A local run path exists (even if later phases are stubbed) to execute the app end-to-end once implemented

---

## Phase 1 — Data ingestion and canonical model

### Goal
Load the dataset reliably and expose a clean, typed internal representation.

### Key components
- **Acquisition**: download/stream `ManikaSaini/zomato-restaurant-recommendation`; cache locally if it speeds iteration.
- **Normalization**: fix types (e.g., rating as number, cost as numeric band/enum), handle missing values, dedupe if needed.
- **Canonical schema**: an internal `Restaurant` model containing (at minimum) name, location, cuisines, cost, rating, plus any fields needed for prompting.

### Deliverables
- `src/milestone1/ingestion/`
  - `Restaurant` model
  - `load_restaurants` / `iter_restaurants`
  - normalization + schema assertions
  - (optional) pin dataset revision for reproducibility
- CLI smoke test: `milestone1 ingest-smoke --limit N`
- Integration tests (optional): run only when enabled (e.g., `RUN_HF_INTEGRATION=1`)

### Exit criteria
- One module/package can load and return a typed in-memory collection or queryable table
- Unit tests validate parsing/normalization on a few representative rows

---

## Phase 2 — User preferences and validation

### Goal
Define a single preference object used consistently by both UI and backend/CLI.

### Key components
- **Preference model**: location, budget band, cuisine(s), minimum rating; optional free-text for additional preferences.
- **Validation**: reject or coerce invalid input (e.g., unknown location, rating out of range) with clear user-facing errors.

### Deliverables
- `src/milestone1/preferences/`
  - `UserPreferences`
  - `preferences_from_mapping` (from form/API/CLI args)
  - optional helpers: `allowed_cities_from_restaurants` / city-corpus checks
- CLI parser: `milestone1 prefs-parse ...` (prints JSON or validation errors)

### Exit criteria
- Preferences deserialize into one object used by the filter layer
- Validation errors are visible and understandable in both UI and CLI

---

## Phase 3 — Integration layer (retrieval + prompt assembly)

### Goal
Deterministically shortlist candidates and generate an LLM-ready prompt payload.

### Key components
- **Hard filters**: apply constraints first (location, min rating, budget, cuisine overlap).
- **Candidate cap**: limit results for context size (e.g., top 15–50).
- **Ranking hint (optional)**: pre-sort by rating or a composite score so the LLM sees a sensible order.
- **Prompt builder**: include preferences (JSON or bullets), candidate list (JSON/markdown table), and instructions to recommend only from the list; define output format (Phase 4).

### Deliverables
- A function/module that returns `(candidates[], prompt_payload)` without calling the LLM
- Tests for edge cases (no matches, too many matches, borderline filters)

### Exit criteria
- Given preferences + dataset, the shortlist and prompt payload are stable and reproducible

---

## Phase 4 — Recommendation engine (LLM)

### Goal
Call the LLM to rank candidates and produce grounded explanations with robust parsing/fallbacks.

### Key components
- **Model I/O**: thin client with temperature/max tokens/timeouts; API key from environment.
- **Grounding**: force recommendations to reference only restaurants from the candidate list.
- **Structured output**: request JSON (e.g., `rankings[]` with `restaurant_id`, `rank`, `explanation`) or strict markdown; parse + validate.
- **Resilience**: retries on transient errors; fallback to deterministic top-k with templated explanations if LLM fails.

### Deliverables
- End-to-end call returning ranked items + explanations
- Parser/validator for the chosen response format

### Exit criteria
- Failures degrade gracefully (no crashes; clear message; reasonable fallback behavior)

---

## Phase 5 — Output and experience

### Goal
Present results cleanly and handle empty/error states well.

### Key components
- **Rendering**: for each recommendation show name, cuisine, rating, estimated cost/price range, AI explanation.
- **Empty states**: distinguish “no matches after filters” vs “LLM could not justify picks”.
- **Observability (light)**: log latency, filter counts, and token usage (if available). Avoid logging sensitive data.

### Deliverables
- UI page/view that takes preferences → shows ranked recommendations
- Copy and layout that match the minimum fields in the problem statement

### Exit criteria
- A complete demo path from user input to readable results in a single run

---

## Phase 6 — Backend (HTTP API)

### Concern
Thin HTTP service that owns server-side secrets (GROQ_API_KEY), dataset access, and orchestration. The browser must not call Groq or Hugging Face directly.

### Approach
Python-first using FastAPI for robust API development with automatic documentation and type safety.

### Contract
Stable JSON request/response for "recommend": preferences body aligned with Phase 2 keys; response carries ranked items (ids + display fields + explanations), source (llm / fallback / no_candidates), filter/candidate counts, and optional non-sensitive telemetry fields for the UI.

### Endpoints (v1 intent)
- **POST /api/v1/recommendations** — validate input, run load_restaurants (with limits/caching policy), recommend_with_groq, return DTOs
- **GET /health** — process up, keys configured (without exposing values)
- **GET /api/v1/meta** — e.g. sample allowed_cities cap for form hints

### Cross-cutting
- Timeouts aligned with Phase 4
- Structured server logs (counts, latency, token totals—no raw user notes in info-level logs unless explicitly chosen)
- CORS restricted to the dev frontend origin
- Request size limits on free-text fields (reuse Phase 2 max length)

### Stack
FastAPI in `src/milestone1/api/` sharing the installed milestone1 library.

### Exit criteria
Frontend can complete one recommendation flow using only the API; API returns the same logical outcomes as milestone1 recommend / recommend-run for the same inputs (modulo caching).

---

## Phase 7 — Frontend (web UI)

### Concern
Primary user-facing surface: preference form + results list, per phase0-scope.md.

### Data flow
Browser only talks to the Phase 6 API. Map form fields to the API JSON schema (location, budget band, cuisines, minimum rating, optional additional text).

### UI
Results show name, cuisines, rating, estimated cost, AI explanation for each row; reuse Phase 5 empty-state semantics ("no filter match" vs "model returned no grounded picks") with clear, distinct copy.

### UX
Loading states, validation errors inline, disabled submit while pending; optional "copy as Markdown" for demo.

### Stack
React + Vite (SPA) hosted locally for milestone 1; no production SLA required in Phase 0.

### Exit criteria
One demo path in the README: start API + UI, submit preferences, see ranked results or an intentional empty state.

---

## Phase 8 — Deployment using Streamlit (optional)

### Concern
A single-process Python app (Streamlit) that exposes the same recommendation flow as the CLI/API: preferences in widgets → load corpus (Phase 1) → validate (Phase 2) → filter + prompt (Phase 3) → recommend_with_groq (Phase 4) → render ranked cards with explanations (Phase 5 semantics). No Node build and no separate SPA host required for this path.

### Secrets
GROQ_API_KEY (and optional GROQ_MODEL) via Streamlit secrets (st.secrets) on Streamlit Community Cloud or via environment variables when self-hosting—same rules as Phase 6: keys never ship to the browser client bundle; Streamlit runs logic server-side.

### Deployment (free tier)
Streamlit Community Cloud: connect the GitHub repo, set the main file path, add secrets in the dashboard, deploy. Cold starts and resource limits apply on the free tier; keep load_limit / candidate_cap conservative.

### Relationship to Phase 6–7
Complementary: Phase 7 remains the primary product UI (browser + REST). Phase 8 is ideal for course demos, stakeholder previews, and fast sharing without operating Vite + CORS + two deployables.

### UX scope
Forms with st.selectbox / st.text_input / st.slider for location, cuisines, budget, minimum rating, and additional text; st.spinner while the model runs; st.expander for raw JSON or telemetry if useful.

### Exit criteria
README documents how to run locally and deploy to Community Cloud; a reviewer can open the hosted URL and complete one successful recommendation or see an intentional empty state.

---

## Phase 10 — Streamlit Cloud Deployment (Recommended Free Path)

### Goal
Deploy the entire restaurant recommendation system as a single, shareable Streamlit app with zero backend/frontend separation complexity.

### Why Streamlit for deployment
- **Single-file deployment**: No need to manage separate frontend (Vite/React) and backend (Node/FastAPI) services
- **Free hosting**: Streamlit Community Cloud offers unlimited public apps with GitHub integration
- **Server-side secrets**: `st.secrets` keeps `GROQ_API_KEY` secure; never exposed to browser
- **No CORS/proxy issues**: All logic runs server-side; no cross-origin configuration needed

### Architecture
```
streamlit_app.py (main entry)
├── st.form → collect user preferences
├── import milestone1 library → reuse Phase 1–4 logic
├── st.spinner → show "Finding restaurants..." during LLM call
├── st.metric / st.expander → show filter counts, latency, token usage
└── st.container / st.columns → render recommendation cards
```

### Deployment steps
1. Ensure `streamlit_app.py` is at repo root (or configure `main_file` in Community Cloud)
2. Add `.streamlit/secrets.toml` locally (gitignored) with `GROQ_API_KEY = "..."`
3. Push to GitHub
4. Go to [share.streamlit.io](https://share.streamlit.io) → Deploy → Select repo → Set main file
5. Add `GROQ_API_KEY` in the Streamlit Cloud dashboard under Secrets
6. App auto-deploys on every push to `main`

### Performance considerations
- **Cold starts**: Community Cloud free tier sleeps after inactivity (~30s wake-up)
- **Resource limits**: Keep `load_limit` ≤ 200 restaurants and `maxRecommendations` ≤ 5 to stay within memory/time limits
- **Caching**: Use `@st.cache_data` or `@st.cache_resource` for `load_restaurants()` to avoid re-downloading the dataset on every interaction

### Fallback for private datasets / larger scale
If the free tier is too restrictive:
- **Streamlit Self-hosted**: Run `streamlit run streamlit_app.py` on any VPS (Railway, Fly.io, AWS free tier)
- **Docker**: Containerize with `python:3.11-slim` + `requirements.txt`; deploy to Render or Fly.io

### Exit criteria
- Public URL works without local setup
- A reviewer can open the URL, submit preferences, and see AI recommendations within 30 seconds
- Secrets are managed via Streamlit Cloud dashboard, not hardcoded

---

## Phase 9 — Hardening and handoff (optional but recommended)

- Automated tests for filters, prompt shape, JSON parsing (fixtures with fake LLM responses), and API contract tests (golden JSON for happy/empty/error paths)
- README: install, set GROQ_API_KEY, run API + UI, CLI fallbacks, and limitations (dataset revision, rate limits, candidate cap)
- Cost/latency notes: candidate cap, model id, when to raise load limits, caching strategy for repeated queries
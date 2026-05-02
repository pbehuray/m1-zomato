## Phase 0 Scope (Milestone 1)

### Goal
Ship a thin but complete demo slice of a Zomato-inspired restaurant recommender, with a clear contract for data + preferences and a runnable local path.

### In-scope (Milestone 1)
- **User experience**: a basic web UI is the primary source of user input (preferences) and the main surface for displaying recommendations.
- **Data source**: a single Hugging Face dataset (see `docs/dataset-contract.md`).
- **Filtering + LLM**: shortlist candidates deterministically, then use an LLM to rank and explain (LLM integration arrives in later phases).
- **Developer tooling**: a CLI is kept for sanity checks and diagnostics (not the primary user experience).

### Non-goals (explicitly deferred)
- User accounts / profiles / authentication
- Live Zomato API integration
- Maps, routing, distance-based ranking
- Real-time availability, reservations, delivery ETA
- Payments, order flow

### Assumptions (v1)
- Preferences include: location, budget band, cuisine(s), minimum rating, plus optional free-text.
- Recommendations must be grounded strictly in the dataset (no invented restaurants/attributes).

### Acceptance criteria for Phase 0
- `docs/phase0-scope.md` and `docs/dataset-contract.md` exist and are consistent with `docs/problemstatement.md`.
- A secrets template exists (`.env.example`) and secrets are not required to run Phase 0.
- A local runnable CLI exists:
  - `milestone1 info`
  - `milestone1 doctor`


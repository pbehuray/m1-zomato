## Phase 1 (separate folder): Data ingestion + canonical model

This folder implements **Phase 1** from `docs/phase-wise-architecture.md`.

### What’s included
- `phase1/ingestion/`: fetches dataset rows from Hugging Face datasets-server, normalizes them into a canonical `Restaurant` model.
- Caching of fetched row slices under `.cache/` (created at runtime).

### CLI
Run from repo root:

```bash
node phase0/cli/milestone1.js ingest-smoke --limit 10
```


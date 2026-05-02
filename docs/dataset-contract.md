## Dataset contract (v1)

### Dataset source
- **Hugging Face dataset**: `ManikaSaini/zomato-restaurant-recommendation`
- **Reference link**: `https://huggingface.co/datasets/ManikaSaini/zomato-restaurant-recommendation`

### Purpose
This dataset is the **source of truth** for restaurant candidates. The system must only recommend restaurants that exist in the dataset rows used for retrieval.

### Required canonical fields (minimum)
The ingestion layer must produce an internal `Restaurant` record with these minimum fields (when available in the dataset):

- **name**: restaurant name (string)
- **location**: city / locality (string)
- **cuisines**: list of cuisines (string[])
- **cost**: normalized cost representation (number band or enum; document mapping)
- **rating**: numeric rating (number; define handling of unknown/non-numeric values)

### Notes / open items
- **Schema verification**: when Phase 1 is implemented, record the exact dataset columns used and how each maps into the canonical model.
- **Revision pinning**: optionally pin a dataset revision for reproducibility (store in `.env` via `HF_DATASET_REVISION`).


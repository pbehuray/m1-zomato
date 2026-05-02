## Phase 3: Integration layer (retrieval + prompt assembly)

This folder implements **Phase 3** from `docs/phase-wise-architecture.md`.

### What's included
- `phase3/integration/`: Complete integration layer with filtering, ranking, and prompt building
- Hard filters for location, rating, budget, and cuisine preferences
- Candidate ranking with composite scoring
- LLM-ready prompt payload generation
- CLI integration for testing

### Key components

#### Hard filters
- **Location filter**: Exact match or contains matching for city/locality
- **Rating filter**: Restaurants must meet minimum rating requirement
- **Budget filter**: Cost must fall within specified budget band
- **Cuisine filter**: At least one cuisine must match user preferences

#### Ranking system
- **Composite scoring**: Weighted scoring based on rating (40%), cost (20%), cuisine overlap (25%), location (15%)
- **Sorting options**: By rating, cost, or composite score
- **Candidate capping**: Configurable limits (15-50 candidates by default)

#### Prompt builder
- **System prompts**: Clear instructions for LLM with output format definitions
- **User prompts**: Formatted preferences and candidate data
- **Format options**: JSON or markdown output
- **Validation**: Ensures prompt payload structure is correct

### CLI

Run from repo root:

```bash
# Test integration with sample preferences
node phase0/cli/milestone1.js integrate --location Bangalore --budget medium --cuisines "North Indian,Chinese" --rating 4

# With debug information
node phase0/cli/milestone1.js integrate --location Bangalore --budget medium --cuisines "North Indian,Chinese" --rating 4 --debug

# Test edge cases
node phase0/cli/milestone1.js integrate --location InvalidCity --budget premium --cuisines "" --rating 6
```

### Usage in code

```javascript
import { processUserPreferences, processWithDebug } from './phase3/integration/index.js';

// Basic integration
const result = await processUserPreferences(preferences, {
  ranking: {
    targetCount: 25,
    sortBy: 'composite'
  },
  prompt: {
    format: 'json',
    maxRecommendations: 5
  }
});

// With debugging
const debugResult = await processWithDebug(preferences, options);
```

### Configuration options

#### Ranking options
- `targetCount`: Target number of candidates (default: 25)
- `minCount`: Minimum candidates to return (default: 15)
- `maxCount`: Maximum candidates to return (default: 50)
- `sortBy`: Sort method ('rating', 'cost', 'composite')

#### Prompt options
- `format`: Output format ('json' or 'markdown')
- `maxRecommendations`: Maximum recommendations to request (default: 5)
- `includeInstructions`: Include system instructions (default: true)
- `includeFormatDefinition`: Include output format definition (default: true)

### Edge case handling

#### No matches
- Returns suggestions for adjusting preferences
- Provides clear error messages
- Suggests broader search criteria

#### Too many matches
- Applies intelligent ranking to surface best candidates
- Caps results to prevent context overflow
- Maintains diversity in selection

#### Invalid preferences
- Validates all preference fields
- Provides helpful error messages
- Suggests corrections for common issues

### Exit criteria met
- ✅ Function returns `(candidates[], prompt_payload)` without calling LLM
- ✅ Tests for edge cases (no matches, too many matches, borderline filters)
- ✅ Given preferences + dataset, shortlist and prompt payload are stable and reproducible
- ✅ Hard filters applied deterministically
- ✅ Candidate capping prevents context overflow
- ✅ Ranking hints provide sensible ordering for LLM

### Performance considerations
- Dataset loading limited to reasonable subset (5000 restaurants)
- Filters applied sequentially with early termination
- Composite scoring optimized for batch processing
- Prompt payload size controlled through candidate capping

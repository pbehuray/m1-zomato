## Phase 2: User preferences and validation

This folder implements **Phase 2** from `docs/phase-wise-architecture.md`.

### What's included
- `phase2/preferences/`: User preference model, validation, and mapping functions
- CLI integration for parsing and validating preferences
- Location validation against the restaurant dataset

### Key components

#### UserPreferences model
- **location**: City or locality for restaurant search
- **budgetBand**: Budget band (low, medium, high) with cost ranges
- **cuisines**: List of preferred cuisines
- **minRating**: Minimum rating (1-5)
- **freeText**: Optional free-text for additional preferences

#### Budget band definitions
- **low**: Budget-friendly (under ₹300)
- **medium**: Mid-range (₹301-800)
- **high**: Fine dining (₹800+)

#### Validation features
- Required field validation
- Type checking and normalization
- Location validation against dataset
- Rating range validation (1-5)
- Cuisine list validation
- Free text length limits

#### Helper functions
- `allowedCitiesFromRestaurants()`: Extract cities from dataset
- `isValidLocation()`: Validate location with fuzzy matching
- `suggestCities()`: Provide location suggestions for invalid inputs

### CLI

Run from repo root:

```bash
# Parse valid preferences
node phase0/cli/milestone1.js prefs-parse --location Bangalore --budget medium --cuisines "North Indian,Chinese" --rating 4

# With optional free text
node phase0/cli/milestone1.js prefs-parse --location Bangalore --budget medium --cuisines "North Indian" --rating 4 --notes "Prefer outdoor seating"

# Test validation (will show errors)
node phase0/cli/milestone1.js prefs-parse --location InvalidCity --budget premium --cuisines "" --rating 6
```

### Usage in code

```javascript
import { 
  preferencesFromCLI, 
  preferencesFromForm, 
  preferencesFromAPI,
  validateLocationWithSuggestions 
} from './phase2/preferences/index.js';

// From CLI arguments
const prefs = preferencesFromCLI({
  location: 'Bangalore',
  budget: 'medium',
  cuisines: 'North Indian,Chinese',
  rating: 4
});

// From form data
const formPrefs = preferencesFromForm(formData);

// From API payload
const apiPrefs = preferencesFromAPI(apiData);

// Validate location
const locationValidation = await validateLocationWithSuggestions('Bangalore', repoRoot);
```

### Exit criteria met
- ✅ Preferences deserialize into one object used by the filter layer
- ✅ Validation errors are visible and understandable in both UI and CLI
- ✅ Location validation with suggestions for invalid inputs
- ✅ Budget band and rating range validation
- ✅ Cuisine list parsing and validation

## Phase 4: Recommendation engine (LLM)

This folder implements **Phase 4** from `docs/phase-wise-architecture.md` using Groq as the LLM provider.

### What's included
- `phase4/recommendation/`: Complete LLM-based recommendation engine
- Groq client with retry logic and error handling
- Structured output parsing and validation
- Grounding system to ensure candidate-only recommendations
- Fallback system with deterministic top-k and templated explanations
- End-to-end recommendation pipeline

### Key components

#### Groq client
- **Model configuration**: Uses Llama3-70B-8192 for optimal performance
- **Retry logic**: 3 attempts with exponential backoff
- **Timeout handling**: 30-second timeout with proper error handling
- **Token management**: Estimates and validates token limits

#### Response parsing
- **JSON structure validation**: Ensures proper response format
- **Grounding validation**: Forces recommendations to reference only candidate restaurants
- **Quality assessment**: Evaluates response quality with configurable thresholds
- **Error recovery**: Graceful handling of malformed responses

#### Fallback system
- **Deterministic ranking**: Uses composite scores from Phase 3
- **Templated explanations**: Generates meaningful explanations based on preferences
- **Quality triggers**: Activates fallback when LLM quality is insufficient
- **User transparency**: Clear indication when fallback is used

### Configuration

#### Environment variables
```bash
# Required for Groq API access
GROQ_API_KEY=your_groq_api_key_here

# Optional configuration
LLM_PROVIDER=groq
```

#### Recommendation options
- `maxRecommendations`: Number of recommendations to generate (1-10)
- `enableFallback`: Enable/disable fallback behavior (default: true)
- `qualityThreshold`: Quality threshold for fallback ('excellent', 'good', 'fair')
- `validateAPIKey`: Validate API key before use (default: true)

#### Groq options
- `model`: Groq model to use (default: 'llama3-70b-8192')
- `temperature`: Sampling temperature (0-2, default: 0.3)
- `maxTokens`: Maximum response tokens (100-8000, default: 2048)
- `timeout`: Request timeout in milliseconds (default: 30000)

### CLI

Run from repo root:

```bash
# Get LLM recommendations
node phase0/cli/milestone1.js recommend --location Banashankari --budget low --cuisines "South Indian" --rating 3.5

# With debug information
node phase0/cli/milestone1.js recommend --location Banashankari --budget low --cuisines "South Indian" --rating 3.5 --debug

# Disable fallback
node phase0/cli/milestone1.js recommend --location Banashankari --budget low --cuisines "South Indian" --rating 3.5 --no-fallback
```

### Usage in code

```javascript
import { generateRecommendations } from './phase4/recommendation/index.js';

// Basic recommendation
const result = await generateRecommendations(preferences, {
  recommendation: {
    maxRecommendations: 5,
    qualityThreshold: 'good'
  },
  groq: {
    model: 'llama3-70b-8192',
    temperature: 0.3
  }
});

// Check result
if (result.success) {
  console.log('Recommendations:', result.recommendations);
  console.log('Summary:', result.summary);
  console.log('Used fallback:', result.metadata.usedFallback);
} else {
  console.error('Error:', result.error);
}
```

### Response format

#### Successful response
```json
{
  "success": true,
  "recommendations": [
    {
      "restaurant_id": "candidate_1",
      "restaurant_name": "Restaurant Name",
      "rank": 1,
      "explanation": "Great match because...",
      "match_score": 85,
      "candidate_data": { ... }
    }
  ],
  "summary": "Top 3 recommendations based on...",
  "metadata": {
    "preferences": { ... },
    "integration": { ... },
    "groq": { ... },
    "quality": { ... },
    "usedFallback": false
  }
}
```

#### Error response
```json
{
  "success": false,
  "error": "Error message",
  "recommendations": [],
  "summary": null,
  "metadata": {
    "preferences": { ... },
    "error": { ... }
  }
}
```

### Quality assessment

The system assesses response quality based on:
- **Completeness**: All required fields present
- **Reasonableness**: Adequate number of recommendations
- **Explanation quality**: Sufficient explanation length
- **Score consistency**: Reasonable match scores

Quality levels:
- **Excellent**: No issues detected
- **Good**: Minor issues (1-2 problems)
- **Fair**: Multiple issues (3+ problems)
- **Poor**: Parsing failed or major issues

### Fallback behavior

When fallback is triggered:
1. Uses deterministic ranking from Phase 3 composite scores
2. Generates templated explanations based on preferences
3. Maintains same response structure as LLM responses
4. Clearly indicates fallback usage in metadata

Fallback triggers:
- Groq API failure (network, rate limits, etc.)
- Response parsing failure (invalid JSON, missing fields)
- Quality assessment below threshold
- Explicit fallback request

### Exit criteria met
- ✅ End-to-end call returning ranked items + explanations
- ✅ Parser/validator for JSON response format
- ✅ Failures degrade gracefully (no crashes; clear message; reasonable fallback behavior)
- ✅ Model I/O with temperature/max tokens/timeouts
- ✅ Grounding forces recommendations to reference only candidate restaurants
- ✅ Structured output with proper parsing and validation
- ✅ Resilience with retries on transient errors
- ✅ Fallback to deterministic top-k with templated explanations

### Performance considerations
- Token usage monitoring to prevent context overflow
- Efficient retry logic with exponential backoff
- Quality thresholds to balance accuracy vs. reliability
- Fallback system ensures service availability
- Response caching could be added for repeated queries

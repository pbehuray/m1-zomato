/**
 * Main integration layer for Phase 3
 * Ties together filtering, ranking, and prompt building
 */

import { loadRestaurants } from '../../phase1/ingestion/index.js';
import { applyHardFilters, applyFiltersWithStats } from './filters.js';
import { sortAndCapCandidates, getSelectionStats } from './ranking.js';
import { buildPromptPayload, validatePromptPayload } from './prompt-builder.js';

// Re-export all modules for convenience
export { applyHardFilters, applyFiltersWithStats } from './filters.js';
export { sortAndCapCandidates, calculateCompositeScore, getSelectionStats } from './ranking.js';
export { buildPromptPayload, validatePromptPayload, buildCompactPrompt } from './prompt-builder.js';

/**
 * Main integration function - processes preferences and returns candidates + prompt
 * @param {Object} preferences - User preferences object
 * @param {Object} options - Integration options
 * @param {string} options.repoRoot - Repository root path
 * @param {string} options.datasetId - Dataset ID
 * @param {Object} options.ranking - Ranking options
 * @param {Object} options.prompt - Prompt building options
 * @returns {Promise<Object>} Result with candidates, prompt, and metadata
 */
export async function processUserPreferences(preferences, options = {}) {
  const config = {
    repoRoot: options.repoRoot || '.',
    datasetId: options.datasetId || 'ManikaSaini/zomato-restaurant-recommendation',
    ranking: {
      targetCount: 25,
      minCount: 15,
      maxCount: 50,
      sortBy: 'composite',
      ...options.ranking
    },
    prompt: {
      includeInstructions: true,
      includeFormatDefinition: true,
      format: 'json',
      maxRecommendations: 5,
      ...options.prompt
    },
    ...options
  };

  try {
    // Step 1: Load restaurant dataset
    const datasetResult = await loadRestaurants({
      repoRoot: config.repoRoot,
      datasetId: config.datasetId,
      limit: 5000 // Load a reasonable subset for performance
    });

    // Step 2: Apply hard filters
    const filterResult = applyFiltersWithStats(datasetResult.restaurants, preferences);
    
    // Step 3: Handle edge cases
    if (filterResult.restaurants.length === 0) {
      return handleNoMatches(preferences, config);
    }

    // Step 4: Sort and cap candidates
    const candidates = sortAndCapCandidates(filterResult.restaurants, preferences, config.ranking);

    // Step 5: Build prompt payload
    const promptPayload = buildPromptPayload(preferences, candidates, config.prompt);

    // Step 6: Validate prompt payload
    const promptValidation = validatePromptPayload(promptPayload);
    if (!promptValidation.isValid) {
      throw new Error(`Invalid prompt payload: ${promptValidation.errors.join(', ')}`);
    }

    // Step 7: Compile results
    const selectionStats = getSelectionStats(
      datasetResult.restaurants,
      filterResult.restaurants,
      candidates
    );

    return {
      success: true,
      candidates,
      promptPayload,
      metadata: {
        preferences,
        datasetInfo: {
          id: config.datasetId,
          totalLoaded: datasetResult.restaurants.length,
          cachePath: datasetResult.cachePath
        },
        filterStats: filterResult.stats,
        selectionStats,
        rankingConfig: config.ranking,
        promptConfig: config.prompt,
        processingTime: Date.now()
      }
    };

  } catch (error) {
    return {
      success: false,
      error: error.message,
      candidates: [],
      promptPayload: null,
      metadata: {
        preferences,
        error: {
          message: error.message,
          stack: error.stack
        }
      }
    };
  }
}

/**
 * Handle case where no restaurants match the filters
 * @param {Object} preferences - User preferences
 * @param {Object} config - Configuration
 * @returns {Object} No matches result
 */
function handleNoMatches(preferences, config) {
  const suggestions = generateFilterSuggestions(preferences);
  
  return {
    success: true,
    candidates: [],
    promptPayload: null,
    metadata: {
      preferences,
      noMatches: true,
      suggestions,
      message: 'No restaurants found matching your criteria. Consider adjusting your preferences.'
    }
  };
}

/**
 * Generate suggestions for users when no matches are found
 * @param {Object} preferences - User preferences
 * @returns {Array} Array of suggestions
 */
function generateFilterSuggestions(preferences) {
  const suggestions = [];
  
  // Budget suggestions
  if (preferences.budgetBand === 'low') {
    suggestions.push('Try a higher budget (medium or high)');
  }
  
  // Rating suggestions
  if (preferences.minRating > 3) {
    suggestions.push('Try a lower minimum rating (3.0 or below)');
  }
  
  // Cuisine suggestions
  if (preferences.cuisines.length === 1) {
    suggestions.push('Try adding more cuisine types');
  }
  
  // Location suggestions
  suggestions.push('Try a broader location (city name instead of specific area)');
  
  return suggestions;
}

/**
 * Process preferences with detailed debugging information
 * @param {Object} preferences - User preferences
 * @param {Object} options - Integration options
 * @returns {Promise<Object>} Detailed result with debugging info
 */
export async function processWithDebug(preferences, options = {}) {
  const result = await processUserPreferences(preferences, options);
  
  if (!result.success) {
    return result;
  }

  // Add detailed debugging information
  const debug = {
    preferences: {
      input: preferences,
      normalized: preferences
    },
    filtering: {
      stats: result.metadata.filterStats,
      reductionRate: result.metadata.filterStats && result.metadata.filterStats.original > 0 
        ? ((result.metadata.filterStats.original - result.metadata.filterStats.final) / result.metadata.filterStats.original * 100).toFixed(1)
        : 0
    },
    ranking: {
      config: result.metadata.rankingConfig,
      candidatesWithScores: result.candidates.map(c => ({
        name: c.name,
        rating: c.rating,
        cost: c.cost,
        compositeScore: c.compositeScore
      }))
    },
    prompt: {
      systemPromptLength: result.promptPayload ? result.promptPayload.systemPrompt.length : 0,
      userPromptLength: result.promptPayload ? result.promptPayload.userPrompt.length : 0,
      candidateCount: result.promptPayload ? result.promptPayload.metadata.candidateCount : 0
    }
  };

  return {
    ...result,
    debug
  };
}

/**
 * Quick integration test with sample preferences
 * @param {Object} options - Test options
 * @returns {Promise<Object>} Test result
 */
export async function quickIntegrationTest(options = {}) {
  const samplePreferences = {
    location: 'Bangalore',
    budgetBand: 'medium',
    cuisines: ['North Indian', 'Chinese'],
    minRating: 4.0,
    freeText: 'Good for family dinner'
  };

  const testOptions = {
    ranking: {
      targetCount: 10,
      sortBy: 'composite'
    },
    prompt: {
      format: 'json',
      maxRecommendations: 3
    },
    ...options
  };

  return await processWithDebug(samplePreferences, testOptions);
}

/**
 * Validate integration configuration
 * @param {Object} options - Integration options
 * @returns {Object} Validation result
 */
export function validateIntegrationConfig(options = {}) {
  const errors = [];
  
  if (options.ranking) {
    if (options.ranking.targetCount && (options.ranking.targetCount < 1 || options.ranking.targetCount > 100)) {
      errors.push('ranking.targetCount must be between 1 and 100');
    }
    
    if (options.ranking.sortBy && !['rating', 'cost', 'composite'].includes(options.ranking.sortBy)) {
      errors.push('ranking.sortBy must be one of: rating, cost, composite');
    }
  }
  
  if (options.prompt) {
    if (options.prompt.format && !['json', 'markdown'].includes(options.prompt.format)) {
      errors.push('prompt.format must be one of: json, markdown');
    }
    
    if (options.prompt.maxRecommendations && (options.prompt.maxRecommendations < 1 || options.prompt.maxRecommendations > 20)) {
      errors.push('prompt.maxRecommendations must be between 1 and 20');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

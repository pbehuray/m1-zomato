/**
 * Main recommendation engine for Phase 4
 * End-to-end LLM-based restaurant recommendations with Groq
 */

import { callGroqAPI, validateGroqAPIKey, checkTokenLimits } from './groq-client.js';
import { parseRecommendationResponse, createFallbackResponse, assessResponseQuality } from './response-parser.js';
import { processUserPreferences } from '../../phase3/integration/index.js';

/**
 * Default configuration for recommendation engine
 */
export const DEFAULT_RECOMMENDATION_CONFIG = {
  maxRecommendations: 5,
  minCandidates: 3,
  enableFallback: true,
  qualityThreshold: 'good', // 'excellent', 'good', 'fair'
  validateAPIKey: true
};

/**
 * Main recommendation function - processes preferences and returns LLM recommendations
 * @param {Object} preferences - User preferences object
 * @param {Object} options - Recommendation options
 * @param {string} options.repoRoot - Repository root path
 * @param {Object} options.groq - Groq API configuration
 * @param {Object} options.integration - Integration layer configuration
 * @param {Object} options.recommendation - Recommendation engine configuration
 * @returns {Promise<Object>} Recommendation results with metadata
 */
export async function generateRecommendations(preferences, options = {}) {
  const config = {
    repoRoot: options.repoRoot || '.',
    groq: {
      model: 'llama3-70b-8192',
      temperature: 0.3,
      maxTokens: 2048,
      ...options.groq
    },
    integration: {
      ranking: {
        targetCount: 25,
        sortBy: 'composite'
      },
      prompt: {
        format: 'json',
        maxRecommendations: options.recommendation?.maxRecommendations || 5
      },
      ...options.integration
    },
    recommendation: {
      ...DEFAULT_RECOMMENDATION_CONFIG,
      ...options.recommendation
    }
  };

  try {
    // Step 1: Validate API key if required
    if (config.recommendation.validateAPIKey) {
      const isValidKey = await validateGroqAPIKey(config.groq.apiKey);
      if (!isValidKey) {
        console.warn('⚠️  Groq API key validation failed, proceeding anyway...');
      }
    }

    // Step 2: Process preferences and get candidates
    console.log('🔍 Processing preferences and generating candidates...');
    const integrationResult = await processUserPreferences(preferences, {
      repoRoot: config.repoRoot,
      ranking: config.integration.ranking,
      prompt: config.integration.prompt
    });

    if (!integrationResult.success) {
      throw new Error(`Integration failed: ${integrationResult.error}`);
    }

    if (integrationResult.candidates.length === 0) {
      return handleNoCandidates(preferences, integrationResult);
    }

    // Step 3: Check token limits
    const tokenCheck = checkTokenLimits(
      integrationResult.promptPayload.systemPrompt,
      integrationResult.promptPayload.userPrompt,
      config.groq.maxTokens
    );

    if (!tokenCheck.withinLimit) {
      console.warn(`⚠️  High token utilization: ${tokenCheck.utilization}%`);
    }

    // Step 4: Call Groq API
    console.log('🤖 Calling Groq for recommendations...');
    const groqResult = await callGroqAPI(
      integrationResult.promptPayload.systemPrompt,
      integrationResult.promptPayload.userPrompt,
      config.groq
    );

    if (!groqResult.success) {
      console.warn(`⚠️  Groq API failed: ${groqResult.error}`);
      return handleGroqFailure(preferences, integrationResult, groqResult, config);
    }

    // Step 5: Parse and validate response
    console.log('📝 Parsing Groq response...');
    const parseResult = parseRecommendationResponse(
      groqResult.content,
      integrationResult.candidates
    );

    if (!parseResult.success) {
      console.warn(`⚠️  Response parsing failed: ${parseResult.error}`);
      return handleParsingFailure(preferences, integrationResult, parseResult, config);
    }

    // Step 6: Assess response quality
    const quality = assessResponseQuality(parseResult);
    console.log(`📊 Response quality: ${quality.quality}`);

    // Step 7: Handle quality issues with fallback if needed
    if (shouldUseFallback(quality, config.recommendation)) {
      console.log('🔄 Using fallback due to quality issues...');
      return handleQualityFallback(preferences, integrationResult, quality, config);
    }

    // Step 8: Return successful result
    return {
      success: true,
      recommendations: parseResult.recommendations,
      summary: parseResult.summary,
      metadata: {
        preferences,
        integration: {
          candidateCount: integrationResult.candidates.length,
          filterStats: integrationResult.metadata.filterStats,
          selectionStats: integrationResult.metadata.selectionStats
        },
        groq: groqResult.metadata,
        parsing: parseResult.metadata,
        quality: {
          assessment: quality.quality,
          issues: quality.issues
        },
        processing: {
          totalTime: Date.now(),
          usedFallback: false
        }
      }
    };

  } catch (error) {
    console.error('❌ Recommendation generation failed:', error.message);
    return {
      success: false,
      error: error.message,
      recommendations: [],
      summary: null,
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
 * Handles case where no candidates are found
 * @param {Object} preferences - User preferences
 * @param {Object} integrationResult - Integration result
 * @returns {Object} No candidates result
 */
function handleNoCandidates(preferences, integrationResult) {
  return {
    success: true,
    recommendations: [],
    summary: 'No restaurants found matching your criteria. Try adjusting your preferences.',
    metadata: {
      preferences,
      noCandidates: true,
      suggestions: integrationResult.metadata.suggestions || [],
      message: integrationResult.metadata.message || 'No matches found'
    }
  };
}

/**
 * Handles Groq API failure with fallback
 * @param {Object} preferences - User preferences
 * @param {Object} integrationResult - Integration result
 * @param {Object} groqResult - Groq API result
 * @param {Object} config - Configuration
 * @returns {Object} Fallback result
 */
function handleGroqFailure(preferences, integrationResult, groqResult, config) {
  if (!config.recommendation.enableFallback) {
    return {
      success: false,
      error: `Groq API failed: ${groqResult.error}`,
      recommendations: [],
      summary: null,
      metadata: {
        preferences,
        groqError: groqResult.error,
        fallbackDisabled: true
      }
    };
  }

  const fallbackResponse = createFallbackResponse(
    integrationResult.candidates,
    preferences,
    config.recommendation.maxRecommendations
  );

  return {
    ...fallbackResponse,
    metadata: {
      ...fallbackResponse.metadata,
      preferences,
      groqError: groqResult.error,
      usedFallback: true,
      fallbackReason: 'Groq API failure'
    }
  };
}

/**
 * Handles response parsing failure with fallback
 * @param {Object} preferences - User preferences
 * @param {Object} integrationResult - Integration result
 * @param {Object} parseResult - Parse result
 * @param {Object} config - Configuration
 * @returns {Object} Fallback result
 */
function handleParsingFailure(preferences, integrationResult, parseResult, config) {
  if (!config.recommendation.enableFallback) {
    return {
      success: false,
      error: `Response parsing failed: ${parseResult.error}`,
      recommendations: [],
      summary: null,
      metadata: {
        preferences,
        parsingError: parseResult.error,
        fallbackDisabled: true
      }
    };
  }

  const fallbackResponse = createFallbackResponse(
    integrationResult.candidates,
    preferences,
    config.recommendation.maxRecommendations
  );

  return {
    ...fallbackResponse,
    metadata: {
      ...fallbackResponse.metadata,
      preferences,
      parsingError: parseResult.error,
      usedFallback: true,
      fallbackReason: 'Response parsing failure'
    }
  };
}

/**
 * Handles quality issues with fallback
 * @param {Object} preferences - User preferences
 * @param {Object} integrationResult - Integration result
 * @param {Object} quality - Quality assessment
 * @param {Object} config - Configuration
 * @returns {Object} Fallback result
 */
function handleQualityFallback(preferences, integrationResult, quality, config) {
  if (!config.recommendation.enableFallback) {
    return {
      success: true,
      recommendations: [], // Would have LLM recommendations but quality is poor
      summary: 'Recommendations generated but quality assessment failed.',
      metadata: {
        preferences,
        qualityIssues: quality.issues,
        fallbackDisabled: true
      }
    };
  }

  const fallbackResponse = createFallbackResponse(
    integrationResult.candidates,
    preferences,
    config.recommendation.maxRecommendations
  );

  return {
    ...fallbackResponse,
    metadata: {
      ...fallbackResponse.metadata,
      preferences,
      qualityIssues: quality.issues,
      usedFallback: true,
      fallbackReason: 'Quality assessment failed'
    }
  };
}

/**
 * Determines if fallback should be used based on quality
 * @param {Object} quality - Quality assessment
 * @param {Object} config - Recommendation configuration
 * @returns {boolean} True if fallback should be used
 */
function shouldUseFallback(quality, config) {
  if (!config.enableFallback) {
    return false;
  }

  const threshold = config.qualityThreshold;
  
  if (threshold === 'excellent' && quality.quality !== 'excellent') {
    return true;
  }
  
  if (threshold === 'good' && !['excellent', 'good'].includes(quality.quality)) {
    return true;
  }
  
  if (threshold === 'fair' && quality.quality === 'poor') {
    return true;
  }
  
  return false;
}

/**
 * Quick recommendation test with sample preferences
 * @param {Object} options - Test options
 * @returns {Promise<Object>} Test result
 */
export async function quickRecommendationTest(options = {}) {
  const samplePreferences = {
    location: 'Banashankari',
    budgetBand: 'low',
    cuisines: ['South Indian'],
    minRating: 3.5,
    freeText: 'Good for family dinner'
  };

  const testOptions = {
    recommendation: {
      maxRecommendations: 3,
      qualityThreshold: 'good'
    },
    groq: {
      model: 'llama3-70b-8192',
      temperature: 0.3
    },
    ...options
  };

  return await generateRecommendations(samplePreferences, testOptions);
}

/**
 * Validate recommendation configuration
 * @param {Object} options - Configuration options
 * @returns {Object} Validation result
 */
export function validateRecommendationConfig(options = {}) {
  const errors = [];
  
  if (options.recommendation) {
    if (options.recommendation.maxRecommendations && 
        (options.recommendation.maxRecommendations < 1 || options.recommendation.maxRecommendations > 10)) {
      errors.push('recommendation.maxRecommendations must be between 1 and 10');
    }
    
    if (options.recommendation.qualityThreshold && 
        !['excellent', 'good', 'fair'].includes(options.recommendation.qualityThreshold)) {
      errors.push('recommendation.qualityThreshold must be one of: excellent, good, fair');
    }
  }
  
  if (options.groq) {
    if (options.groq.temperature && 
        (options.groq.temperature < 0 || options.groq.temperature > 2)) {
      errors.push('groq.temperature must be between 0 and 2');
    }
    
    if (options.groq.maxTokens && 
        (options.groq.maxTokens < 100 || options.groq.maxTokens > 8000)) {
      errors.push('groq.maxTokens must be between 100 and 8000');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

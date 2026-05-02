/**
 * Response parser for Phase 4 recommendation engine
 * Handles structured output parsing and validation for Groq responses
 */

/**
 * Expected structure for recommendation response
 */
export const RECOMMENDATION_SCHEMA = {
  recommendations: {
    type: 'array',
    required: true,
    items: {
      restaurant_id: { type: 'string', required: true },
      restaurant_name: { type: 'string', required: true },
      rank: { type: 'number', required: true, min: 1 },
      explanation: { type: 'string', required: true },
      match_score: { type: 'number', required: true, min: 0, max: 100 }
    }
  },
  summary: { type: 'string', required: false }
};

/**
 * Parses and validates JSON response from Groq
 * @param {string} content - Raw JSON content from Groq
 * @param {Array} candidates - Original candidate restaurants for validation
 * @returns {Object} Parsed and validated recommendations
 */
export function parseRecommendationResponse(content, candidates) {
  try {
    // Parse JSON content
    let parsed;
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      throw new Error(`Invalid JSON response: ${parseError.message}`);
    }
    
    // Validate structure
    const validation = validateRecommendationStructure(parsed);
    if (!validation.isValid) {
      throw new Error(`Invalid response structure: ${validation.errors.join(', ')}`);
    }
    
    // Ground recommendations to candidates
    const grounded = groundRecommendations(parsed.recommendations, candidates);
    
    // Validate ranks and scores
    const validated = validateRecommendationContent(grounded);
    
    return {
      success: true,
      recommendations: validated.recommendations,
      summary: parsed.summary || null,
      metadata: {
        originalCount: parsed.recommendations.length,
        groundedCount: grounded.length,
        validationWarnings: validated.warnings
      }
    };
    
  } catch (error) {
    return {
      success: false,
      error: error.message,
      recommendations: [],
      summary: null
    };
  }
}

/**
 * Validates the structure of recommendation response
 * @param {Object} parsed - Parsed JSON object
 * @returns {Object} Validation result
 */
function validateRecommendationStructure(parsed) {
  const errors = [];
  
  if (!parsed || typeof parsed !== 'object') {
    errors.push('Response must be a JSON object');
    return { isValid: false, errors };
  }
  
  if (!Array.isArray(parsed.recommendations)) {
    errors.push('Recommendations must be an array');
  } else if (parsed.recommendations.length === 0) {
    errors.push('Recommendations array cannot be empty');
  }
  
  // Validate each recommendation
  if (Array.isArray(parsed.recommendations)) {
    parsed.recommendations.forEach((rec, index) => {
      if (!rec || typeof rec !== 'object') {
        errors.push(`Recommendation ${index + 1} must be an object`);
        return;
      }
      
      if (!rec.restaurant_id || typeof rec.restaurant_id !== 'string') {
        errors.push(`Recommendation ${index + 1} missing restaurant_id`);
      }
      
      if (!rec.restaurant_name || typeof rec.restaurant_name !== 'string') {
        errors.push(`Recommendation ${index + 1} missing restaurant_name`);
      }
      
      if (typeof rec.rank !== 'number' || rec.rank < 1) {
        errors.push(`Recommendation ${index + 1} must have valid rank (>= 1)`);
      }
      
      if (!rec.explanation || typeof rec.explanation !== 'string') {
        errors.push(`Recommendation ${index + 1} missing explanation`);
      }
      
      if (typeof rec.match_score !== 'number' || rec.match_score < 0 || rec.match_score > 100) {
        errors.push(`Recommendation ${index + 1} must have valid match_score (0-100)`);
      }
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Grounds recommendations to ensure they only reference candidate restaurants
 * @param {Array} recommendations - LLM recommendations
 * @param {Array} candidates - Original candidate restaurants
 * @returns {Array} Grounded recommendations
 */
function groundRecommendations(recommendations, candidates) {
  const candidateMap = new Map();
  
  // Create lookup map for candidates
  candidates.forEach(candidate => {
    candidateMap.set(candidate.id, candidate);
    candidateMap.set(candidate.name.toLowerCase(), candidate);
  });
  
  const grounded = [];
  const usedCandidates = new Set();
  
  recommendations.forEach(rec => {
    let matchedCandidate = null;
    
    // Try to match by restaurant_id first
    if (rec.restaurant_id && candidateMap.has(rec.restaurant_id)) {
      matchedCandidate = candidateMap.get(rec.restaurant_id);
    }
    
    // Then try to match by restaurant_name
    if (!matchedCandidate && rec.restaurant_name) {
      const nameKey = rec.restaurant_name.toLowerCase();
      if (candidateMap.has(nameKey)) {
        matchedCandidate = candidateMap.get(nameKey);
      }
    }
    
    // If we found a match and haven't used it yet, include it
    if (matchedCandidate && !usedCandidates.has(matchedCandidate.id)) {
      grounded.push({
        restaurant_id: matchedCandidate.id,
        restaurant_name: matchedCandidate.name,
        rank: rec.rank,
        explanation: rec.explanation,
        match_score: rec.match_score,
        candidate_data: matchedCandidate
      });
      usedCandidates.add(matchedCandidate.id);
    }
  });
  
  return grounded;
}

/**
 * Validates recommendation content (ranks, scores, etc.)
 * @param {Array} recommendations - Grounded recommendations
 * @returns {Object} Validated recommendations with warnings
 */
function validateRecommendationContent(recommendations) {
  const warnings = [];
  const ranks = new Set();
  
  recommendations.forEach((rec, index) => {
    // Check for duplicate ranks
    if (ranks.has(rec.rank)) {
      warnings.push(`Duplicate rank ${rec.rank} found for recommendation ${index + 1}`);
    } else {
      ranks.add(rec.rank);
    }
    
    // Validate explanation length
    if (rec.explanation.length > 200) {
      warnings.push(`Explanation for recommendation ${index + 1} is too long (${rec.explanation.length} chars)`);
    }
    
    // Check match score reasonableness
    if (rec.match_score < 50) {
      warnings.push(`Low match score (${rec.match_score}) for recommendation ${index + 1}`);
    }
  });
  
  // Sort by rank
  const sorted = [...recommendations].sort((a, b) => a.rank - b.rank);
  
  return {
    recommendations: sorted,
    warnings
  };
}

/**
 * Creates a fallback response when LLM fails
 * @param {Array} candidates - Original candidate restaurants
 * @param {Object} preferences - User preferences
 * @param {number} count - Number of recommendations to generate
 * @returns {Object} Fallback recommendations
 */
export function createFallbackResponse(candidates, preferences, count = 5) {
  const topCandidates = candidates
    .sort((a, b) => (b.compositeScore || 0) - (a.compositeScore || 0))
    .slice(0, count);
  
  const recommendations = topCandidates.map((candidate, index) => ({
    restaurant_id: candidate.id,
    restaurant_name: candidate.name,
    rank: index + 1,
    explanation: generateFallbackExplanation(candidate, preferences),
    match_score: Math.round(candidate.compositeScore || 75),
    candidate_data: candidate
  }));
  
  return {
    success: true,
    recommendations,
    summary: `Top ${recommendations.length} recommendations based on your preferences for ${preferences.cuisines.join('/')} food in ${preferences.location}.`,
    metadata: {
      isFallback: true,
      fallbackReason: 'LLM processing failed',
      candidateCount: candidates.length,
      recommendationCount: recommendations.length
    }
  };
}

/**
 * Generates templated explanations for fallback responses
 * @param {Object} candidate - Restaurant candidate
 * @param {Object} preferences - User preferences
 * @returns {string} Generated explanation
 */
function generateFallbackExplanation(candidate, preferences) {
  const reasons = [];
  
  // Location match
  if (candidate.location && candidate.location.toLowerCase().includes(preferences.location.toLowerCase())) {
    reasons.push(`located in ${candidate.location}`);
  }
  
  // Rating match
  if (candidate.rating && candidate.rating >= preferences.minRating) {
    reasons.push(`excellent rating of ${candidate.rating}/5`);
  }
  
  // Budget match
  if (candidate.cost) {
    const budgetText = candidate.cost <= 300 ? 'budget-friendly' : 
                      candidate.cost <= 800 ? 'reasonably priced' : 'premium';
    reasons.push(`${budgetText} at ₹${candidate.cost}`);
  }
  
  // Cuisine match
  const matchingCuisines = candidate.cuisines?.filter(cuisine => 
    preferences.cuisines.some(pref => 
      cuisine.toLowerCase().includes(pref.toLowerCase()) || 
      pref.toLowerCase().includes(cuisine.toLowerCase())
    )
  ) || [];
  
  if (matchingCuisines.length > 0) {
    reasons.push(`serves ${matchingCuisines.join(' and ')} cuisine`);
  }
  
  if (reasons.length === 0) {
    return `Good choice based on your preferences in ${preferences.location}.`;
  }
  
  return `Great match because it's ${reasons.join(', ')} and fits your criteria well.`;
}

/**
 * Validates response completeness and quality
 * @param {Object} response - Parsed response object
 * @returns {Object} Quality assessment
 */
export function assessResponseQuality(response) {
  if (!response.success) {
    return { quality: 'poor', issues: ['Response parsing failed'] };
  }
  
  const issues = [];
  const { recommendations, metadata } = response;
  
  if (recommendations.length === 0) {
    issues.push('No recommendations provided');
  }
  
  if (recommendations.length < 3) {
    issues.push('Fewer than 3 recommendations');
  }
  
  // Check for reasonable explanations
  const shortExplanations = recommendations.filter(rec => 
    rec.explanation.length < 20
  );
  
  if (shortExplanations.length > 0) {
    issues.push(`${shortExplanations.length} recommendations have very short explanations`);
  }
  
  // Check for reasonable match scores
  const lowScores = recommendations.filter(rec => rec.match_score < 60);
  if (lowScores.length > recommendations.length / 2) {
    issues.push('Many recommendations have low match scores');
  }
  
  if (issues.length === 0) {
    return { quality: 'excellent', issues: [] };
  } else if (issues.length <= 2) {
    return { quality: 'good', issues };
  } else {
    return { quality: 'fair', issues };
  }
}

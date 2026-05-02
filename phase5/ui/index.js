/**
 * Phase 5: Output and experience
 * UI components for displaying recommendations and handling user experience
 */

/**
 * Formats recommendation data for display
 * @param {Object} recommendations - Recommendation result from Phase 4
 * @returns {Object} Formatted data for UI rendering
 */
export function formatRecommendationsForUI(recommendations) {
  if (!recommendations.success) {
    return {
      success: false,
      error: recommendations.error,
      recommendations: [],
      summary: null,
      metadata: recommendations.metadata
    };
  }

  const formatted = {
    success: true,
    recommendations: recommendations.recommendations.map(rec => ({
      id: rec.restaurant_id,
      name: rec.restaurant_name,
      rank: rec.rank,
      explanation: rec.explanation,
      matchScore: rec.match_score,
      details: rec.candidate_data ? {
        location: rec.candidate_data.location,
        rating: rec.candidate_data.rating,
        cost: rec.candidate_data.cost,
        cuisines: rec.candidate_data.cuisines || []
      } : null
    })),
    summary: recommendations.summary,
    metadata: {
      ...recommendations.metadata,
      totalRecommendations: recommendations.recommendations.length,
      usedFallback: recommendations.metadata.usedFallback || false,
      quality: recommendations.metadata.quality?.assessment || 'unknown'
    }
  };

  return formatted;
}

/**
 * Determines the appropriate empty state message
 * @param {Object} recommendations - Recommendation result
 * @returns {Object} Empty state configuration
 */
export function getEmptyStateConfig(recommendations) {
  if (!recommendations.success) {
    return {
      type: 'error',
      title: 'Recommendation Failed',
      message: recommendations.error || 'Unable to generate recommendations',
      action: 'Try adjusting your preferences or try again later'
    };
  }

  if (recommendations.recommendations.length === 0) {
    if (recommendations.metadata?.noCandidates) {
      return {
        type: 'no_matches',
        title: 'No Restaurants Found',
        message: 'No restaurants match your current preferences',
        action: 'Try adjusting your location, budget, or cuisine preferences',
        suggestions: recommendations.metadata.suggestions || []
      };
    } else {
      return {
        type: 'no_results',
        title: 'No Recommendations Available',
        message: recommendations.summary || 'Unable to generate recommendations at this time',
        action: 'Please try again with different preferences'
      };
    }
  }

  return null;
}

/**
 * Creates user-friendly metadata display
 * @param {Object} metadata - Recommendation metadata
 * @returns {Object} Formatted metadata for display
 */
export function formatMetadataForDisplay(metadata) {
  const display = {
    processingTime: metadata.processingTime ? `${metadata.processingTime}ms` : null,
    candidateCount: metadata.integration?.candidateCount || 0,
    filterReduction: null,
    quality: metadata.quality?.assessment || 'unknown',
    usedFallback: metadata.usedFallback || false,
    fallbackReason: metadata.fallbackReason || null
  };

  // Calculate filter reduction if data available
  if (metadata.integration?.filterStats && metadata.integration?.filterStats.original > 0) {
    const reduction = ((metadata.integration.filterStats.original - metadata.integration.filterStats.final) / 
                      metadata.integration.filterStats.original * 100).toFixed(1);
    display.filterReduction = `${reduction}%`;
  }

  return display;
}

/**
 * Validates recommendation display data
 * @param {Object} recommendations - Formatted recommendations
 * @returns {Object} Validation result
 */
export function validateRecommendationDisplay(recommendations) {
  const issues = [];

  if (!recommendations.success) {
    return { isValid: false, issues: ['Recommendations failed to generate'] };
  }

  if (!Array.isArray(recommendations.recommendations)) {
    issues.push('Recommendations is not an array');
  } else {
    recommendations.recommendations.forEach((rec, index) => {
      if (!rec.name) issues.push(`Recommendation ${index + 1} missing name`);
      if (!rec.explanation) issues.push(`Recommendation ${index + 1} missing explanation`);
      if (typeof rec.matchScore !== 'number') issues.push(`Recommendation ${index + 1} missing match score`);
    });
  }

  return {
    isValid: issues.length === 0,
    issues
  };
}

/**
 * Creates shareable recommendation summary
 * @param {Object} recommendations - Recommendation result
 * @param {Object} preferences - User preferences
 * @returns {string} Shareable text summary
 */
export function createShareableSummary(recommendations, preferences) {
  if (!recommendations.success || recommendations.recommendations.length === 0) {
    return `No restaurant recommendations found for ${preferences.location} with ${preferences.cuisines.join('/')} cuisine.`;
  }

  const topRecs = recommendations.recommendations.slice(0, 3);
  const summary = `Top restaurant recommendations for ${preferences.location} (${preferences.cuisines.join('/')} cuisine, ₹${preferences.budgetBand} budget, ${preferences.minRating}+ rating):\n\n`;

  const recDetails = topRecs.map((rec, index) => {
    return `${index + 1}. ${rec.name} - ${rec.details?.location || 'Location unknown'} - ⭐${rec.details?.rating || '?'} - 💰₹${rec.details?.cost || '?'}\n   ${rec.explanation}`;
  }).join('\n\n');

  return summary + recDetails;
}

/**
 * Generates performance metrics for observability
 * @param {Object} recommendations - Recommendation result
 * @returns {Object} Performance metrics
 */
export function generatePerformanceMetrics(recommendations) {
  const metrics = {
    timestamp: new Date().toISOString(),
    success: recommendations.success,
    processingTime: recommendations.metadata?.processingTime || null,
    candidateCount: recommendations.metadata?.integration?.candidateCount || 0,
    recommendationCount: recommendations.recommendations?.length || 0,
    quality: recommendations.metadata?.quality?.assessment || null,
    usedFallback: recommendations.metadata?.usedFallback || false,
    error: recommendations.success ? null : recommendations.error
  };

  // Add filter statistics if available
  if (recommendations.metadata?.integration?.filterStats) {
    metrics.filterStats = {
      original: recommendations.metadata.integration.filterStats.original,
      final: recommendations.metadata.integration.filterStats.final,
      reductionRate: recommendations.metadata.integration.filterStats.original > 0 
        ? ((recommendations.metadata.integration.filterStats.original - recommendations.metadata.integration.filterStats.final) / 
           recommendations.metadata.integration.filterStats.original * 100).toFixed(1)
        : 0
    };
  }

  // Add LLM metrics if available
  if (recommendations.metadata?.groq) {
    metrics.llm = {
      model: recommendations.metadata.groq.model,
      responseTime: recommendations.metadata.groq.responseTime,
      attempt: recommendations.metadata.groq.attempt
    };
  }

  return metrics;
}

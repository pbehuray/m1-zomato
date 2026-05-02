/**
 * Ranking and candidate selection logic for Phase 3
 */

import { BUDGET_BANDS } from '../../phase2/preferences/user-preferences.js';

/**
 * Default configuration for candidate selection
 */
export const DEFAULT_CONFIG = {
  MIN_CANDIDATES: 15,
  MAX_CANDIDATES: 50,
  DEFAULT_TARGET: 25
};

/**
 * Calculate a composite score for a restaurant based on multiple factors
 * @param {Object} restaurant - Restaurant object
 * @param {Object} preferences - User preferences
 * @returns {number} Composite score (higher is better)
 */
export function calculateCompositeScore(restaurant, preferences) {
  let score = 0;
  
  // Rating component (40% weight)
  if (restaurant.rating && typeof restaurant.rating === 'number') {
    const ratingScore = (restaurant.rating / 5) * 40;
    score += ratingScore;
  }
  
  // Cost preference component (20% weight)
  if (restaurant.cost && typeof restaurant.cost === 'number') {
    const costScore = calculateCostScore(restaurant.cost, preferences.budgetBand);
    score += costScore * 0.2;
  }
  
  // Cuisine overlap component (25% weight)
  const cuisineScore = calculateCuisineOverlapScore(restaurant, preferences.cuisines);
  score += cuisineScore * 0.25;
  
  // Location match component (15% weight)
  const locationScore = calculateLocationScore(restaurant, preferences.location);
  score += locationScore * 0.15;
  
  return score;
}

/**
 * Calculate cost score based on budget band preference
 * @param {number} cost - Restaurant cost
 * @param {string} budgetBand - User's preferred budget band
 * @returns {number} Cost score (0-100)
 */
function calculateCostScore(cost, budgetBand) {
  const budgetRange = BUDGET_BANDS[budgetBand.toLowerCase()];
  
  if (!budgetRange) return 50; // Neutral score if budget band unknown
  
  // Prefer restaurants closer to middle of budget range
  const budgetMidpoint = (budgetRange.min + budgetRange.max) / 2;
  const maxDeviation = Math.max(budgetMidpoint - budgetRange.min, budgetRange.max - budgetMidpoint);
  
  if (maxDeviation === 0) return 100;
  
  const deviation = Math.abs(cost - budgetMidpoint);
  const score = Math.max(0, 100 - (deviation / maxDeviation) * 100);
  
  return score;
}

/**
 * Calculate cuisine overlap score
 * @param {Object} restaurant - Restaurant object
 * @param {Array} preferredCuisines - User's preferred cuisines
 * @returns {number} Cuisine overlap score (0-100)
 */
function calculateCuisineOverlapScore(restaurant, preferredCuisines) {
  if (!restaurant.cuisines || !Array.isArray(restaurant.cuisines) || preferredCuisines.length === 0) {
    return 0;
  }
  
  const restaurantCuisines = restaurant.cuisines.map(c => c.toLowerCase().trim());
  const normalizedPreferred = preferredCuisines.map(c => c.toLowerCase().trim());
  
  let matchCount = 0;
  for (const preferred of normalizedPreferred) {
    for (const restaurantCuisine of restaurantCuisines) {
      if (restaurantCuisine.includes(preferred) || preferred.includes(restaurantCuisine)) {
        matchCount++;
        break; // Count each preferred cuisine only once
      }
    }
  }
  
  return (matchCount / normalizedPreferred.length) * 100;
}

/**
 * Calculate location match score
 * @param {Object} restaurant - Restaurant object
 * @param {string} preferredLocation - User's preferred location
 * @returns {number} Location score (0-100)
 */
function calculateLocationScore(restaurant, preferredLocation) {
  if (!restaurant.location || !preferredLocation) {
    return 0;
  }
  
  const restaurantLocation = restaurant.location.toLowerCase().trim();
  const userLocation = preferredLocation.toLowerCase().trim();
  
  // Exact match gets 100
  if (restaurantLocation === userLocation) {
    return 100;
  }
  
  // Contains match gets 80
  if (restaurantLocation.includes(userLocation) || userLocation.includes(restaurantLocation)) {
    return 80;
  }
  
  return 0;
}

/**
 * Sort and cap candidates based on ranking
 * @param {Array} restaurants - Filtered restaurants
 * @param {Object} preferences - User preferences
 * @param {Object} options - Ranking options
 * @param {number} options.targetCount - Target number of candidates
 * @param {number} options.minCount - Minimum number of candidates
 * @param {number} options.maxCount - Maximum number of candidates
 * @param {string} options.sortBy - Sort method ('rating', 'composite', 'cost')
 * @returns {Array} Sorted and capped candidate list
 */
export function sortAndCapCandidates(restaurants, preferences, options = {}) {
  const config = {
    targetCount: options.targetCount || DEFAULT_CONFIG.DEFAULT_TARGET,
    minCount: options.minCount || DEFAULT_CONFIG.MIN_CANDIDATES,
    maxCount: options.maxCount || DEFAULT_CONFIG.MAX_CANDIDATES,
    sortBy: options.sortBy || 'composite'
  };
  
  if (restaurants.length === 0) {
    return [];
  }
  
  // Sort restaurants based on chosen method
  let sortedRestaurants;
  switch (config.sortBy) {
    case 'rating':
      sortedRestaurants = [...restaurants].sort((a, b) => (b.rating || 0) - (a.rating || 0));
      break;
    case 'cost':
      sortedRestaurants = [...restaurants].sort((a, b) => (a.cost || 0) - (b.cost || 0));
      break;
    case 'composite':
    default:
      // Add composite scores to restaurants for sorting
      const withScores = restaurants.map(restaurant => ({
        ...restaurant,
        compositeScore: calculateCompositeScore(restaurant, preferences)
      }));
      sortedRestaurants = withScores.sort((a, b) => b.compositeScore - a.compositeScore);
      break;
  }
  
  // Cap the results
  let targetSize = Math.min(config.targetCount, sortedRestaurants.length);
  
  // If we have too few results, try to include more up to maxCount
  if (sortedRestaurants.length < config.minCount) {
    targetSize = sortedRestaurants.length;
  } else if (sortedRestaurants.length >= config.minCount && sortedRestaurants.length < config.targetCount) {
    targetSize = sortedRestaurants.length;
  } else {
    // We have enough results, cap at targetCount
    targetSize = Math.min(config.targetCount, config.maxCount);
  }
  
  return sortedRestaurants.slice(0, targetSize);
}

/**
 * Get selection statistics for debugging
 * @param {Array} original - Original restaurant list
 * @param {Array} filtered - Filtered restaurant list
 * @param {Array} candidates - Final candidate list
 * @returns {Object} Selection statistics
 */
export function getSelectionStats(original, filtered, candidates) {
  return {
    originalCount: original.length,
    filteredCount: filtered.length,
    candidateCount: candidates.length,
    filterReduction: original.length > 0 ? ((original.length - filtered.length) / original.length * 100).toFixed(1) : 0,
    selectionRate: filtered.length > 0 ? (candidates.length / filtered.length * 100).toFixed(1) : 0,
    overallRate: original.length > 0 ? (candidates.length / original.length * 100).toFixed(1) : 0
  };
}

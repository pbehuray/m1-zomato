import { BUDGET_BANDS } from '../../phase2/preferences/user-preferences.js';

/**
 * Filter restaurants based on user preferences using hard filters
 * @param {Array} restaurants - Array of restaurant objects
 * @param {Object} preferences - User preferences object
 * @returns {Array} Filtered array of restaurants
 */
export function applyHardFilters(restaurants, preferences) {
  return restaurants.filter(restaurant => {
    return (
      locationFilter(restaurant, preferences.location) &&
      ratingFilter(restaurant, preferences.minRating) &&
      budgetFilter(restaurant, preferences.budgetBand) &&
      cuisineFilter(restaurant, preferences.cuisines)
    );
  });
}

/**
 * Location filter - matches exact location or contains location string
 * @param {Object} restaurant - Restaurant object
 * @param {string} preferredLocation - User's preferred location
 * @returns {boolean} True if restaurant matches location preference
 */
function locationFilter(restaurant, preferredLocation) {
  if (!restaurant.location || !preferredLocation) {
    return false;
  }
  
  const restaurantLocation = restaurant.location.toLowerCase().trim();
  const userLocation = preferredLocation.toLowerCase().trim();
  
  // Exact match
  if (restaurantLocation === userLocation) {
    return true;
  }
  
  // Contains match (city contains area or area contains city)
  return (
    restaurantLocation.includes(userLocation) ||
    userLocation.includes(restaurantLocation)
  );
}

/**
 * Rating filter - restaurant rating must be >= minimum rating
 * @param {Object} restaurant - Restaurant object
 * @param {number} minRating - Minimum acceptable rating
 * @returns {boolean} True if restaurant meets rating requirement
 */
function ratingFilter(restaurant, minRating) {
  if (!restaurant.rating || typeof restaurant.rating !== 'number') {
    return false;
  }
  
  return restaurant.rating >= minRating;
}

/**
 * Budget filter - restaurant cost must be within budget band
 * @param {Object} restaurant - Restaurant object
 * @param {string} budgetBand - Budget band (low, medium, high)
 * @returns {boolean} True if restaurant is within budget
 */
function budgetFilter(restaurant, budgetBand) {
  if (!restaurant.cost || typeof restaurant.cost !== 'number') {
    return false;
  }
  
  const budgetRange = BUDGET_BANDS[budgetBand.toLowerCase()];
  if (!budgetRange) {
    return false;
  }
  
  return restaurant.cost >= budgetRange.min && restaurant.cost <= budgetRange.max;
}

/**
 * Cuisine filter - restaurant must serve at least one preferred cuisine
 * @param {Object} restaurant - Restaurant object
 * @param {Array} preferredCuisines - Array of preferred cuisines
 * @returns {boolean} True if restaurant serves at least one preferred cuisine
 */
function cuisineFilter(restaurant, preferredCuisines) {
  if (!restaurant.cuisines || !Array.isArray(restaurant.cuisines) || preferredCuisines.length === 0) {
    return false;
  }
  
  // Normalize restaurant cuisines to lowercase
  const restaurantCuisines = restaurant.cuisines.map(c => c.toLowerCase().trim());
  
  // Check if any preferred cuisine matches
  return preferredCuisines.some(preferredCuisine => {
    const normalizedPreferred = preferredCuisine.toLowerCase().trim();
    return restaurantCuisines.some(restaurantCuisine => 
      restaurantCuisine.includes(normalizedPreferred) || 
      normalizedPreferred.includes(restaurantCuisine)
    );
  });
}

/**
 * Apply individual filters for debugging and analysis
 * @param {Array} restaurants - Array of restaurant objects
 * @param {Object} preferences - User preferences object
 * @returns {Object} Filter results with statistics
 */
export function applyFiltersWithStats(restaurants, preferences) {
  const originalCount = restaurants.length;
  
  // Apply filters step by step and track counts
  let filtered = [...restaurants];
  const stats = {
    original: originalCount,
    afterLocation: 0,
    afterRating: 0,
    afterBudget: 0,
    afterCuisine: 0,
    final: 0
  };
  
  // Location filter
  filtered = filtered.filter(r => locationFilter(r, preferences.location));
  stats.afterLocation = filtered.length;
  
  // Rating filter
  filtered = filtered.filter(r => ratingFilter(r, preferences.minRating));
  stats.afterRating = filtered.length;
  
  // Budget filter
  filtered = filtered.filter(r => budgetFilter(r, preferences.budgetBand));
  stats.afterBudget = filtered.length;
  
  // Cuisine filter
  filtered = filtered.filter(r => cuisineFilter(r, preferences.cuisines));
  stats.afterCuisine = filtered.length;
  
  stats.final = filtered.length;
  
  return {
    restaurants: filtered,
    stats
  };
}

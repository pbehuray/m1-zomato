import { loadRestaurants } from '../../phase1/ingestion/index.js';

/**
 * Cache for allowed cities to avoid repeated dataset loading
 */
let citiesCache = null;

/**
 * Extracts unique cities/locations from the restaurant dataset
 * @param {string} repoRoot - Repository root path
 * @returns {Promise<string[]>} Array of unique location strings
 */
export async function allowedCitiesFromRestaurants(repoRoot = '.') {
  // Return cached result if available
  if (citiesCache) {
    return citiesCache;
  }
  
  try {
    // Load a sample of restaurants to extract cities
    const result = await loadRestaurants({
      repoRoot,
      datasetId: 'ManikaSaini/zomato-restaurant-recommendation',
      limit: 1000 // Load first 1000 to get good city coverage
    });
    
    // Extract unique locations
    const locationSet = new Set();
    result.restaurants.forEach(restaurant => {
      if (restaurant.location && typeof restaurant.location === 'string') {
        // Clean and normalize location names
        const location = restaurant.location.trim();
        if (location.length > 0) {
          locationSet.add(location);
        }
      }
    });
    
    citiesCache = Array.from(locationSet).sort();
    return citiesCache;
  } catch (error) {
    console.warn('Failed to load cities from dataset:', error.message);
    // Return common Indian cities as fallback
    return [
      'Bangalore', 'Mumbai', 'Delhi', 'Kolkata', 'Chennai', 'Hyderabad',
      'Pune', 'Jaipur', 'Ahmedabad', 'Chandigarh', 'Lucknow', 'Indore',
      'Kochi', 'Goa', 'Agra', 'Varanasi', 'Udaipur', 'Mysore'
    ];
  }
}

/**
 * Validates if a location is in the allowed cities list
 * @param {string} location - Location to validate
 * @param {string[]} allowedCities - Array of allowed cities
 * @param {boolean} fuzzyMatch - Whether to allow partial/fuzzy matching
 * @returns {boolean} True if location is valid
 */
export function isValidLocation(location, allowedCities, fuzzyMatch = true) {
  if (!location || typeof location !== 'string') {
    return false;
  }
  
  const normalizedLocation = location.trim().toLowerCase();
  
  // Exact match
  const exactMatch = allowedCities.some(city => 
    city.toLowerCase() === normalizedLocation
  );
  if (exactMatch) return true;
  
  // Fuzzy match (contains)
  if (fuzzyMatch) {
    return allowedCities.some(city => 
      city.toLowerCase().includes(normalizedLocation) || 
      normalizedLocation.includes(city.toLowerCase())
    );
  }
  
  return false;
}

/**
 * Suggests similar city names for invalid locations
 * @param {string} location - Invalid location
 * @param {string[]} allowedCities - Array of allowed cities
 * @returns {string[]} Array of suggested city names
 */
export function suggestCities(location, allowedCities) {
  if (!location || typeof location !== 'string') {
    return [];
  }
  
  const normalizedLocation = location.trim().toLowerCase();
  const suggestions = [];
  
  // Find cities that contain the input or are contained by the input
  allowedCities.forEach(city => {
    const normalizedCity = city.toLowerCase();
    
    if (normalizedCity.includes(normalizedLocation) || 
        normalizedLocation.includes(normalizedCity)) {
      suggestions.push(city);
    }
  });
  
  // Add some common alternatives if no matches
  if (suggestions.length === 0) {
    const commonAlternatives = {
      'bangalore': ['Bangalore'],
      'bengaluru': ['Bangalore'],
      'mumbai': ['Mumbai', 'Bombay'],
      'delhi': ['Delhi', 'New Delhi'],
      'kolkata': ['Kolkata', 'Calcutta'],
      'chennai': ['Chennai', 'Madras'],
      'hyderabad': ['Hyderabad'],
      'pune': ['Pune', 'Poona']
    };
    
    const key = Object.keys(commonAlternatives).find(k => 
      normalizedLocation.includes(k) || k.includes(normalizedLocation)
    );
    
    if (key) {
      suggestions.push(...commonAlternatives[key]);
    }
  }
  
  return suggestions.slice(0, 5); // Limit to 5 suggestions
}

/**
 * Validates location against the dataset and provides suggestions
 * @param {string} location - Location to validate
 * @param {string} repoRoot - Repository root path
 * @returns {Promise<Object>} Validation result with isValid, suggestions, and allowedCities
 */
export async function validateLocationWithSuggestions(location, repoRoot = '.') {
  const allowedCities = await allowedCitiesFromRestaurants(repoRoot);
  const isValid = isValidLocation(location, allowedCities);
  const suggestions = isValid ? [] : suggestCities(location, allowedCities);
  
  return {
    isValid,
    suggestions,
    allowedCities,
    inputLocation: location
  };
}

/**
 * Clears the cities cache (useful for testing or when dataset changes)
 */
export function clearCitiesCache() {
  citiesCache = null;
}

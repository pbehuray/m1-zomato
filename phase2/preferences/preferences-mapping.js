import { createUserPreferences, validatePreferences } from './user-preferences.js';

/**
 * Creates UserPreferences from various input mappings (form data, API payload, CLI args)
 * @param {Object} mapping - Raw input mapping from various sources
 * @param {string} [mapping.location] - Location string
 * @param {string} [mapping.city] - Alternative location field (city)
 * @param {string} [mapping.locality] - Alternative location field (locality)
 * @param {string} [mapping.budget] - Budget band
 * @param {string} [mapping.budgetBand] - Alternative budget field
 * @param {string|Array} [mapping.cuisine] - Cuisine(s) - can be string or array
 * @param {string|Array} [mapping.cuisines] - Alternative cuisine field
 * @param {number|string} [mapping.rating] - Minimum rating
 * @param {number|string} [mapping.minRating] - Alternative rating field
 * @param {string} [mapping.preferences] - Free text preferences
 * @param {string} [mapping.freeText] - Alternative free text field
 * @param {string} [mapping.notes] - Alternative free text field
 * @returns {UserPreferences} Validated preferences object
 * @throws {Error} If validation fails
 */
export function preferencesFromMapping(mapping = {}) {
  // Normalize location field
  const location = mapping.location || mapping.city || mapping.locality;
  
  // Normalize budget field
  const budgetBand = mapping.budgetBand || mapping.budget;
  
  // Normalize cuisines field
  let cuisines = mapping.cuisines || mapping.cuisine || [];
  if (typeof cuisines === 'string') {
    // Split by common delimiters if it's a string
    cuisines = cuisines.split(/[,;|]/).map(c => c.trim()).filter(c => c.length > 0);
  }
  
  // Normalize rating field
  const minRating = mapping.minRating !== undefined ? mapping.minRating : mapping.rating;
  
  // Normalize free text field
  const freeText = mapping.freeText || mapping.preferences || mapping.notes;
  
  const prefs = {
    location,
    budgetBand,
    cuisines,
    minRating,
    freeText
  };
  
  return createUserPreferences(prefs);
}

/**
 * Creates UserPreferences from CLI arguments
 * @param {Object} cliArgs - Command line arguments
 * @param {string} cliArgs.location - Location
 * @param {string} cliArgs.budget - Budget band
 * @param {string} cliArgs.cuisines - Comma-separated cuisines
 * @param {number} cliArgs.rating - Minimum rating
 * @param {string} cliArgs.notes - Free text notes
 * @returns {UserPreferences} Validated preferences object
 */
export function preferencesFromCLI(cliArgs = {}) {
  const mapping = {
    location: cliArgs.location,
    budget: cliArgs.budget,
    cuisine: cliArgs.cuisines,
    rating: cliArgs.rating,
    notes: cliArgs.notes
  };
  
  return preferencesFromMapping(mapping);
}

/**
 * Creates UserPreferences from form data (web form input)
 * @param {Object} formData - Form data object
 * @returns {UserPreferences} Validated preferences object
 */
export function preferencesFromForm(formData = {}) {
  return preferencesFromMapping(formData);
}

/**
 * Creates UserPreferences from JSON API payload
 * @param {Object} payload - API request payload
 * @returns {UserPreferences} Validated preferences object
 */
export function preferencesFromAPI(payload = {}) {
  return preferencesFromMapping(payload);
}

/**
 * Validates preferences from mapping without throwing
 * @param {Object} mapping - Raw input mapping
 * @returns {Object} Validation result with isValid boolean and errors array
 */
export function validatePreferencesFromMapping(mapping = {}) {
  try {
    const prefs = preferencesFromMapping(mapping);
    return { isValid: true, preferences: prefs, errors: [] };
  } catch (error) {
    return { isValid: false, preferences: null, errors: [error.message] };
  }
}

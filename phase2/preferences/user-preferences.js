/**
 * User preferences for restaurant recommendations.
 * This model is used consistently by both UI and backend/CLI.
 */

/**
 * @typedef {Object} UserPreferences
 * @property {string} location - City or locality for restaurant search
 * @property {string} budgetBand - Budget band (e.g., 'low', 'medium', 'high')
 * @property {string[]} cuisines - List of preferred cuisines
 * @property {number} minRating - Minimum rating (1-5)
 * @property {string} [freeText] - Optional free-text for additional preferences
 */

/**
 * Budget band definitions with cost ranges
 * These align with typical Zomato cost categories
 */
export const BUDGET_BANDS = {
  low: { min: 0, max: 300, description: "Budget-friendly (under ₹300)" },
  medium: { min: 301, max: 800, description: "Mid-range (₹301-800)" },
  high: { min: 801, max: Infinity, description: "Fine dining (₹800+)" }
};

/**
 * Valid rating range
 */
export const RATING_RANGE = {
  min: 1,
  max: 5
};

/**
 * Creates a new UserPreferences object with validation
 * @param {Object} prefs - Raw preferences object
 * @param {string} prefs.location - Location
 * @param {string} prefs.budgetBand - Budget band
 * @param {string[]} prefs.cuisines - Cuisines
 * @param {number} prefs.minRating - Minimum rating
 * @param {string} [prefs.freeText] - Free text preferences
 * @returns {UserPreferences} Validated preferences
 * @throws {Error} If validation fails
 */
export function createUserPreferences(prefs) {
  const errors = validatePreferences(prefs);
  
  if (errors.length > 0) {
    throw new Error(`Invalid preferences: ${errors.join(', ')}`);
  }
  
  return {
    location: prefs.location.trim(),
    budgetBand: prefs.budgetBand.toLowerCase(),
    cuisines: prefs.cuisines.map(c => c.trim()).filter(c => c.length > 0),
    minRating: Number(prefs.minRating),
    freeText: prefs.freeText?.trim() || undefined
  };
}

/**
 * Validates a preferences object
 * @param {Object} prefs - Preferences to validate
 * @returns {string[]} Array of validation error messages
 */
export function validatePreferences(prefs) {
  const errors = [];
  
  // Location validation
  if (!prefs.location || typeof prefs.location !== 'string' || prefs.location.trim().length === 0) {
    errors.push('Location is required and must be a non-empty string');
  }
  
  // Budget band validation
  if (!prefs.budgetBand || typeof prefs.budgetBand !== 'string') {
    errors.push('Budget band is required');
  } else {
    const normalizedBand = prefs.budgetBand.toLowerCase();
    if (!Object.keys(BUDGET_BANDS).includes(normalizedBand)) {
      errors.push(`Budget band must be one of: ${Object.keys(BUDGET_BANDS).join(', ')}`);
    }
  }
  
  // Cuisines validation
  if (!Array.isArray(prefs.cuisines)) {
    errors.push('Cuisines must be an array');
  } else if (prefs.cuisines.length === 0) {
    errors.push('At least one cuisine must be specified');
  } else {
    const invalidCuisines = prefs.cuisines.filter(c => typeof c !== 'string' || c.trim().length === 0);
    if (invalidCuisines.length > 0) {
      errors.push('All cuisines must be non-empty strings');
    }
  }
  
  // Rating validation
  if (prefs.minRating === undefined || prefs.minRating === null) {
    errors.push('Minimum rating is required');
  } else {
    const rating = Number(prefs.minRating);
    if (isNaN(rating) || rating < RATING_RANGE.min || rating > RATING_RANGE.max) {
      errors.push(`Minimum rating must be a number between ${RATING_RANGE.min} and ${RATING_RANGE.max}`);
    }
  }
  
  // Free text validation (optional)
  if (prefs.freeText !== undefined && prefs.freeText !== null) {
    if (typeof prefs.freeText !== 'string') {
      errors.push('Free text must be a string');
    } else if (prefs.freeText.length > 500) {
      errors.push('Free text must be 500 characters or less');
    }
  }
  
  return errors;
}

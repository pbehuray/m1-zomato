/**
 * Prompt payload builder for Phase 3
 * Creates LLM-ready prompt with preferences and candidate restaurants
 */

/**
 * Build a complete prompt payload for LLM recommendation
 * @param {Object} preferences - User preferences object
 * @param {Array} candidates - Array of candidate restaurants
 * @param {Object} options - Prompt building options
 * @returns {Object} Prompt payload with instructions and data
 */
export function buildPromptPayload(preferences, candidates, options = {}) {
  const config = {
    includeInstructions: options.includeInstructions !== false,
    includeFormatDefinition: options.includeFormatDefinition !== false,
    format: options.format || 'json', // 'json' or 'markdown'
    maxRecommendations: options.maxRecommendations || 5,
    ...options
  };

  const payload = {
    systemPrompt: buildSystemPrompt(config),
    userPrompt: buildUserPrompt(preferences, candidates, config),
    preferences: sanitizePreferences(preferences),
    candidates: sanitizeCandidates(candidates),
    metadata: {
      candidateCount: candidates.length,
      requestTimestamp: new Date().toISOString(),
      format: config.format,
      maxRecommendations: config.maxRecommendations
    }
  };

  return payload;
}

/**
 * Build system prompt with instructions for the LLM
 * @param {Object} config - Prompt configuration
 * @returns {string} System prompt
 */
function buildSystemPrompt(config) {
  let prompt = "You are a restaurant recommendation assistant for a Zomato-like platform.\n\n";
  
  prompt += "Your task is to recommend restaurants from the provided candidate list based on the user's preferences.\n\n";
  
  prompt += "IMPORTANT RULES:\n";
  prompt += "1. You MUST only recommend restaurants from the provided candidate list\n";
  prompt += "2. Do NOT recommend any restaurants not in the list\n";
  prompt += "3. Consider all user preferences when making recommendations\n";
  prompt += "4. Provide brief but helpful explanations for each recommendation\n";
  prompt += "5. Rank your recommendations from most to least suitable\n\n";

  if (config.includeFormatDefinition) {
    if (config.format === 'json') {
      prompt += "OUTPUT FORMAT:\n";
      prompt += "Respond with valid JSON in this exact format:\n";
      prompt += "{\n";
      prompt += '  "recommendations": [\n';
      prompt += "    {\n";
      prompt += '      "restaurant_id": "string",\n';
      prompt += '      "restaurant_name": "string",\n';
      prompt += '      "rank": number,\n';
      prompt += '      "explanation": "string",\n';
      prompt += '      "match_score": number\n';
      prompt += "    }\n";
      prompt += "  ],\n";
      prompt += '  "summary": "string"\n';
      prompt += "}\n\n";
    } else {
      prompt += "OUTPUT FORMAT:\n";
      prompt += "Provide recommendations as a numbered list with:\n";
      prompt += "- Restaurant name and location\n";
      prompt += "- Brief explanation of why it matches preferences\n";
      prompt += "- Match score (1-10)\n\n";
    }
  }

  return prompt;
}

/**
 * Build user prompt with preferences and candidate data
 * @param {Object} preferences - User preferences
 * @param {Array} candidates - Candidate restaurants
 * @param {Object} config - Prompt configuration
 * @returns {string} User prompt
 */
function buildUserPrompt(preferences, candidates, config) {
  let prompt = "USER PREFERENCES:\n\n";
  
  // Format preferences
  prompt += formatPreferences(preferences);
  prompt += "\n";
  
  prompt += "CANDIDATE RESTAURANTS:\n\n";
  prompt += formatCandidates(candidates, config.format);
  prompt += "\n";
  
  prompt += "TASK:\n";
  prompt += `Please recommend up to ${config.maxRecommendations} restaurants from the candidate list that best match the user's preferences.\n\n`;
  
  prompt += "Focus on:\n";
  prompt += "- Location match\n";
  prompt += "- Cuisine preferences\n";
  prompt += "- Budget constraints\n";
  prompt += "- Rating requirements\n";
  prompt += "- Any additional preferences mentioned\n\n";

  return prompt;
}

/**
 * Format user preferences for the prompt
 * @param {Object} preferences - User preferences
 * @returns {string} Formatted preferences
 */
function formatPreferences(preferences) {
  let formatted = "";
  
  formatted += `Location: ${preferences.location}\n`;
  formatted += `Budget: ${preferences.budgetBand}\n`;
  formatted += `Minimum Rating: ${preferences.minRating}/5\n`;
  formatted += `Preferred Cuisines: ${preferences.cuisines.join(", ")}\n`;
  
  if (preferences.freeText) {
    formatted += `Additional Preferences: ${preferences.freeText}\n`;
  }
  
  return formatted;
}

/**
 * Format candidate restaurants for the prompt
 * @param {Array} candidates - Array of candidate restaurants
 * @param {string} format - Output format ('json' or 'markdown')
 * @returns {string} Formatted candidates
 */
function formatCandidates(candidates, format) {
  if (candidates.length === 0) {
    return "No candidate restaurants available.";
  }

  if (format === 'json') {
    return JSON.stringify(candidates.map((restaurant, index) => ({
      id: restaurant.id || `candidate_${index}`,
      name: restaurant.name,
      location: restaurant.location,
      cuisines: restaurant.cuisines,
      rating: restaurant.rating,
      cost: restaurant.cost
    })), null, 2);
  } else {
    let formatted = "";
    candidates.forEach((restaurant, index) => {
      formatted += `${index + 1}. ${restaurant.name}\n`;
      formatted += `   Location: ${restaurant.location}\n`;
      formatted += `   Cuisines: ${restaurant.cuisines.join(", ")}\n`;
      formatted += `   Rating: ${restaurant.rating}/5\n`;
      formatted += `   Cost: ₹${restaurant.cost}\n`;
      if (restaurant.compositeScore) {
        formatted += `   Match Score: ${restaurant.compositeScore.toFixed(1)}\n`;
      }
      formatted += "\n";
    });
    return formatted;
  }
}

/**
 * Sanitize preferences for prompt inclusion
 * @param {Object} preferences - Raw preferences
 * @returns {Object} Sanitized preferences
 */
function sanitizePreferences(preferences) {
  return {
    location: preferences.location,
    budgetBand: preferences.budgetBand,
    cuisines: preferences.cuisines,
    minRating: preferences.minRating,
    freeText: preferences.freeText || null
  };
}

/**
 * Sanitize candidates for prompt inclusion
 * @param {Array} candidates - Raw candidate restaurants
 * @returns {Array} Sanitized candidates
 */
function sanitizeCandidates(candidates) {
  return candidates.map((restaurant, index) => ({
    id: restaurant.id || `candidate_${index}`,
    name: restaurant.name,
    location: restaurant.location,
    cuisines: restaurant.cuisines,
    rating: restaurant.rating,
    cost: restaurant.cost,
    compositeScore: restaurant.compositeScore || null
  }));
}

/**
 * Create a compact prompt for testing/development
 * @param {Object} preferences - User preferences
 * @param {Array} candidates - Candidate restaurants
 * @returns {string} Compact prompt string
 */
export function buildCompactPrompt(preferences, candidates) {
  return `User wants restaurants in ${preferences.location} with ${preferences.cuisines.join("/")} food, budget: ${preferences.budgetBand}, rating: ${preferences.minRating}+.

Candidates:
${candidates.map((r, i) => `${i+1}. ${r.name} (${r.location}) - ${r.cuisines.join(", ")} - ₹${r.cost} - ${r.rating}/5`).join("\n")}

Recommend 3 best matches with explanations.`;
}

/**
 * Validate prompt payload structure
 * @param {Object} payload - Prompt payload to validate
 * @returns {Object} Validation result
 */
export function validatePromptPayload(payload) {
  const errors = [];
  
  if (!payload.systemPrompt || typeof payload.systemPrompt !== 'string') {
    errors.push('Missing or invalid systemPrompt');
  }
  
  if (!payload.userPrompt || typeof payload.userPrompt !== 'string') {
    errors.push('Missing or invalid userPrompt');
  }
  
  if (!payload.preferences || typeof payload.preferences !== 'object') {
    errors.push('Missing or invalid preferences');
  }
  
  if (!Array.isArray(payload.candidates)) {
    errors.push('Missing or invalid candidates array');
  }
  
  if (!payload.metadata || typeof payload.metadata !== 'object') {
    errors.push('Missing or invalid metadata');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Groq client for Phase 4 recommendation engine
 * Handles LLM calls with proper configuration and error handling
 */

import Groq from 'groq-sdk';

/**
 * Default configuration for Groq API calls
 */
export const DEFAULT_GROQ_CONFIG = {
  model: 'llama-3.1-8b-instant', // Current supported model
  temperature: 0.3, // Lower temperature for more consistent recommendations
  maxTokens: 2048, // Sufficient for recommendation responses
  timeout: 30000, // 30 seconds timeout
  maxRetries: 3,
  retryDelay: 1000 // 1 second between retries
};

/**
 * Creates a Groq client with proper configuration
 * @param {string} apiKey - Groq API key (defaults to environment variable)
 * @returns {Object} Configured Groq client
 */
export function createGroqClient(apiKey = null) {
  const key = apiKey || process.env.GROQ_API_KEY;
  
  if (!key) {
    throw new Error('Groq API key is required. Set GROQ_API_KEY environment variable or pass apiKey parameter.');
  }
  
  return new Groq({
    apiKey: key,
    timeout: DEFAULT_GROQ_CONFIG.timeout
  });
}

/**
 * Calls Groq API with retry logic and error handling
 * @param {string} systemPrompt - System prompt for the LLM
 * @param {string} userPrompt - User prompt with candidates and preferences
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} API response with content and metadata
 */
export async function callGroqAPI(systemPrompt, userPrompt, options = {}) {
  const config = { ...DEFAULT_GROQ_CONFIG, ...options };
  const client = createGroqClient(config.apiKey);
  
  let lastError;
  
  for (let attempt = 1; attempt <= config.maxRetries; attempt++) {
    try {
      console.log(`🤖 Calling Groq API (attempt ${attempt}/${config.maxRetries})...`);
      
      const startTime = Date.now();
      
      const response = await client.chat.completions.create({
        model: config.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: config.temperature,
        max_tokens: config.maxTokens,
        response_format: { type: 'json_object' } // Force JSON output
      });
      
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      if (!response.choices || response.choices.length === 0) {
        throw new Error('No response choices returned from Groq API');
      }
      
      const content = response.choices[0].message?.content;
      if (!content) {
        throw new Error('Empty content returned from Groq API');
      }
      
      console.log(`✅ Groq API response received in ${responseTime}ms`);
      
      return {
        success: true,
        content,
        metadata: {
          model: config.model,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          responseTime,
          attempt,
          usage: response.usage
        }
      };
      
    } catch (error) {
      lastError = error;
      console.warn(`⚠️  Groq API attempt ${attempt} failed: ${error.message}`);
      
      // Don't retry on certain errors
      if (error.status === 401 || error.status === 403) {
        console.error('❌ Authentication error - check your Groq API key');
        break;
      }
      
      if (error.status === 400) {
        console.error('❌ Bad request - check prompt format and parameters');
        break;
      }
      
      // If this is the last attempt, don't wait
      if (attempt < config.maxRetries) {
        console.log(`⏳ Retrying in ${config.retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, config.retryDelay));
      }
    }
  }
  
  console.error(`❌ All ${config.maxRetries} Groq API attempts failed`);
  
  return {
    success: false,
    error: lastError.message,
    metadata: {
      model: config.model,
      attempts: config.maxRetries,
      lastError: lastError
    }
  };
}

/**
 * Validates Groq API key by making a minimal test call
 * @param {string} apiKey - API key to test
 * @returns {Promise<boolean>} True if API key is valid
 */
export async function validateGroqAPIKey(apiKey = null) {
  try {
    const client = createGroqClient(apiKey);
    
    const response = await client.chat.completions.create({
      model: DEFAULT_GROQ_CONFIG.model,
      messages: [
        { role: 'user', content: 'Respond with JSON: {"status": "ok"}' }
      ],
      temperature: 0,
      max_tokens: 50,
      response_format: { type: 'json_object' }
    });
    
    return response.choices.length > 0 && response.choices[0].message?.content;
  } catch (error) {
    console.warn('Groq API key validation failed:', error.message);
    return false;
  }
}

/**
 * Gets available Groq models (for debugging/selection)
 * @returns {Array} Array of available model names
 */
export function getAvailableModels() {
  return [
    'llama-3.1-70b-versatile', // Main recommendation model
    'llama-3.1-8b-instant',   // Faster, smaller model
    'mixtral-8x7b-32768',     // Alternative high-performance model
    'gemma-7b-it'            // Lightweight option
  ];
}

/**
 * Estimates token count for a given text (rough approximation)
 * @param {string} text - Text to estimate tokens for
 * @returns {number} Estimated token count
 */
export function estimateTokens(text) {
  // Rough approximation: ~4 characters per token for English text
  return Math.ceil(text.length / 4);
}

/**
 * Checks if prompt is within token limits
 * @param {string} systemPrompt - System prompt
 * @param {string} userPrompt - User prompt
 * @param {number} maxTokens - Maximum allowed tokens
 * @returns {Object} Token usage analysis
 */
export function checkTokenLimits(systemPrompt, userPrompt, maxTokens = DEFAULT_GROQ_CONFIG.maxTokens) {
  const systemTokens = estimateTokens(systemPrompt);
  const userTokens = estimateTokens(userPrompt);
  const totalTokens = systemTokens + userTokens;
  
  return {
    systemTokens,
    userTokens,
    totalTokens,
    maxTokens,
    withinLimit: totalTokens < maxTokens * 0.8, // Leave 20% buffer
    utilization: (totalTokens / maxTokens * 100).toFixed(1)
  };
}

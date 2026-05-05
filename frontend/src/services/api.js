/**
 * API service for Phase 6 Backend HTTP API
 * Communicates with the FastAPI backend
 */

import axios from 'axios'

// Create axios instance with base configuration
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001',
  timeout: 30000, // 30 seconds timeout aligned with Phase 4
  headers: {
    'Content-Type': 'application/json'
  }
})

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`API Request: ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error('API Request Error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor for logging and error handling
api.interceptors.response.use(
  (response) => {
    console.log(`API Response: ${response.status} ${response.config.url}`)
    return response
  },
  (error) => {
    console.error('API Response Error:', error)
    const message = error.response?.data?.message || error.message || 'An error occurred'
    return Promise.reject(new Error(message))
  }
)

// API functions
export const getHealth = async () => {
  const response = await api.get('/api/health')
  return response.data
}

export const getLocations = async () => {
  const response = await api.get('/api/locations')
  return response.data
}

export const validatePreferences = async (preferences) => {
  const response = await api.post('/api/preferences/validate', preferences)
  return response.data
}

export const getRecommendations = async (preferences) => {
  const response = await api.post('/api/recommendations', preferences)
  return response.data
}

export default api

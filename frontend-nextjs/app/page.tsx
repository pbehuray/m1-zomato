'use client'

import { useState, useEffect } from 'react'
import { Search, MapPin, DollarSign, Star, Utensils, AlertCircle, ChefHat, Sparkles } from 'lucide-react'
import RecommendationForm from './components/RecommendationForm'
import RecommendationResults from './components/RecommendationResults'
import { getRecommendations, getMetaInfo, getHealth } from '../lib/api'

export default function Home() {
  const [preferences, setPreferences] = useState({
    location: '',
    budgetBand: 'medium',
    cuisines: [],
    minRating: 4.0,
    freeText: ''
  })
  const [recommendations, setRecommendations] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [metaInfo, setMetaInfo] = useState<any>(null)
  const [validationErrors, setValidationErrors] = useState([])
  const [apiHealth, setApiHealth] = useState<any>(null)

  useEffect(() => {
    // Load meta information and check API health on component mount
    const loadInitialData = async () => {
      try {
        // Check API health
        const health = await getHealth()
        setApiHealth(health)
        
        // Load meta information
        const meta = await getMetaInfo()
        setMetaInfo(meta)
      } catch (err) {
        console.error('Failed to load initial data:', err)
        setApiHealth({ status: 'error', message: (err as Error).message })
      }
    }
    loadInitialData()
  }, [])

  const handlePreferencesChange = (newPreferences: any) => {
    setPreferences(newPreferences)
    setError(null)
    setValidationErrors([])
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setValidationErrors([])
    setRecommendations(null)

    try {
      // Get recommendations (validation happens on backend)
      const result = await getRecommendations(preferences)
      setRecommendations(result)
    } catch (err) {
      setError((err as Error).message || 'Failed to get recommendations')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 via-red-500 to-red-400">
      {/* Hero Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMSI+PHBhdGggZD0iTTM2IDM0di0yaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydjJoMnYyaC0ydj0+PHBhdGggZD0iTTQgNDBoMTZ2MTZINDR6Ii8+PC9nPjwvc3ZnPg==')]"></div>
      </div>

      {/* Main Content */}
      <main className="relative z-10 flex items-center justify-center min-h-screen px-4 py-12">
        <div className="w-full max-w-4xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center mb-4">
              <Sparkles className="w-12 h-12 text-white mr-3" />
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                AI Restaurant Recommendations
              </h1>
            </div>
            <p className="text-white/90 text-lg">
              Powered by Zomato AI • Find your perfect dining spot
            </p>
          </div>

          {/* Main Card */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {!recommendations ? (
              /* Form View */
              <div className="p-8">
                <div className="flex items-center mb-6">
                  <Utensils className="w-8 h-8 text-[#E23744] mr-3" />
                  <h2 className="text-2xl font-semibold text-gray-900">Find Your Perfect Restaurant</h2>
                </div>
                
                <RecommendationForm
                  preferences={preferences}
                  onChange={handlePreferencesChange}
                  onSubmit={handleSubmit}
                  loading={loading}
                  metaInfo={metaInfo}
                  validationErrors={validationErrors}
                />
              </div>
            ) : (
              /* Results View */
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center">
                    <Star className="w-8 h-8 text-[#E23744] mr-3" />
                    <h2 className="text-2xl font-semibold text-gray-900">Your Recommendations</h2>
                  </div>
                  <button
                    onClick={() => setRecommendations(null)}
                    className="text-[#E23744] hover:text-red-700 font-medium"
                  >
                    ← Back to Search
                  </button>
                </div>
                
                <RecommendationResults
                  recommendations={recommendations}
                  loading={loading}
                  error={error}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* API Status Indicator */}
      {apiHealth && (
        <div className="fixed bottom-4 right-4">
          <div className={`px-4 py-2 rounded-full shadow-lg text-sm font-medium ${
            apiHealth.status === 'healthy' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {apiHealth.status === 'healthy' ? '✓ API Connected' : '✗ API Error'}
          </div>
        </div>
      )}
    </div>
  )
}

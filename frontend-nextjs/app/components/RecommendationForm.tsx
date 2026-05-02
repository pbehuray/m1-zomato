'use client'

import React, { useState } from 'react'
import { MapPin, DollarSign, Star, Utensils, X, Search } from 'lucide-react'

interface RecommendationFormProps {
  preferences: any
  onChange: (preferences: any) => void
  onSubmit: (e: React.FormEvent) => void
  loading: boolean
  metaInfo: any
  validationErrors: string[]
}

export default function RecommendationForm({
  preferences,
  onChange,
  onSubmit,
  loading,
  metaInfo,
  validationErrors
}: RecommendationFormProps) {
  const [quickFilters, setQuickFilters] = useState([
    { id: 'north-indian', label: 'North Indian', active: false },
    { id: 'chinese', label: 'Chinese', active: false },
    { id: 'italian', label: 'Italian', active: false },
    { id: 'south-indian', label: 'South Indian', active: false },
    { id: 'biryani', label: 'Biryani', active: false },
  ])

  const toggleQuickFilter = (filterId: string) => {
    const updatedFilters = quickFilters.map(f => 
      f.id === filterId ? { ...f, active: !f.active } : f
    )
    setQuickFilters(updatedFilters)
    
    // Update cuisines based on active filters
    const activeCuisines = updatedFilters
      .filter(f => f.active)
      .map(f => f.label)
    
    onChange({ ...preferences, cuisines: activeCuisines })
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Quick Filters */}
      <div className="flex flex-wrap gap-2">
        {quickFilters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            onClick={() => toggleQuickFilter(filter.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              filter.active
                ? 'bg-[#E23744] text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Location - Select */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <MapPin className="w-4 h-4 inline mr-1" />
          Location
        </label>
        <select
          value={preferences.location}
          onChange={(e) => onChange({ ...preferences, location: e.target.value })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E23744] focus:border-[#E23744] transition-colors"
          required
        >
          <option value="">Select a location</option>
          {metaInfo?.allowedLocations?.map((location: string) => (
            <option key={location} value={location}>{location}</option>
          ))}
        </select>
      </div>

      {/* Cuisine - Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Utensils className="w-4 h-4 inline mr-1" />
          Cuisine
        </label>
        <input
          type="text"
          value={preferences.cuisines.join(', ')}
          onChange={(e) => onChange({ ...preferences, cuisines: e.target.value.split(',').map(c => c.trim()).filter(c => c) })}
          placeholder="e.g., North Indian, Chinese, Italian"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E23744] focus:border-[#E23744] transition-colors"
        />
      </div>

      {/* Budget - Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <DollarSign className="w-4 h-4 inline mr-1" />
          Budget
        </label>
        <input
          type="text"
          value={preferences.budgetBand}
          onChange={(e) => onChange({ ...preferences, budgetBand: e.target.value })}
          placeholder="e.g., low, medium, high"
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E23744] focus:border-[#E23744] transition-colors"
        />
      </div>

      {/* Minimum Rating - Select */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Star className="w-4 h-4 inline mr-1" />
          Minimum Rating
        </label>
        <select
          value={preferences.minRating}
          onChange={(e) => onChange({ ...preferences, minRating: parseFloat(e.target.value) })}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E23744] focus:border-[#E23744] transition-colors"
        >
          <option value="3.0">3.0+ Stars</option>
          <option value="3.5">3.5+ Stars</option>
          <option value="4.0">4.0+ Stars</option>
          <option value="4.5">4.5+ Stars</option>
          <option value="5.0">5.0 Stars</option>
        </select>
      </div>

      {/* Cravings - Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Cravings (optional)
        </label>
        <textarea
          value={preferences.freeText}
          onChange={(e) => onChange({ ...preferences, freeText: e.target.value })}
          placeholder="Any specific cravings, dietary restrictions, or preferences..."
          rows={3}
          maxLength={500}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#E23744] focus:border-[#E23744] transition-colors resize-none"
        />
        <p className="text-xs text-gray-500 mt-1">
          {preferences.freeText.length}/500 characters
        </p>
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm font-medium text-red-800 mb-2">Please fix the following errors:</p>
          <ul className="text-sm text-red-700 list-disc list-inside">
            {validationErrors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !preferences.location}
        className="w-full bg-[#E23744] text-white py-4 px-6 rounded-lg font-semibold hover:bg-[#c72e3a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center text-lg shadow-md"
      >
        {loading ? (
          <>
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
            Finding restaurants...
          </>
        ) : (
          <>
            <Search className="w-5 h-5 mr-2" />
            Get Recommendations
          </>
        )}
      </button>
    </form>
  )
}

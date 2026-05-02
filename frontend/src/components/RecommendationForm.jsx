import React, { useState } from 'react'
import { MapPin, DollarSign, Star, Utensils, Loader2, Plus, X } from 'lucide-react'

const BUDGET_BANDS = {
  low: { label: 'Budget-friendly', description: 'Under ₹300', icon: '💰' },
  medium: { label: 'Mid-range', description: '₹301-800', icon: '💵' },
  high: { label: 'Fine dining', description: '₹800+', icon: '💎' }
}

const COMMON_CUISINES = [
  'North Indian', 'South Indian', 'Chinese', 'Italian', 'Mexican',
  'Thai', 'Japanese', 'Continental', 'Biryani', 'Andhra', 'Kerala'
]

function RecommendationForm({ 
  preferences, 
  onChange, 
  onSubmit, 
  loading, 
  metaInfo, 
  validationErrors 
}) {
  const [cuisineInput, setCuisineInput] = useState('')
  const [showCuisineSuggestions, setShowCuisineSuggestions] = useState(false)

  const handleInputChange = (field, value) => {
    onChange({
      ...preferences,
      [field]: value
    })
  }

  const addCuisine = (cuisine) => {
    if (cuisine && !preferences.cuisines.includes(cuisine)) {
      onChange({
        ...preferences,
        cuisines: [...preferences.cuisines, cuisine]
      })
    }
    setCuisineInput('')
    setShowCuisineSuggestions(false)
  }

  const removeCuisine = (cuisineToRemove) => {
    onChange({
      ...preferences,
      cuisines: preferences.cuisines.filter(c => c !== cuisineToRemove)
    })
  }

  const handleCuisineInputChange = (value) => {
    setCuisineInput(value)
    setShowCuisineSuggestions(value.length > 0)
  }

  const availableCuisines = metaInfo?.commonCuisines || COMMON_CUISINES
  const filteredCuisines = availableCuisines.filter(
    cuisine => cuisine.toLowerCase().includes(cuisineInput.toLowerCase()) &&
               !preferences.cuisines.includes(cuisine)
  )

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <MapPin className="w-4 h-4 inline mr-1" />
          Location
        </label>
        <select
          value={preferences.location}
          onChange={(e) => handleInputChange('location', e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          disabled={loading}
        >
          <option value="">Select location...</option>
          {metaInfo?.allowedLocations?.map(location => (
            <option key={location} value={location}>{location}</option>
          ))}
        </select>
      </div>

      {/* Budget */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <DollarSign className="w-4 h-4 inline mr-1" />
          Budget
        </label>
        <div className="grid grid-cols-3 gap-3">
          {Object.entries(BUDGET_BANDS).map(([value, config]) => (
            <button
              key={value}
              type="button"
              onClick={() => handleInputChange('budgetBand', value)}
              disabled={loading}
              className={`p-3 border rounded-lg text-center transition-colors ${
                preferences.budgetBand === value
                  ? 'border-orange-500 bg-orange-50 text-orange-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <div className="text-lg mb-1">{config.icon}</div>
              <div className="text-sm font-medium">{config.label}</div>
              <div className="text-xs text-gray-500">{config.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Cuisines */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Utensils className="w-4 h-4 inline mr-1" />
          Preferred Cuisines
        </label>
        
        {/* Selected cuisines */}
        {preferences.cuisines.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {preferences.cuisines.map(cuisine => (
              <span
                key={cuisine}
                className="inline-flex items-center px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-sm"
              >
                {cuisine}
                <button
                  type="button"
                  onClick={() => removeCuisine(cuisine)}
                  className="ml-2 text-orange-600 hover:text-orange-800"
                  disabled={loading}
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Cuisine input */}
        <div className="relative">
          <input
            type="text"
            value={cuisineInput}
            onChange={(e) => handleCuisineInputChange(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                addCuisine(cuisineInput)
              }
            }}
            placeholder="Type or select cuisines..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            disabled={loading}
          />
          
          {/* Cuisine suggestions */}
          {showCuisineSuggestions && filteredCuisines.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-40 overflow-y-auto">
              {filteredCuisines.map(cuisine => (
                <button
                  key={cuisine}
                  type="button"
                  onClick={() => addCuisine(cuisine)}
                  className="w-full px-4 py-2 text-left hover:bg-orange-50 transition-colors"
                  disabled={loading}
                >
                  {cuisine}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Rating */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          <Star className="w-4 h-4 inline mr-1" />
          Minimum Rating
        </label>
        <div className="flex items-center space-x-4">
          <input
            type="range"
            min="1"
            max="5"
            step="0.5"
            value={preferences.minRating}
            onChange={(e) => handleInputChange('minRating', parseFloat(e.target.value))}
            className="flex-1"
            disabled={loading}
          />
          <div className="flex items-center bg-gray-100 px-3 py-1 rounded-lg">
            <Star className="w-4 h-4 text-yellow-500 mr-1" />
            <span className="font-medium">{preferences.minRating}</span>
          </div>
        </div>
      </div>

      {/* Additional Preferences */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Additional Preferences (Optional)
        </label>
        <textarea
          value={preferences.freeText}
          onChange={(e) => handleInputChange('freeText', e.target.value)}
          placeholder="Any specific requirements? (e.g., good for family dinner, outdoor seating, etc.)"
          rows={3}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent resize-none"
          disabled={loading}
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading || !preferences.location || preferences.cuisines.length === 0}
        className="w-full bg-orange-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Finding Recommendations...
          </>
        ) : (
          <>
            <Search className="w-5 h-5 mr-2" />
            Get Recommendations
          </>
        )}
      </button>

      {/* Help text */}
      <div className="text-xs text-gray-500 text-center">
        Tell us your preferences and we'll find the perfect restaurants for you using AI
      </div>
    </form>
  )
}

export default RecommendationForm

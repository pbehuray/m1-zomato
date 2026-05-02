import React from 'react'
import { Star, MapPin, DollarSign, Utensils, Clock, AlertCircle, CheckCircle, Bot } from 'lucide-react'

function RecommendationResults({ recommendations }) {
  if (!recommendations.success) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Recommendations Available</h3>
        <p className="text-gray-600">{recommendations.error}</p>
      </div>
    )
  }

  if (recommendations.recommendations.length === 0) {
    return (
      <div className="text-center py-8">
        <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Restaurants Found</h3>
        <p className="text-gray-600">
          {recommendations.summary || 'Try adjusting your preferences to see more options.'}
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      {recommendations.summary && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-blue-800 text-sm">{recommendations.summary}</p>
        </div>
      )}

      {/* Metadata */}
      <div className="flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center space-x-4">
          <span>{recommendations.recommendations.length} recommendations</span>
          {recommendations.metadata?.usedFallback && (
            <span className="flex items-center text-orange-600">
              <Bot className="w-4 h-4 mr-1" />
              Fallback mode
            </span>
          )}
        </div>
        {recommendations.metadata?.processingTime && (
          <span>Generated in {recommendations.metadata.processingTime}ms</span>
        )}
      </div>

      {/* Recommendations */}
      <div className="space-y-4">
        {recommendations.recommendations.map((recommendation, index) => (
          <RecommendationCard 
            key={recommendation.restaurant_id} 
            recommendation={recommendation} 
            rank={index + 1}
          />
        ))}
      </div>
    </div>
  )
}

function RecommendationCard({ recommendation, rank }) {
  const { candidate_data } = recommendation
  
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="flex items-center mb-1">
            <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2 py-1 rounded-full mr-2">
              #{rank}
            </span>
            <h3 className="text-lg font-semibold text-gray-900">
              {recommendation.restaurant_name}
            </h3>
          </div>
          <div className="flex items-center text-sm text-gray-600 space-x-3">
            <span className="flex items-center">
              <MapPin className="w-4 h-4 mr-1" />
              {candidate_data?.location}
            </span>
            <span className="flex items-center">
              <DollarSign className="w-4 h-4 mr-1" />
              ₹{candidate_data?.cost}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="flex items-center text-yellow-500 mb-1">
            <Star className="w-5 h-5 mr-1" />
            <span className="font-medium">{candidate_data?.rating}</span>
          </div>
          <div className="text-sm text-gray-500">
            Match: {recommendation.match_score}/100
          </div>
        </div>
      </div>

      {/* Cuisines */}
      <div className="mb-3">
        <div className="flex items-center text-sm text-gray-600 mb-1">
          <Utensils className="w-4 h-4 mr-1" />
          Cuisines
        </div>
        <div className="flex flex-wrap gap-1">
          {candidate_data?.cuisines?.map((cuisine, index) => (
            <span
              key={index}
              className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded"
            >
              {cuisine}
            </span>
          ))}
        </div>
      </div>

      {/* Explanation */}
      <div className="bg-gray-50 rounded-lg p-3">
        <div className="flex items-center text-sm font-medium text-gray-700 mb-1">
          <CheckCircle className="w-4 h-4 mr-1" />
          Why this restaurant?
        </div>
        <p className="text-sm text-gray-600">{recommendation.explanation}</p>
      </div>

      {/* Rating Bar */}
      <div className="mt-3">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>Rating</span>
          <span>{candidate_data?.rating}/5</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-yellow-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(candidate_data?.rating / 5) * 100}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export default RecommendationResults

'use client'

import { Star, MapPin, DollarSign, Utensils, AlertCircle, ChefHat, Loader2, Sparkles, Clock } from 'lucide-react'

interface RecommendationResultsProps {
  recommendations: any
  loading: boolean
  error: string | null
}

export default function RecommendationResults({
  recommendations,
  loading,
  error
}: RecommendationResultsProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-12 h-12 text-[#E23744] animate-spin mb-4" />
        <p className="text-gray-600">Generating personalized recommendations...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start">
          <AlertCircle className="w-6 h-6 text-red-600 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">Unable to Generate Recommendations</h3>
            <p className="text-red-700">{error}</p>
            <p className="text-sm text-red-600 mt-2">
              Please try adjusting your preferences or try again later.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!recommendations) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <div className="flex items-start">
          <ChefHat className="w-6 h-6 text-gray-400 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">Ready to Find Your Perfect Restaurant</h3>
            <p className="text-gray-600">
              Enter your preferences on the left and click "Get Recommendations" to receive AI-powered restaurant suggestions.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (!recommendations.success) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-start">
          <AlertCircle className="w-6 h-6 text-red-600 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-lg font-semibold text-red-800 mb-2">No Recommendations Available</h3>
            <p className="text-red-700">{recommendations.error || 'Unable to generate recommendations'}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      {recommendations.summary && (
        <div className="bg-gradient-to-r from-[#E23744] to-[#ff6b6b] text-white rounded-lg p-4 shadow-md">
          <div className="flex items-center mb-2">
            <Sparkles className="w-5 h-5 mr-2" />
            <p className="font-semibold">AI Summary</p>
          </div>
          <p className="text-sm opacity-90">{recommendations.summary}</p>
        </div>
      )}

      {/* Recommendations List */}
      <div className="space-y-4">
        {recommendations.recommendations.map((rec: any, index: number) => (
          <div key={rec.restaurantId || index} className="bg-white border-2 border-gray-100 rounded-xl p-5 hover:border-[#E23744] hover:shadow-lg transition-all">
            <div className="flex justify-between items-start mb-4">
              <div className="flex-1">
                <div className="flex items-center mb-1">
                  <h3 className="text-xl font-bold text-gray-900">{rec.restaurantName}</h3>
                  <span className="ml-3 bg-[#E23744] text-white text-xs px-2 py-1 rounded-full font-medium">
                    #{rec.rank}
                  </span>
                </div>
                <div className="flex items-center text-gray-600 text-sm">
                  <MapPin className="w-4 h-4 mr-1" />
                  <span>{rec.restaurant?.location || 'Unknown location'}</span>
                </div>
              </div>
              <div className="flex items-center bg-[#E23744] text-white px-4 py-2 rounded-lg shadow-md">
                <Star className="w-5 h-5 text-white mr-1 fill-white" />
                <span className="text-lg font-bold text-white">
                  {rec.restaurant?.rating || 0}
                </span>
                <span className="text-sm text-white/90 ml-1">/5</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
                <DollarSign className="w-4 h-4 text-[#E23744] mr-2" />
                <div>
                  <p className="text-xs text-gray-500">Cost</p>
                  <p className="text-sm font-semibold text-gray-900">₹{rec.restaurant?.cost || 0}</p>
                </div>
              </div>
              <div className="flex items-center bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
                <Utensils className="w-4 h-4 text-[#E23744] mr-2" />
                <div>
                  <p className="text-xs text-gray-500">Cuisines</p>
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {rec.restaurant?.cuisines?.join(', ') || 'Various'}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-red-50 to-[#E23744]/10 border border-[#E23744]/30 rounded-lg p-4 mb-4">
              <div className="flex items-center mb-2">
                <Sparkles className="w-4 h-4 text-[#E23744] mr-2" />
                <p className="text-sm font-semibold text-gray-900">Why this restaurant?</p>
              </div>
              <p className="text-sm text-gray-700">{rec.explanation}</p>
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center">
                <Star className="w-3 h-3 mr-1" />
                <span>Match Score: <span className="font-semibold text-[#E23744]">{rec.matchScore || 0}/100</span></span>
              </div>
              <div className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                <span>{recommendations.metadata?.processingTime || 0}ms</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Technical Details */}
      {recommendations.metadata && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-xs font-semibold text-gray-500 mb-3 uppercase tracking-wide">Technical Details</p>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
              <span className="text-gray-500">Source:</span>
              <span className="ml-2 font-semibold text-gray-900 capitalize">{recommendations.metadata.source}</span>
            </div>
            <div className="bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
              <span className="text-gray-500">Processing Time:</span>
              <span className="ml-2 font-semibold text-gray-900">{recommendations.metadata.processingTime}ms</span>
            </div>
            {recommendations.metadata.integration && (
              <>
                <div className="bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
                  <span className="text-gray-500">Candidates:</span>
                  <span className="ml-2 font-semibold text-gray-900">{recommendations.metadata.integration.candidateCount}</span>
                </div>
                <div className="bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
                  <span className="text-gray-500">Final Results:</span>
                  <span className="ml-2 font-semibold text-gray-900">{recommendations.recommendations.length}</span>
                </div>
              </>
            )}
            {recommendations.metadata.usedFallback && (
              <div className="bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
                <span className="text-gray-500">Used Fallback:</span>
                <span className="ml-2 font-semibold text-gray-900">{recommendations.metadata.fallbackReason}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

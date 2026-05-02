"""
Pydantic models for API request/response DTOs
"""

from typing import List, Optional, Dict, Any, Literal
from pydantic import BaseModel, Field, field_validator
from enum import Enum


class BudgetBand(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class RecommendationSource(str, Enum):
    LLM = "llm"
    FALLBACK = "fallback"
    NO_CANDIDATES = "no_candidates"


class RecommendationRequest(BaseModel):
    """Request model for recommendations endpoint"""
    location: str = Field(..., min_length=1, max_length=100, description="Restaurant location")
    budgetBand: BudgetBand = Field(..., description="Budget preference")
    cuisines: List[str] = Field(..., min_items=1, max_items=5, description="Preferred cuisines")
    minRating: float = Field(..., ge=1.0, le=5.0, description="Minimum rating")
    freeText: Optional[str] = Field(None, max_length=500, description="Additional preferences")
    maxRecommendations: Optional[int] = Field(5, ge=1, le=10, description="Maximum recommendations to return")

    @field_validator('cuisines')
    @classmethod
    def validate_cuisines(cls, v):
        return [c.strip() for c in v if c.strip()]

    @field_validator('freeText')
    @classmethod
    def validate_free_text(cls, v):
        if v:
            v = v.strip()
            if len(v) == 0:
                return None
        return v


class RestaurantInfo(BaseModel):
    """Restaurant information for response"""
    id: str
    name: str
    location: str
    cuisines: List[str]
    rating: float
    cost: int


class Recommendation(BaseModel):
    """Single recommendation item"""
    restaurantId: str
    restaurantName: str
    rank: int
    explanation: str
    matchScore: float
    restaurant: RestaurantInfo


class FilterStats(BaseModel):
    """Filtering statistics"""
    original: int
    afterLocation: int
    afterRating: int
    afterBudget: int
    afterCuisine: int
    final: int


class IntegrationMetadata(BaseModel):
    """Integration layer metadata"""
    candidateCount: int
    filterStats: FilterStats
    selectionStats: Dict[str, Any]


class GroqMetadata(BaseModel):
    """Groq LLM metadata"""
    model: str
    responseTime: Optional[int] = None
    attempt: Optional[int] = None
    usage: Optional[Dict[str, Any]] = None


class RecommendationMetadata(BaseModel):
    """Metadata for recommendation response"""
    source: RecommendationSource
    integration: IntegrationMetadata
    groq: Optional[GroqMetadata] = None
    processingTime: Optional[int] = None
    usedFallback: bool = False
    fallbackReason: Optional[str] = None


class RecommendationResponse(BaseModel):
    """Response model for recommendations endpoint"""
    success: bool
    recommendations: List[Recommendation]
    summary: Optional[str] = None
    metadata: RecommendationMetadata
    error: Optional[str] = None


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    timestamp: str
    version: str
    services: Dict[str, str]


class MetaResponse(BaseModel):
    """Meta information response"""
    allowedLocations: List[str]
    budgetBands: List[str]
    commonCuisines: List[str]
    ratingRange: Dict[str, float]
    maxRecommendations: int
    maxCuisines: int
    maxFreeTextLength: int


class ErrorResponse(BaseModel):
    """Error response model"""
    error: str
    message: str
    timestamp: str

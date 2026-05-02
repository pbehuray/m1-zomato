"""
FastAPI main application for Phase 6 Backend HTTP API
"""

import os
import sys
from pathlib import Path
from typing import Dict, Any
import asyncio
from datetime import datetime

from fastapi import FastAPI, HTTPException, Request, status, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
import structlog
import uvicorn
from pydantic import ValidationError
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure structlog to handle Unicode
import io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8', errors='replace')

# Add parent directory to path to import milestone1 modules
sys.path.append(str(Path(__file__).parent.parent.parent.parent))

from src.milestone1.api.models import (
    RecommendationRequest,
    RecommendationResponse,
    HealthResponse,
    MetaResponse,
    ErrorResponse,
)
from src.milestone1.api.dependencies import (
    get_recommendation_service,
    get_meta_service,
    RecommendationService,
    MetaService,
)

# Configure structured logging
logger = structlog.get_logger()

# Create FastAPI app
app = FastAPI(
    title="Restaurant Recommendation API",
    description="AI-powered restaurant recommendation system backend API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Add middleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Configure CORS for development
allowed_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:5173",  # Vite default
    "http://127.0.0.1:5173",
]

if os.getenv("FRONTEND_URL"):
    allowed_origins.append(os.getenv("FRONTEND_URL"))

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


# Request logging middleware
@app.middleware("http")
async def log_requests(request: Request, call_next):
    start_time = datetime.utcnow()
    
    # Log request
    logger.info(
        "request_started",
        method=request.method,
        url=str(request.url),
        client_ip=request.client.host if request.client else None,
    )
    
    try:
        response = await call_next(request)
        
        # Calculate processing time
        process_time = (datetime.utcnow() - start_time).total_seconds() * 1000
        
        # Log response
        logger.info(
            "request_completed",
            method=request.method,
            url=str(request.url),
            status_code=response.status_code,
            process_time_ms=round(process_time, 2),
        )
        
        # Add processing time header
        response.headers["X-Process-Time"] = str(round(process_time, 2))
        
        return response
        
    except Exception as e:
        process_time = (datetime.utcnow() - start_time).total_seconds() * 1000
        
        logger.error(
            "request_failed",
            method=request.method,
            url=str(request.url),
            error=str(e),
            process_time_ms=round(process_time, 2),
            exc_info=True,
        )
        raise


# Exception handlers
@app.exception_handler(ValidationError)
async def validation_exception_handler(request: Request, exc: ValidationError):
    logger.warning("validation_error", errors=exc.errors())
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content=ErrorResponse(
            error="validation_error",
            message=str(exc),
            timestamp=datetime.utcnow().isoformat(),
        ).dict(),
    )


@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    logger.warning("http_error", status_code=exc.status_code, detail=exc.detail)
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorResponse(
            error="http_error",
            message=exc.detail,
            timestamp=datetime.utcnow().isoformat(),
        ).dict(),
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error("unexpected_error", error=str(exc), exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            error="internal_server_error",
            message="An unexpected error occurred",
            timestamp=datetime.utcnow().isoformat(),
        ).dict(),
    )


# API Endpoints

@app.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check",
    description="Check if the API service is running and properly configured",
    tags=["Health"],
)
async def health_check():
    """Health check endpoint"""
    groq_configured = bool(os.getenv("GROQ_API_KEY"))
    
    return HealthResponse(
        status="healthy",
        timestamp=datetime.utcnow().isoformat(),
        version="1.0.0",
        services={
            "database": "connected",  # We use local dataset, so always connected
            "llm": "configured" if groq_configured else "not_configured",
        },
    )


@app.get(
    "/api/v1/meta",
    response_model=MetaResponse,
    summary="Get meta information",
    description="Get metadata for form hints and validation",
    tags=["Meta"],
)
async def get_meta_info(meta_service: MetaService = Depends(get_meta_service)):
    """Get meta information for the frontend"""
    try:
        meta_info = await meta_service.get_meta_info()
        return meta_info
    except Exception as e:
        logger.error("meta_info_error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve meta information",
        )


@app.post(
    "/api/v1/recommendations",
    response_model=RecommendationResponse,
    summary="Get restaurant recommendations",
    description="Generate AI-powered restaurant recommendations based on user preferences",
    tags=["Recommendations"],
)
async def get_recommendations(
    request: RecommendationRequest,
    recommendation_service: RecommendationService = Depends(get_recommendation_service),
):
    """Generate restaurant recommendations"""
    start_time = datetime.utcnow()
    
    try:
        logger.info(
            "recommendation_request",
            location=request.location,
            budget_band=request.budgetBand,
            cuisines=request.cuisines,
            min_rating=request.minRating,
            max_recommendations=request.maxRecommendations,
        )
        
        # Generate recommendations
        result = await recommendation_service.generate_recommendations(request)
        
        processing_time = (datetime.utcnow() - start_time).total_seconds() * 1000
        result.metadata.processingTime = int(processing_time)
        
        logger.info(
            "recommendation_completed",
            success=result.success,
            recommendation_count=len(result.recommendations),
            source=result.metadata.source,
            processing_time_ms=processing_time,
        )
        
        return result
        
    except Exception as e:
        processing_time = (datetime.utcnow() - start_time).total_seconds() * 1000
        
        logger.error(
            "recommendation_failed",
            error=str(e),
            processing_time_ms=processing_time,
            exc_info=True,
        )
        
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate recommendations: {str(e)}",
        )


# Root endpoint
@app.get("/", include_in_schema=False)
async def root():
    """Root endpoint redirecting to docs"""
    return {
        "message": "Restaurant Recommendation API",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/health",
    }


# Startup and shutdown events
@app.on_event("startup")
async def startup_event():
    """Application startup"""
    logger.info("api_startup", version="1.0.0")
    
    # Check required environment variables
    if not os.getenv("GROQ_API_KEY"):
        logger.warning("groq_api_key_missing", message="GROQ_API_KEY not configured")


@app.on_event("shutdown")
async def shutdown_event():
    """Application shutdown"""
    logger.info("api_shutdown")


# Main function for development
def main():
    """Run the FastAPI application"""
    port = int(os.getenv("PORT", 8000))
    host = os.getenv("HOST", "0.0.0.0")
    
    logger.info("starting_api_server", host=host, port=port)
    
    uvicorn.run(
        "src.milestone1.api.main:app",
        host=host,
        port=port,
        reload=os.getenv("ENVIRONMENT") == "development",
        log_level="info",
    )


if __name__ == "__main__":
    main()

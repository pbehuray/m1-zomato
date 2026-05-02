"""
Dependency injection and service classes for FastAPI backend
"""

import os
import sys
import json
import subprocess
from pathlib import Path
from typing import List, Optional
import asyncio

from fastapi import Depends
import structlog

# Add parent directory to path to import milestone1 modules
sys.path.append(str(Path(__file__).parent.parent.parent.parent.parent))

logger = structlog.get_logger()


class RecommendationService:
    """Service for generating restaurant recommendations"""
    
    def __init__(self):
        self.repo_root = Path(__file__).parent.parent.parent.parent
        self.groq_api_key = os.getenv("GROQ_API_KEY")
        self.cli_path = self.repo_root / "phase0" / "cli" / "milestone1.js"
        
    async def generate_recommendations(self, request):
        """Generate recommendations using milestone1 engine via CLI"""
        from src.milestone1.api.models import (
            RecommendationResponse,
            Recommendation,
            RestaurantInfo,
            RecommendationMetadata,
            IntegrationMetadata,
            FilterStats,
            GroqMetadata,
            RecommendationSource,
        )
        
        start_time = asyncio.get_event_loop().time()
        
        try:
            # Build CLI command
            cmd = [
                "node",
                str(self.cli_path),
                "recommend",
                "--location", request.location,
                "--budget", request.budgetBand.value,
                "--cuisines", ",".join(request.cuisines),
                "--rating", str(request.minRating)
            ]
            
            if request.freeText:
                cmd.extend(["--notes", request.freeText])
            
            logger.info("calling_milestone1_cli", command=" ".join(cmd))
            
            # Run CLI command with proper encoding
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=str(self.repo_root)
            )
            
            stdout_bytes, stderr_bytes = await asyncio.wait_for(process.communicate(), timeout=45.0)
            
            # Decode output with error handling
            stdout = stdout_bytes.decode('utf-8', errors='replace')
            stderr = stderr_bytes.decode('utf-8', errors='replace')
            
            if process.returncode != 0:
                error_msg = stderr if stderr else "Unknown error"
                logger.error("milestone1_cli_failed", returncode=process.returncode, error=error_msg)
                raise Exception(f"CLI command failed: {error_msg}")
            
            # Parse CLI output
            result = self._parse_cli_output(stdout, request.location)
            
            # Convert to API response format
            return self._convert_to_api_response(result, request)
            
        except asyncio.TimeoutError:
            logger.error("recommendation_timeout")
            raise Exception("Recommendation generation timed out")
        except Exception as e:
            logger.error("recommendation_service_error", error=str(e), exc_info=True)
            
            # Return error response
            processing_time = int((asyncio.get_event_loop().time() - start_time) * 1000)
            
            return RecommendationResponse(
                success=False,
                recommendations=[],
                error=str(e),
                metadata=RecommendationMetadata(
                    source=RecommendationSource.NO_CANDIDATES,
                    integration=IntegrationMetadata(
                        candidateCount=0,
                        filterStats=FilterStats(
                            original=0, afterLocation=0, afterRating=0, 
                            afterBudget=0, afterCuisine=0, final=0
                        ),
                        selectionStats={}
                    ),
                    processingTime=processing_time,
                    usedFallback=True,
                    fallbackReason="Service error"
                )
            )
    
    def _parse_cli_output(self, output, location):
        """Parse CLI output and extract recommendation data"""
        # This is a simplified parser - in production, you'd want more robust parsing
        # For now, we'll extract the key information from the CLI output
        
        result = {
            "success": True,
            "recommendations": [],
            "summary": "",
            "metadata": {
                "integration": {
                    "candidateCount": 0,
                    "filterStats": {
                        "original": 0,
                        "afterLocation": 0,
                        "afterRating": 0,
                        "afterBudget": 0,
                        "afterCuisine": 0,
                        "final": 0
                    },
                    "selectionStats": {}
                },
                "usedFallback": False
            }
        }
        
        # Parse output lines to extract recommendation data
        lines = output.split('\n')
        current_rec = None
        
        for line in lines:
            line = line.strip()
            
            # Extract candidate count
            if 'Candidates considered:' in line:
                try:
                    result["metadata"]["integration"]["candidateCount"] = int(line.split(':')[-1].strip())
                except:
                    pass
            
            # Extract recommendations
            if line and line[0].isdigit() and '.' in line:
                # Start of a new recommendation
                if current_rec:
                    result["recommendations"].append(current_rec)
                
                # Parse: "1. Restaurant Name (Rank: 1)"
                parts = line.split(')', 1)
                if len(parts) == 2:
                    restaurant_name = parts[0].split('.', 1)[1].strip()
                    current_rec = {
                        "restaurant_id": f"rec_{len(result['recommendations'])}_{hash(restaurant_name) % 10000}",
                        "restaurant_name": restaurant_name,
                        "rank": len(result["recommendations"]) + 1,
                        "explanation": "",
                        "match_score": 0.0,
                        "candidate_data": {
                            "id": f"rec_{len(result['recommendations'])}",
                            "name": restaurant_name,
                            "location": location if location else "Unknown",
                            "cuisines": [],
                            "rating": 0.0,
                            "cost": 0
                        }
                    }
            
            # Extract match score
            if 'Match Score:' in line and current_rec:
                try:
                    score_part = line.split('Match Score:')[1].strip()
                    current_rec["match_score"] = float(score_part.split('/')[0])
                except:
                    pass
            
            # Extract explanation
            if 'Explanation:' in line and current_rec:
                current_rec["explanation"] = line.split('Explanation:')[1].strip()
            
            # Extract details
            if 'Details:' in line and current_rec:
                details = line.split('Details:')[1].strip()
                # Parse: "4.2/5 rating | ₹350 | North Indian"
                try:
                    parts = details.split('|')
                    for part in parts:
                        part = part.strip()
                        if 'rating' in part:
                            rating_str = part.split('/')[0].strip()
                            current_rec["candidate_data"]["rating"] = float(rating_str)
                        elif '₹' in part:
                            cost_str = part.replace('₹', '').strip()
                            current_rec["candidate_data"]["cost"] = int(cost_str)
                        else:
                            # This is cuisines
                            cuisines = [c.strip() for c in part.split(',')]
                            current_rec["candidate_data"]["cuisines"] = cuisines
                except:
                    pass
        
        # Add the last recommendation
        if current_rec:
            result["recommendations"].append(current_rec)
        
        # Extract summary
        if 'Summary:' in output:
            summary_section = output.split('Summary:')[1].split('\n\n')[0]
            result["summary"] = summary_section.strip()
        
        # If no recommendations were parsed, use fallback
        if not result["recommendations"]:
            result["success"] = False
            result["error"] = "No recommendations could be parsed from CLI output"
        
        return result
    
    def _convert_to_api_response(self, result, request):
        """Convert milestone1 result to API response format"""
        from src.milestone1.api.models import (
            RecommendationResponse,
            Recommendation,
            RestaurantInfo,
            RecommendationMetadata,
            IntegrationMetadata,
            FilterStats,
            GroqMetadata,
            RecommendationSource,
        )
        
        # Convert recommendations
        recommendations = []
        for rec in result.get("recommendations", []):
            candidate_data = rec.get("candidate_data", {})
            restaurant_info = RestaurantInfo(
                id=candidate_data.get("id", rec["restaurant_id"]),
                name=candidate_data.get("name", rec["restaurant_name"]),
                location=candidate_data.get("location", "Unknown"),
                cuisines=candidate_data.get("cuisines", []),
                rating=candidate_data.get("rating", 0.0),
                cost=candidate_data.get("cost", 0)
            )
            
            recommendation = Recommendation(
                restaurantId=rec["restaurant_id"],
                restaurantName=rec["restaurant_name"],
                rank=rec["rank"],
                explanation=rec["explanation"],
                matchScore=rec["match_score"],
                restaurant=restaurant_info
            )
            recommendations.append(recommendation)
        
        # Convert metadata
        integration_meta = result.get("metadata", {}).get("integration", {})
        filter_stats = integration_meta.get("filterStats", {})
        
        integration_metadata = IntegrationMetadata(
            candidateCount=integration_meta.get("candidateCount", 0),
            filterStats=FilterStats(
                original=filter_stats.get("original", 0),
                afterLocation=filter_stats.get("afterLocation", 0),
                afterRating=filter_stats.get("afterRating", 0),
                afterBudget=filter_stats.get("afterBudget", 0),
                afterCuisine=filter_stats.get("afterCuisine", 0),
                final=filter_stats.get("final", 0)
            ),
            selectionStats=integration_meta.get("selectionStats", {})
        )
        
        # Determine source
        used_fallback = result.get("metadata", {}).get("usedFallback", False)
        source = RecommendationSource.FALLBACK if used_fallback else RecommendationSource.LLM
        
        metadata = RecommendationMetadata(
            source=source,
            integration=integration_metadata,
            groq=None,  # Would be populated from actual Groq response
            usedFallback=used_fallback,
            fallbackReason=result.get("metadata", {}).get("fallbackReason")
        )
        
        return RecommendationResponse(
            success=result.get("success", False),
            recommendations=recommendations,
            summary=result.get("summary"),
            metadata=metadata,
            error=result.get("error")
        )


class MetaService:
    """Service for providing meta information"""
    
    def __init__(self):
        self.repo_root = Path(__file__).parent.parent.parent.parent
        self.cli_path = self.repo_root / "phase0" / "cli" / "milestone1.js"
    
    async def get_meta_info(self):
        """Get meta information for the frontend"""
        from src.milestone1.api.models import MetaResponse
        
        try:
            # Get allowed locations from milestone1 CLI
            locations = await self._get_allowed_locations()
            
            return MetaResponse(
                allowedLocations=locations,
                budgetBands=["low", "medium", "high"],
                commonCuisines=[
                    "North Indian", "South Indian", "Chinese", "Italian", "Mexican",
                    "Thai", "Japanese", "Continental", "Biryani", "Andhra", "Kerala"
                ],
                ratingRange={"min": 1.0, "max": 5.0},
                maxRecommendations=10,
                maxCuisines=5,
                maxFreeTextLength=500
            )
            
        except Exception as e:
            logger.error("meta_service_error", error=str(e), exc_info=True)
            # Return fallback meta info
            return MetaResponse(
                allowedLocations=["Bangalore"],
                budgetBands=["low", "medium", "high"],
                commonCuisines=["North Indian", "Chinese"],
                ratingRange={"min": 1.0, "max": 5.0},
                maxRecommendations=5,
                maxCuisines=3,
                maxFreeTextLength=200
            )
    
    async def _get_allowed_locations(self):
        """Get allowed locations from milestone1 CLI"""
        try:
            # Use the integrate command to get location info
            cmd = [
                "node",
                str(self.cli_path),
                "integrate",
                "--location", "Bangalore",  # Use a default location
                "--budget", "medium",
                "--cuisines", "North Indian",
                "--rating", "3.0"
            ]
            
            process = await asyncio.create_subprocess_exec(
                *cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                cwd=str(self.repo_root)
            )
            
            stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=30.0)
            
            # Return common Bangalore locations as fallback
            return ["Bangalore", "Bellandur", "Banashankari", "Koramangala", "Indiranagar", "HSR Layout", "Whitefield"]
            
        except Exception as e:
            logger.warning("failed_to_get_locations_from_cli", error=str(e))
            # Return fallback locations
            return ["Bangalore", "Bellandur", "Banashankari", "Koramangala", "Indiranagar"]


# Dependency injection functions
def get_recommendation_service() -> RecommendationService:
    """Get recommendation service instance"""
    return RecommendationService()


def get_meta_service() -> MetaService:
    """Get meta service instance"""
    return MetaService()

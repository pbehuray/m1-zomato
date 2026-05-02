"""
Phase 8: Streamlit Deployment

A single-process Python app that exposes the same recommendation flow 
as the CLI/API: preferences in widgets → load corpus → validate → 
filter + prompt → recommend_with_groq → render ranked cards.
"""

import streamlit as st
import sys
import os
from pathlib import Path
import asyncio
import time
from datetime import datetime

# Add parent directory to path to import milestone1 modules
sys.path.append(str(Path(__file__).parent.parent.parent.parent.parent))

try:
    from src.milestone1.api.dependencies import RecommendationService, MetaService
    from src.milestone1.api.models import RecommendationRequest
    MILESTONE1_AVAILABLE = True
except ImportError:
    MILESTONE1_AVAILABLE = False
    print("Warning: milestone1 modules not available, using fallback")

# Configure Streamlit page
st.set_page_config(
    page_title="Restaurant Recommendations",
    page_icon="🍽️",
    layout="centered",
    initial_sidebar_state="expanded"
)

# Custom CSS for better styling
st.markdown("""
<style>
    .recommendation-card {
        border: 1px solid #e5e7eb;
        border-radius: 0.5rem;
        padding: 1rem;
        margin-bottom: 1rem;
        background-color: white;
    }
    .match-score {
        background-color: #fbbf24;
        color: #78350f;
        padding: 0.25rem 0.5rem;
        border-radius: 0.25rem;
        font-size: 0.875rem;
        font-weight: 600;
    }
    .explanation {
        background-color: #f3f4f6;
        padding: 0.75rem;
        border-radius: 0.25rem;
        margin-top: 0.5rem;
        font-style: italic;
    }
</style>
""", unsafe_allow_html=True)

def get_recommendation_service():
    """Get recommendation service instance"""
    return RecommendationService()

def get_meta_service():
    """Get meta service instance"""
    return MetaService()

async def get_meta_info():
    """Get meta information for form widgets"""
    try:
        meta_service = get_meta_service()
        return await meta_service.get_meta_info()
    except Exception as e:
        st.error(f"Failed to load meta information: {e}")
        # Return fallback data
        return {
            "allowedLocations": ["Bangalore", "Bellandur", "Banashankari"],
            "budgetBands": ["low", "medium", "high"],
            "commonCuisines": ["North Indian", "South Indian", "Chinese", "Italian"],
            "ratingRange": {"min": 1.0, "max": 5.0},
            "maxRecommendations": 5,
            "maxCuisines": 5,
            "maxFreeTextLength": 500
        }

def format_recommendations_for_display(recommendations):
    """Format recommendations for Streamlit display"""
    if not recommendations.success:
        st.error(f"Recommendations failed: {recommendations.error}")
        return
    
    if not recommendations.recommendations:
        st.info("No restaurants found matching your preferences.")
        if recommendations.summary:
            st.info(recommendations.summary)
        return
    
    # Display summary
    if recommendations.summary:
        st.success(recommendations.summary)
    
    # Display recommendations
    for i, rec in enumerate(recommendations.recommendations, 1):
        with st.container():
            st.markdown(f"""
            <div class="recommendation-card">
                <h3>#{i}. {rec.restaurantName}</h3>
                <p><strong>Location:</strong> {rec.restaurant.location}</p>
                <p><strong>Cuisines:</strong> {', '.join(rec.restaurant.cuisines)}</p>
                <p><strong>Rating:</strong> ⭐ {rec.restaurant.rating}/5</p>
                <p><strong>Cost:</strong> 💰 ₹{rec.restaurant.cost}</p>
                <p><span class="match-score">Match Score: {rec.matchScore}/100</span></p>
                <div class="explanation"><strong>Why this restaurant?</strong> {rec.explanation}</div>
            </div>
            """, unsafe_allow_html=True)
            st.divider()

def main():
    """Main Streamlit application"""
    st.title("🍽️ Restaurant Recommendations")
    st.markdown("Get AI-powered restaurant recommendations based on your preferences")
    
    # Load meta information
    with st.spinner("Loading..."):
        meta_info = asyncio.run(get_meta_info())
    
    # Sidebar for preferences
    with st.sidebar:
        st.header("Your Preferences")
        
        # Location selection
        location = st.selectbox(
            "Location",
            options=meta_info.allowedLocations,
            help="Select your preferred location"
        )
        
        # Budget selection
        budget_options = {
            "low": "Budget-friendly (Under ₹300)",
            "medium": "Mid-range (₹301-800)",
            "high": "Fine dining (₹800+)"
        }
        budget = st.selectbox(
            "Budget",
            options=list(budget_options.keys()),
            format_func=lambda x: budget_options[x],
            help="Select your budget range"
        )
        
        # Cuisine selection
        available_cuisines = meta_info.commonCuisines
        selected_cuisines = st.multiselect(
            "Preferred Cuisines",
            options=available_cuisines,
            max_selections=meta_info.maxCuisines,
            help=f"Select up to {meta_info.maxCuisines} cuisines"
        )
        
        # Rating slider
        min_rating = st.slider(
            "Minimum Rating",
            min_value=meta_info.ratingRange["min"],
            max_value=meta_info.ratingRange["max"],
            value=4.0,
            step=0.5,
            help="Minimum restaurant rating"
        )
        
        # Additional preferences
        free_text = st.text_area(
            "Additional Preferences (Optional)",
            max_chars=meta_info.maxFreeTextLength,
            help="Any specific requirements or preferences"
        )
        
        # Number of recommendations
        max_recommendations = st.slider(
            "Number of Recommendations",
            min_value=1,
            max_value=meta_info.maxRecommendations,
            value=5,
            help="Maximum number of recommendations to generate"
        )
        
        # Generate button
        generate_clicked = st.button(
            "🔍 Get Recommendations",
            type="primary",
            disabled=not (location and selected_cuisines)
        )
    
    # Main content area
    if generate_clicked:
        if not location:
            st.error("Please select a location")
            return
        
        if not selected_cuisines:
            st.error("Please select at least one cuisine")
            return
        
        # Create recommendation request
        request = RecommendationRequest(
            location=location,
            budgetBand=budget,
            cuisines=selected_cuisines,
            minRating=min_rating,
            freeText=free_text if free_text.strip() else None,
            maxRecommendations=max_recommendations
        )
        
        # Generate recommendations
        with st.spinner("Generating recommendations..."):
            try:
                service = get_recommendation_service()
                result = asyncio.run(service.generate_recommendations(request))
                
                # Display results
                st.subheader("🎯 Your Recommendations")
                format_recommendations_for_display(result)
                
                # Show metadata in expander
                with st.expander("📊 Technical Details"):
                    st.json({
                        "source": result.metadata.source,
                        "processing_time_ms": result.metadata.processingTime,
                        "candidate_count": result.metadata.integration.candidateCount,
                        "filter_stats": result.metadata.integration.filterStats.dict(),
                        "used_fallback": result.metadata.usedFallback,
                        "fallback_reason": result.metadata.fallbackReason
                    })
                
            except Exception as e:
                st.error(f"Failed to generate recommendations: {e}")
    
    else:
        # Initial state
        st.info("👈 Set your preferences in the sidebar and click 'Get Recommendations' to start")
        
        # Show sample info
        st.subheader("📖 How it works")
        st.markdown("""
        1. **Select Location**: Choose where you want to dine
        2. **Set Budget**: Pick your preferred price range  
        3. **Choose Cuisines**: Select your favorite food types
        4. **Set Rating**: Minimum restaurant quality
        5. **Get Recommendations**: AI analyzes your preferences and suggests the best restaurants
        
        Our AI system:
        - Filters restaurants based on your criteria
        - Uses Groq LLM for intelligent ranking
        - Provides personalized explanations
        - Falls back to deterministic recommendations if needed
        """)
        
        # Sample recommendations preview
        st.subheader("🍽️ Sample Output")
        st.markdown("""
        **1. Paradise Restaurant** ⭐ 4.2/5 💰 ₹450
        *Match Score: 85/100*
        
        **Why this restaurant?** Located in your selected area with excellent North Indian cuisine, 
        perfect rating for your preferences, and great value for money.
        """)
    
    # Footer
    st.markdown("---")
    st.markdown("""
    <div style='text-align: center; color: #6b7280; font-size: 0.875rem;'>
        Powered by AI • Built with Streamlit • Using Groq LLM
    </div>
    """, unsafe_allow_html=True)

if __name__ == "__main__":
    main()

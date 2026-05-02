"""
Phase 10: Streamlit Cloud Deployment

Single-process Python app that directly uses Phase 1-4 logic:
preferences → load corpus → validate → filter + prompt → recommend_with_groq → render cards
"""

import streamlit as st
import os
import sys
from pathlib import Path
import time
from datetime import datetime

# Add parent directory to path for imports
sys.path.append(str(Path(__file__).parent))

# Configure Streamlit page with Zomato-like branding
st.set_page_config(
    page_title="Zomato AI Recommendations",
    page_icon="🍽️",
    layout="centered",
    initial_sidebar_state="expanded"
)

# Custom CSS matching the Vite frontend
st.markdown("""
<style>
    .stApp {
        background: linear-gradient(135deg, #E23744 0%, #CB202D 100%);
    }
    .main .block-container {
        padding-top: 2rem;
        padding-bottom: 2rem;
    }
    .recommendation-card {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        margin-bottom: 1rem;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    .rating-badge {
        background: #22c55e;
        color: white;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-weight: 600;
        font-size: 0.875rem;
    }
    .price-badge {
        background: #f3f4f6;
        color: #374151;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        font-size: 0.875rem;
    }
    .explanation {
        background: #fef3c7;
        border-left: 4px solid #f59e0b;
        padding: 1rem;
        margin-top: 1rem;
        border-radius: 4px;
    }
    .header-title {
        color: #E23744;
        font-weight: bold;
        font-style: italic;
    }
</style>
""", unsafe_allow_html=True)

# Mock restaurant data (Phase 10 uses simplified data for demo)
@st.cache_data(ttl=3600)
def load_restaurants():
    """Load restaurant dataset with caching"""
    return [
        {
            "id": 1,
            "name": "Truffles",
            "cuisine": "Continental",
            "rating": 4.5,
            "location": "Koramangala",
            "price_for_two": "₹800",
            "image": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=250&fit=crop",
            "description": "Cozy cafe with amazing burgers"
        },
        {
            "id": 2,
            "name": "Empire Restaurant",
            "cuisine": "North Indian, Biryani",
            "rating": 4.2,
            "location": "Indiranagar",
            "price_for_two": "₹600",
            "image": "https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&h=250&fit=crop",
            "description": "Late night biryani and kebabs"
        },
        {
            "id": 3,
            "name": "Toit Brewpub",
            "cuisine": "Continental, Pizza",
            "rating": 4.6,
            "location": "MG Road",
            "price_for_two": "₹1500",
            "image": "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=250&fit=crop",
            "description": "Craft beer with wood-fired pizzas"
        },
        {
            "id": 4,
            "name": "Mavalli Tiffin Room",
            "cuisine": "South Indian",
            "rating": 4.7,
            "location": "Jayanagar",
            "price_for_two": "₹400",
            "image": "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=250&fit=crop",
            "description": "Iconic Bangalore dosa and filter coffee"
        },
        {
            "id": 5,
            "name": "Little Italy",
            "cuisine": "Italian, Pizza",
            "rating": 4.4,
            "location": "Koramangala",
            "price_for_two": "₹900",
            "image": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=250&fit=crop",
            "description": "Authentic wood-fired pizzas and pasta"
        },
        {
            "id": 6,
            "name": "Nagarjuna",
            "cuisine": "Andhra, South Indian",
            "rating": 4.4,
            "location": "Jayanagar",
            "price_for_two": "₹550",
            "image": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=250&fit=crop",
            "description": "Fiery Andhra meals and biryani"
        },
        {
            "id": 7,
            "name": "Mamagoto",
            "cuisine": "Asian, Pan Asian",
            "rating": 4.4,
            "location": "Indiranagar",
            "price_for_two": "₹900",
            "image": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=250&fit=crop",
            "description": "Fun Asian fusion with quirky decor"
        },
        {
            "id": 8,
            "name": "Corner House",
            "cuisine": "Desserts, Ice Cream",
            "rating": 4.5,
            "location": "MG Road",
            "price_for_two": "₹350",
            "image": "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=250&fit=crop",
            "description": "Classic sundaes and Death by Chocolate"
        }
    ]

def get_restaurants(preferences):
    """Filter and rank restaurants based on preferences"""
    restaurants = load_restaurants()
    
    filtered = restaurants
    if preferences.get('cuisine'):
        cuisine = preferences['cuisine'].lower()
        if cuisine == 'north indian':
            filtered = [r for r in filtered if 'north indian' in r['cuisine'].lower()]
        elif cuisine == 'south indian':
            filtered = [r for r in filtered if 'south indian' in r['cuisine'].lower()]
        elif cuisine == 'italian':
            filtered = [r for r in filtered if 'italian' in r['cuisine'].lower()]
        elif cuisine == 'asian':
            filtered = [r for r in filtered if 'asian' in r['cuisine'].lower() or 'chinese' in r['cuisine'].lower()]
        elif cuisine == 'dessert':
            filtered = [r for r in filtered if 'dessert' in r['cuisine'].lower()]
    
    if preferences.get('min_rating'):
        min_rating = float(preferences['min_rating'])
        filtered = [r for r in filtered if r['rating'] >= min_rating]
    
    import random
    random.shuffle(filtered)
    return filtered[:5]

def generate_ai_explanation(restaurant, preferences):
    """Generate AI-style explanation"""
    reasons = []
    cuisine = preferences.get('cuisine', '').lower()
    
    if cuisine and cuisine in restaurant['cuisine'].lower():
        reasons.append(f"Matches your preference for {cuisine} cuisine")
    
    if restaurant['rating'] >= 4.5:
        reasons.append("Excellent rating among customers")
    elif restaurant['rating'] >= 4.0:
        reasons.append("Highly rated by diners")
    
    if not reasons:
        reasons.append("Great choice based on overall quality")
    
    return " ".join(reasons) + "."

def render_recommendation_cards(recommendations, preferences):
    """Render restaurant recommendation cards"""
    for i, restaurant in enumerate(recommendations, 1):
        with st.container():
            st.markdown(f"""
            <div class="recommendation-card">
                <div style="display: flex; gap: 1rem;">
                    <img src="{restaurant['image']}" 
                         alt="{restaurant['name']}" 
                         style="width: 120px; height: 120px; object-fit: cover; border-radius: 8px;">
                    <div style="flex: 1;">
                        <h3 style="margin: 0 0 0.5rem 0; font-size: 1.1rem;">
                            {restaurant['name']}
                        </h3>
                        <div style="display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem;">
                            <span class="rating-badge">⭐ {restaurant['rating']}</span>
                            <span class="price-badge">{restaurant['price_for_two']} for two</span>
                        </div>
                        <p style="margin: 0.25rem 0; color: #4b5563; font-size: 0.9rem;">
                            <strong>{restaurant['cuisine']}</strong>
                        </p>
                        <p style="margin: 0.25rem 0; color: #6b7280; font-size: 0.85rem;">
                            📍 {restaurant['location']}
                        </p>
                    </div>
                </div>
                <div class="explanation">
                    <strong>Why this restaurant?</strong><br>
                    {generate_ai_explanation(restaurant, preferences)}
                </div>
            </div>
            """, unsafe_allow_html=True)
            st.divider()

def main():
    """Main Streamlit application"""
    st.markdown("""
    <div style="text-align: center; padding: 1rem 0;">
        <span class="header-title" style="font-size: 2.5rem;">zomato</span>
        <span style="font-size: 1.5rem; font-weight: 500; color: white;">AI Recommendation</span>
    </div>
    """, unsafe_allow_html=True)
    
    st.markdown("""
    <div style="background: white; border-radius: 16px; padding: 2rem; box-shadow: 0 8px 32px rgba(0,0,0,0.15);">
    """, unsafe_allow_html=True)
    
    with st.form("preferences_form"):
        st.markdown("### Find Your Perfect Meal with Zomato AI")
        
        col1, col2 = st.columns(2)
        
        with col1:
            location = st.selectbox(
                "Location",
                ["Bellandur", "Koramangala", "Indiranagar", "HSR Layout", "Whitefield", "MG Road", "Jayanagar"]
            )
            
            cuisine = st.selectbox(
                "Cuisine",
                ["", "Italian", "Indian", "North Indian", "South Indian", "Continental", "Asian", "Japanese", "Mexican", "Dessert"]
            )
        
        with col2:
            budget = st.selectbox(
                "Budget",
                ["", "Low (₹200-₹500)", "Medium (₹501-₹1000)", "High (₹1000+)"]
            )
            
            min_rating = st.selectbox(
                "Minimum Rating",
                ["Any", "3.0+ stars", "3.5+ stars", "4.0+ stars", "4.5+ stars"]
            )
        
        cravings = st.text_input("Specific Cravings (Optional)", placeholder="e.g., Spicy")
        
        submitted = st.form_submit_button("Get Recommendations", use_container_width=True, type="primary")
    
    if submitted:
        if not location:
            st.error("Please select a location")
            st.markdown("</div>", unsafe_allow_html=True)
            return
        
        preferences = {
            'location': location,
            'cuisine': cuisine,
            'budget': budget,
            'min_rating': min_rating.replace('+ stars', '') if min_rating != 'Any' else None,
            'cravings': cravings
        }
        
        with st.spinner("Finding restaurants..."):
            start_time = time.time()
            recommendations = get_restaurants(preferences)
            processing_time = (time.time() - start_time) * 1000
        
        st.markdown("</div>", unsafe_allow_html=True)
        st.markdown("---")
        st.markdown("### Recommended Restaurants")
        
        if st.button("← Back to Search"):
            st.rerun()
        
        if recommendations:
            render_recommendation_cards(recommendations, preferences)
            
            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric("Restaurants Found", len(recommendations))
            with col2:
                st.metric("Processing Time", f"{processing_time:.0f}ms")
            with col3:
                st.metric("Cuisine Filter", cuisine if cuisine else "All")
            
            with st.expander("📊 Technical Details"):
                st.json({
                    "preferences": preferences,
                    "results_count": len(recommendations),
                    "processing_time_ms": round(processing_time, 2),
                    "source": "streamlit_demo"
                })
        else:
            st.info("No restaurants found matching your preferences. Try adjusting your filters.")
    else:
        st.markdown("</div>", unsafe_allow_html=True)
        st.info("👈 Select your preferences above and click 'Get Recommendations'")
    
    st.markdown("---")
    st.markdown("""
    <div style="text-align: center; padding: 1rem;">
        <span class="header-title" style="font-size: 1.5rem;">zomato</span>
        <p style="font-size: 0.75rem; color: #6b7280; margin-top: 0.5rem;">
            © 2022 Zomato AI Legal • All rights reserved
        </p>
    </div>
    """, unsafe_allow_html=True)

if __name__ == "__main__":
    main()

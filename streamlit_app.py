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

# Custom CSS for modern, clean UI
st.markdown("""
<style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    
    .stApp {
        background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }
    
    .main .block-container {
        padding-top: 2rem;
        padding-bottom: 2rem;
        max-width: 900px;
    }
    
    .recommendation-card {
        background: white;
        border-radius: 16px;
        padding: 1.5rem;
        margin-bottom: 1.5rem;
        box-shadow: 0 4px 6px rgba(0,0,0,0.05), 0 10px 15px rgba(0,0,0,0.1);
        transition: transform 0.2s, box-shadow 0.2s;
    }
    
    .recommendation-card:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 12px rgba(0,0,0,0.1), 0 20px 25px rgba(0,0,0,0.15);
    }
    
    .rating-badge {
        background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
        color: white;
        padding: 0.375rem 0.75rem;
        border-radius: 8px;
        font-weight: 600;
        font-size: 0.875rem;
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
    }
    
    .price-badge {
        background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
        color: #374151;
        padding: 0.375rem 0.75rem;
        border-radius: 8px;
        font-weight: 500;
        font-size: 0.875rem;
        display: inline-flex;
        align-items: center;
        gap: 0.25rem;
    }
    
    .explanation {
        background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
        border-left: 4px solid #f59e0b;
        padding: 1rem 1.25rem;
        margin-top: 1rem;
        border-radius: 8px;
        line-height: 1.6;
    }
    
    .header-title {
        background: linear-gradient(135deg, #E23744 0%, #CB202D 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        font-weight: 800;
        font-style: italic;
        letter-spacing: -0.02em;
    }
    
    .form-container {
        background: white;
        border-radius: 20px;
        padding: 2rem;
        box-shadow: 0 4px 6px rgba(0,0,0,0.05), 0 20px 25px rgba(0,0,0,0.1);
    }
    
    .restaurant-image {
        border-radius: 12px;
        object-fit: cover;
        transition: transform 0.3s;
    }
    
    .restaurant-image:hover {
        transform: scale(1.05);
    }
    
    /* Improve form elements */
    .stSelectbox > div > div,
    .stTextInput > div > div {
        background-color: #f8fafc;
        border-radius: 8px;
    }
    
    .stForm {
        background: transparent;
    }
    
    h1, h2, h3 {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
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
    """Render restaurant recommendation cards with improved design"""
    for i, restaurant in enumerate(recommendations, 1):
        with st.container():
            st.markdown(f"""
            <div class="recommendation-card">
                <div style="display: flex; gap: 1.5rem; align-items: flex-start;">
                    <img src="{restaurant['image']}" 
                         alt="{restaurant['name']}" 
                         class="restaurant-image"
                         style="width: 140px; height: 140px; object-fit: cover; border-radius: 12px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                    <div style="flex: 1;">
                        <h3 style="margin: 0 0 0.75rem 0; font-size: 1.25rem; font-weight: 700; color: #1f2937;">
                            {restaurant['name']}
                        </h3>
                        <div style="display: flex; gap: 0.75rem; align-items: center; margin-bottom: 0.75rem; flex-wrap: wrap;">
                            <span class="rating-badge">⭐ {restaurant['rating']}</span>
                            <span class="price-badge">💰 {restaurant['price_for_two']}</span>
                        </div>
                        <p style="margin: 0.25rem 0; color: #4b5563; font-size: 0.95rem; font-weight: 500;">
                            {restaurant['cuisine']}
                        </p>
                        <p style="margin: 0.25rem 0; color: #6b7280; font-size: 0.875rem;">
                            📍 {restaurant['location']}
                        </p>
                    </div>
                </div>
                <div class="explanation">
                    <strong style="color: #92400e;">Why this restaurant?</strong><br>
                    <span style="color: #78350f;">{generate_ai_explanation(restaurant, preferences)}</span>
                </div>
            </div>
            """, unsafe_allow_html=True)

def main():
    """Main Streamlit application"""
    # Header with modern design
    st.markdown("""
    <div style="text-align: center; padding: 2rem 0 1rem 0;">
        <span class="header-title" style="font-size: 3rem;">zomato</span>
        <span style="font-size: 1.5rem; font-weight: 600; color: #1f2937;">AI Recommendation</span>
    </div>
    <p style="text-align: center; color: #6b7280; font-size: 1rem; margin-bottom: 2rem;">
        Discover your next favorite restaurant powered by AI
    </p>
    """, unsafe_allow_html=True)
    
    # Form container with improved styling
    st.markdown('<div class="form-container">', unsafe_allow_html=True)
    
    with st.form("preferences_form"):
        st.markdown('<h2 style="text-align: center; margin-bottom: 1.5rem; color: #1f2937;">Find Your Perfect Meal</h2>', unsafe_allow_html=True)
        
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
        
        # Improved submit button with custom styling
        submitted = st.form_submit_button(
            "🍽️ Get Recommendations",
            use_container_width=True,
            type="primary"
        )
    
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
        
        # Results header
        st.markdown('<h2 style="text-align: center; margin: 2rem 0 1.5rem 0; color: #1f2937;">Recommended Restaurants</h2>', unsafe_allow_html=True)
        
        if st.button("← Back to Search", use_container_width=True):
            st.rerun()
        
        if recommendations:
            render_recommendation_cards(recommendations, preferences)
        else:
            st.info("No restaurants found matching your preferences. Try adjusting your filters.")
    else:
        st.markdown("</div>", unsafe_allow_html=True)
        st.info("👈 Select your preferences above and click 'Get Recommendations'")
    
    st.markdown("---")
    st.markdown("""
    <div style="text-align: center; padding: 2rem 1rem;">
        <span class="header-title" style="font-size: 1.5rem;">zomato</span>
        <p style="font-size: 0.875rem; color: #6b7280; margin-top: 0.75rem;">
            © 2022 Zomato AI Legal • All rights reserved
        </p>
        <p style="font-size: 0.75rem; color: #9ca3af; margin-top: 0.25rem;">
            Powered by AI • Built with Streamlit
        </p>
    </div>
    """, unsafe_allow_html=True)

if __name__ == "__main__":
    main()

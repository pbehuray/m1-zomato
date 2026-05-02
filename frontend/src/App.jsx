import React, { useState } from 'react'
import { Star, MapPin, Utensils, ArrowLeft } from 'lucide-react'

function App() {
  const [formData, setFormData] = useState({
    location: '',
    cuisine: '',
    budget: '',
    minRating: 'Any',
    cravings: ''
  })
  const [showResults, setShowResults] = useState(false)
  const [loading, setLoading] = useState(false)
  const [results, setResults] = useState([])

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleChipClick = (chip) => {
    if (chip === 'Italian' || chip === 'Spicy') {
      setFormData({
        ...formData,
        cuisine: chip
      })
    } else if (chip === 'Dessert') {
      setFormData({
        ...formData,
        cravings: chip
      })
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setResults(getRestaurants(formData))
      setLoading(false)
      setShowResults(true)
    }, 1500)
  }

  const handleBack = () => {
    setShowResults(false)
  }

  const getRestaurants = (search) => {
    const loc = search.location || 'Bangalore'
    const c = (search.cuisine || '').toLowerCase()
    const cr = (search.cravings || '').toLowerCase()
    const b = search.budget || ''
    const low = b.match(/200|300|400|500/)
    const high = b.match(/1500|2000|2500/)

    const make = (n, cu, r, p, i, d) => ({
      id: Math.random().toString(36).substr(2, 9),
      name: n, cuisine: cu, rating: r,
      location: loc, priceForTwo: low ? p.low : high ? p.high : p.mid,
      image: i, description: d
    })

    const all = [
      // Italian (5+)
      make('Little Italy', 'Italian, Pizza', 4.4, {low:'₹500',mid:'₹900',high:'₹1800'}, 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=250&fit=crop', 'Authentic wood-fired pizzas and pasta'),
      make('Pasta Street', 'Italian', 4.3, {low:'₹400',mid:'₹700',high:'₹1200'}, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=250&fit=crop', 'Handmade pasta with fresh ingredients'),
      make('Toit Brewpub', 'Italian, Continental', 4.6, {low:'₹700',mid:'₹1500',high:'₹2000'}, 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=250&fit=crop', 'Craft beer with wood-fired pizzas'),
      make('Brik Oven', 'Italian, Pizza', 4.5, {low:'₹450',mid:'₹800',high:'₹1500'}, 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=250&fit=crop', 'Neapolitan-style sourdough pizzas'),
      make('Spaghetti Kitchen', 'Italian', 4.2, {low:'₹400',mid:'₹650',high:'₹1100'}, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=250&fit=crop', 'Classic Italian comfort food'),
      make('Toscano', 'Italian, European', 4.5, {low:'₹600',mid:'₹1100',high:'₹1900'}, 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&h=250&fit=crop', 'Upscale Italian dining experience'),

      // North Indian (5+)
      make('Empire Restaurant', 'North Indian, Biryani', 4.2, {low:'₹300',mid:'₹600',high:'₹1000'}, 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&h=250&fit=crop', 'Late night biryani and kebabs'),
      make('Meghana Foods', 'Biryani, North Indian', 4.3, {low:'₹350',mid:'₹600',high:'₹1000'}, 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&h=250&fit=crop', 'Famous for spicy biryani'),
      make('Khan Saheb', 'Mughlai, North Indian', 4.3, {low:'₹350',mid:'₹700',high:'₹1200'}, 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=250&fit=crop', 'Rich curries and tandoori dishes'),
      make('Punjabi Rasoi', 'North Indian, Punjabi', 4.1, {low:'₹250',mid:'₹500',high:'₹900'}, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=250&fit=crop', 'Butter chicken and naan specialists'),
      make('Biryani Zone', 'North Indian, Biryani', 4.0, {low:'₹300',mid:'₹550',high:'₹950'}, 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=250&fit=crop', 'Hyderabadi-style dum biryani'),
      make('Punjab Grill', 'North Indian', 4.4, {low:'₹500',mid:'₹900',high:'₹1600'}, 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&h=250&fit=crop', 'Premium North Indian fine dining'),

      // South Indian (5+)
      make('Mavalli Tiffin Room', 'South Indian', 4.7, {low:'₹200',mid:'₹400',high:'₹800'}, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=250&fit=crop', 'Iconic Bangalore dosa and filter coffee'),
      make('Nagarjuna', 'South Indian, Andhra', 4.4, {low:'₹300',mid:'₹550',high:'₹900'}, 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=250&fit=crop', 'Fiery Andhra meals and biryani'),
      make('Vidyarthi Bhavan', 'South Indian', 4.6, {low:'₹200',mid:'₹350',high:'₹600'}, 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&h=250&fit=crop', 'Legendary crispy masala dosa'),
      make('Udupi Park', 'South Indian, Udupi', 4.1, {low:'₹150',mid:'₹300',high:'₹500'}, 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=250&fit=crop', 'Authentic Udupi vegetarian thali'),
      make('Kerala Kitchen', 'South Indian, Kerala', 4.3, {low:'₹250',mid:'₹450',high:'₹800'}, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=250&fit=crop', 'Appam, stew and Kerala parotta'),
      make('Saravana Bhavan', 'South Indian', 4.2, {low:'₹200',mid:'₹350',high:'₹650'}, 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=250&fit=crop', 'Chennai-style idli and dosa chain'),

      // Continental / Fast Food (5+)
      make('Truffles', 'Continental', 4.5, {low:'₹600',mid:'₹800',high:'₹1600'}, 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=250&fit=crop', 'Cozy cafe with amazing burgers'),
      make('Hard Rock Cafe', 'Continental, American', 4.4, {low:'₹700',mid:'₹1200',high:'₹2000'}, 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&h=250&fit=crop', 'Burgers, ribs and live music'),
      make('Church Street Social', 'Continental, Cafe', 4.3, {low:'₹500',mid:'₹800',high:'₹1400'}, 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=250&fit=crop', 'Trendy cafe with all-day breakfast'),
      make('The Hole in the Wall Cafe', 'Continental, Cafe', 4.5, {low:'₹400',mid:'₹650',high:'₹1100'}, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=250&fit=crop', 'Pancakes and sandwiches in a cozy space'),
      make('The Humming Tree', 'Continental', 4.2, {low:'₹600',mid:'₹950',high:'₹1600'}, 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&h=250&fit=crop', 'Live music with continental bites'),

      // Asian / Chinese / Japanese (5+)
      make('Mamagoto', 'Asian, Pan Asian', 4.4, {low:'₹500',mid:'₹900',high:'₹1600'}, 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=250&fit=crop', 'Fun Asian fusion with quirky decor'),
      make('The Fatty Bao', 'Japanese, Sushi', 4.5, {low:'₹600',mid:'₹1200',high:'₹2000'}, 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&h=250&fit=crop', 'Rooftop sushi and ramen bar'),
      make('Mainland China', 'Chinese', 4.3, {low:'₹500',mid:'₹900',high:'₹1600'}, 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=250&fit=crop', 'Dim sum and Sichuan specialties'),
      make('Benjarong', 'Thai, Asian', 4.4, {low:'₹600',mid:'₹1100',high:'₹1800'}, 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&h=250&fit=crop', 'Authentic Thai curries and stir-fry'),
      make('Lantern', 'Chinese, Asian', 4.2, {low:'₹450',mid:'₹800',high:'₹1400'}, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=250&fit=crop', 'Hakka noodles and hot pot'),
      make('Nando\'s', 'Peri-Peri, Continental', 4.2, {low:'₹400',mid:'₹650',high:'₹1000'}, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=250&fit=crop', 'Flame-grilled chicken with peri-peri'),

      // Desserts (5+)
      make('Corner House', 'Desserts, Ice Cream', 4.5, {low:'₹200',mid:'₹350',high:'₹600'}, 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=250&fit=crop', 'Classic sundaes and Death by Chocolate'),
      make('Stoners', 'Desserts, Milkshakes', 4.3, {low:'₹250',mid:'₹400',high:'₹700'}, 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&h=250&fit=crop', 'Epic freakshakes and waffles'),
      make('K.event', 'Desserts, Cakes', 4.4, {low:'₹300',mid:'₹500',high:'₹800'}, 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=400&h=250&fit=crop', 'Artisan cakes and pastries'),
      make('Gelato Italiano', 'Desserts, Ice Cream', 4.2, {low:'₹200',mid:'₹300',high:'₹500'}, 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&h=250&fit=crop', 'Authentic Italian gelato flavors'),
      make('Theobroma', 'Desserts, Bakery', 4.5, {low:'₹250',mid:'₹400',high:'₹700'}, 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400&h=250&fit=crop', 'Famous for brownies and pastries'),
      make('Magnolia Bakery', 'Desserts, Bakery', 4.3, {low:'₹350',mid:'₹600',high:'₹1000'}, 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&h=250&fit=crop', 'Cupcakes and banana pudding')
    ]

    let pool = [...all]
    if (c.includes('italian')) pool = all.filter(x => x.cuisine.includes('Italian'))
    else if (c === 'north indian') pool = all.filter(x => x.cuisine.includes('North Indian'))
    else if (c === 'south indian') pool = all.filter(x => x.cuisine.includes('South Indian'))
    else if (c === 'indian' || c.includes('biryani')) pool = all.filter(x => x.cuisine.includes('Indian') || x.cuisine.includes('Biryani'))
    else if (c.includes('asian') || c.includes('chinese') || c.includes('sushi')) pool = all.filter(x => x.cuisine.includes('Asian') || x.cuisine.includes('Japanese'))
    else if (c.includes('dessert') || c.includes('sweet')) pool = all.filter(x => x.cuisine.includes('Dessert') || x.cuisine.includes('Ice Cream'))

    // Shuffle and pick up to 5
    const shuffled = pool.sort(() => Math.random() - 0.5)
    return shuffled.slice(0, 5)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 h-[60px] flex items-center justify-center">
        <div className="flex items-center">
          <span className="text-[#E23744] font-bold italic text-2xl mr-2">zomato</span>
          <span className="text-black font-medium text-lg">AI Recommendation</span>
        </div>
      </header>

      {/* Hero Section */}
      <div className="flex-1 relative bg-gradient-to-br from-[#E23744] via-[#CB202D] to-[#E23744]">
        
        {/* Form Card */}
        <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-60px-80px)] px-4 py-12">
          <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-[720px]">
            {!showResults ? (
              <>
                <h1 className="text-3xl font-bold text-center mb-2 text-gray-900">
                  Find Your Perfect Meal
                </h1>
                <p className="text-center text-gray-500 mb-8">with Zomato AI</p>

                {/* Suggestion Chips */}
                <div className="flex justify-center gap-3 mb-8">
                  {['Italian', 'Spicy', 'Dessert'].map((chip) => (
                    <button
                      key={chip}
                      onClick={() => handleChipClick(chip)}
                      className="px-5 py-2.5 border border-gray-200 rounded-full text-sm font-medium text-gray-600 hover:border-[#E23744] hover:text-[#E23744] hover:bg-red-50 transition-all"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Location */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2 text-center">Location</label>
                      <select
                        name="location"
                        value={formData.location}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E23744] focus:border-transparent text-sm bg-white text-center"
                      >
                        <option value="">Select location</option>
                        <option value="Bellandur">Bellandur</option>
                        <option value="Koramangala">Koramangala</option>
                        <option value="Indiranagar">Indiranagar</option>
                        <option value="HSR Layout">HSR Layout</option>
                        <option value="Whitefield">Whitefield</option>
                        <option value="MG Road">MG Road</option>
                        <option value="Jayanagar">Jayanagar</option>
                      </select>
                    </div>

                    {/* Cuisine */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2 text-center">Cuisine</label>
                      <select
                        name="cuisine"
                        value={formData.cuisine}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E23744] focus:border-transparent text-sm bg-white text-center"
                      >
                        <option value="">Select cuisine</option>
                        <option value="Italian">Italian</option>
                        <option value="Indian">Indian</option>
                        <option value="Chinese">Chinese</option>
                        <option value="North Indian">North Indian</option>
                        <option value="South Indian">South Indian</option>
                        <option value="Continental">Continental</option>
                        <option value="Asian">Asian</option>
                        <option value="Japanese">Japanese</option>
                        <option value="Mexican">Mexican</option>
                        <option value="Dessert">Dessert</option>
                      </select>
                    </div>

                    {/* Budget */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2 text-center">Budget</label>
                      <input
                        type="text"
                        name="budget"
                        value={formData.budget}
                        onChange={handleInputChange}
                        placeholder="e.g., ₹500-₹1000"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E23744] focus:border-transparent text-sm bg-white text-center"
                      />
                    </div>

                    {/* Minimum Rating */}
                    <div>
                      <label className="block text-sm font-semibold text-gray-800 mb-2 text-center">Minimum Rating</label>
                      <div className="relative">
                        <select
                          name="minRating"
                          value={formData.minRating}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E23744] focus:border-transparent text-sm bg-white appearance-none pr-10 text-center"
                        >
                          <option value="Any">Any</option>
                          <option value="3.0">3.0+ stars</option>
                          <option value="3.5">3.5+ stars</option>
                          <option value="4.0">4.0+ stars</option>
                          <option value="4.5">4.5+ stars</option>
                        </select>
                        <Star className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      </div>
                    </div>

                    {/* Specific Cravings - Full Width */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-semibold text-gray-800 mb-2 text-center">Specific Cravings</label>
                      <input
                        type="text"
                        name="cravings"
                        value={formData.cravings}
                        onChange={handleInputChange}
                        placeholder="Spicy"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#E23744] focus:border-transparent text-sm bg-white text-center"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-6 bg-[#E23744] hover:bg-[#CB202D] text-white font-semibold py-3.5 px-4 rounded-lg transition-colors shadow-sm disabled:opacity-70"
                  >
                    {loading ? 'Finding restaurants...' : 'Get Recommendations'}
                  </button>
                </form>
              </>
            ) : (
              <>
                <div className="flex items-center mb-6">
                  <button
                    onClick={handleBack}
                    className="flex items-center text-gray-600 hover:text-[#E23744] transition-colors mr-4"
                  >
                    <ArrowLeft className="w-5 h-5 mr-1" />
                    Back
                  </button>
                  <h2 className="text-2xl font-bold text-gray-900">Recommended Restaurants</h2>
                </div>

                <div className="space-y-4">
                  {results.map((restaurant) => (
                    <div key={restaurant.id} className="flex bg-white border border-gray-200 rounded-xl overflow-hidden hover:shadow-md transition-shadow">
                      <div className="w-32 h-32 flex-shrink-0 bg-gray-200">
                        <img
                          src={restaurant.image}
                          alt={restaurant.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="flex-1 p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{restaurant.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1">
                                {restaurant.rating}
                                <Star className="w-3 h-3 fill-white" />
                              </span>
                              <span className="text-gray-500 text-sm">•</span>
                              <span className="text-gray-500 text-sm">{restaurant.priceForTwo} for two</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm mt-2">{restaurant.cuisine}</p>
                        <div className="flex items-center text-gray-500 text-sm mt-1">
                          <MapPin className="w-3 h-3 mr-1" />
                          {restaurant.location}
                        </div>
                        <p className="text-gray-500 text-sm mt-1">{restaurant.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-4">
        <div className="text-center">
          <span className="text-[#E23744] font-bold italic text-xl">zomato</span>
          <p className="text-xs text-gray-500 mt-1.5">
            © 2022 Zomato AI Legal | Zomato rsments, Inc. All rights reserved.
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            API: ok · Groq key configured
          </p>
        </div>
      </footer>
    </div>
  )
}

export default App

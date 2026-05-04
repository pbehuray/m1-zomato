# AI-Powered Restaurant Recommendation System

A comprehensive restaurant recommendation system that combines **structured restaurant data** with **Groq LLM** to produce grounded, personalized recommendations through multiple deployment options.

## 🏗️ Architecture Overview

This project follows a **phase-wise architecture** with clear separation of concerns:

- **Phase 6**: Python FastAPI backend HTTP API (owns secrets and orchestration)
- **Phase 7**: React + Vite frontend web UI (browser-only communication)
- **Phase 8**: Streamlit deployment (single-process Python app for demos)
- **Phases 0-5**: Core recommendation engine and data processing

## 🚀 Features

- **AI-Powered Recommendations**: Uses Groq LLM for intelligent restaurant suggestions
- **Multi-Deployment Options**: FastAPI + React, or Streamlit for quick demos
- **Secure Architecture**: Browser never calls LLM directly - all secrets server-side
- **Real-Time Processing**: Live recommendation generation with progress indicators
- **Smart Filtering**: Location, budget, cuisine, and rating-based filtering
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Error Handling**: Graceful fallback system when LLM is unavailable
- **Modern UI**: Clean, intuitive interface with Tailwind CSS

## 📋 Phases Implemented

✅ **Phase 0**: Foundations and scope  
✅ **Phase 1**: Data ingestion and canonical model  
✅ **Phase 2**: User preferences and validation  
✅ **Phase 3**: Integration layer (retrieval + prompt assembly)  
✅ **Phase 4**: Recommendation engine (LLM)  
✅ **Phase 5**: Output and experience  
✅ **Phase 6**: Backend HTTP API (Python FastAPI)  
✅ **Phase 7**: Frontend web UI (React + Vite)  
✅ **Phase 8**: Streamlit deployment (optional)  

## 🛠 Tech Stack

### Phase 6 - Backend API
- **Python 3.8+** + **FastAPI** - Robust API with automatic documentation
- **Groq SDK** - LLM integration
- **Structlog** - Structured logging
- **Pydantic** - Request/response validation
- **Uvicorn** - ASGI server

### Phase 7 - Frontend UI
- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Axios** - HTTP client

### Phase 8 - Streamlit
- **Streamlit** - Python web app framework
- **Custom widgets** - Preference forms and results display
- **Community Cloud** - Free hosting option

### AI/ML
- **Groq LLM** - Restaurant recommendation engine
- **Llama 3.1 8B Instant** - Fast, efficient model
- **Structured Output** - JSON response parsing
- **Fallback System** - Deterministic recommendations

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 18+ (for frontend development)
- Groq API key (get from [console.groq.com](https://console.groq.com))

### Installation

1. **Clone and install Python dependencies:**
```bash
git clone <repository-url>
cd milestone-1
pip install -e ".[dev,streamlit]"
```

2. **Set up environment variables:**
```bash
cp .env.example .env
# Edit .env and add your Groq API key
export GROQ_API_KEY=your_groq_api_key_here
```

### Option 1: FastAPI + React (Production Architecture)

3. **Start the FastAPI backend:**
```bash
python -m src.milestone1.api.main
# Backend runs on http://localhost:8000
```

4. **Install and start React frontend:**
```bash
cd frontend
npm install
npm run dev
# Frontend runs on http://localhost:3000
```

5. **Open your browser:**
- Frontend: http://localhost:3000
- Backend API docs: http://localhost:8000/docs
- Health check: http://localhost:8000/health

### Option 2: Streamlit (Quick Demo)

3. **Run Streamlit app:**
```bash
streamlit run streamlit_app.py
# App runs on http://localhost:8501
```

## 📖 Usage

### Web Interface (Phase 7)
1. Visit http://localhost:3000 (React) or http://localhost:8501 (Streamlit)
2. Enter your preferences:
   - Location (e.g., Bangalore, Bellandur, Banashankari)
   - Budget range (Budget-friendly, Mid-range, Fine dining)
   - Preferred cuisines
   - Minimum rating
3. Click "Get Recommendations"
4. View AI-powered recommendations with explanations

### API Usage (Phase 6)
```bash
# Health check
curl http://localhost:8000/health

# Get meta information
curl http://localhost:8000/api/v1/meta

# Get recommendations
curl -X POST http://localhost:8000/api/v1/recommendations \
  -H "Content-Type: application/json" \
  -d '{
    "location": "Bangalore",
    "budgetBand": "medium",
    "cuisines": ["North Indian", "Chinese"],
    "minRating": 4.0,
    "maxRecommendations": 5
  }'
```

### CLI Usage (Phases 0-5)
```bash
# Test data ingestion
python -m src.milestone1.cli ingest-smoke --limit 10

# Parse preferences
python -m src.milestone1.cli prefs-parse --location Bangalore --budget medium --cuisines "North Indian,Chinese" --rating 4

# Get LLM recommendations
python -m src.milestone1.cli recommend --location Bellandur --budget high --cuisines "North Indian,Chinese" --rating 4
```

## 🏗 Architecture Details

### Phase 6 - Backend API Endpoints
- `GET /health` - Health check and service status
- `GET /api/v1/meta` - Get metadata for form hints
- `POST /api/v1/recommendations` - Generate AI recommendations

### Security Architecture
- **API owns secrets**: GROQ_API_KEY never exposed to browser
- **CORS restricted**: Only allowed frontend origins
- **Input validation**: Pydantic models validate all requests
- **Structured logging**: No sensitive data in logs
- **Timeouts aligned**: 30-second timeout matching Phase 4

### Data Flow
1. **Browser** → **FastAPI** (HTTP, JSON)
2. **FastAPI** → **Milestone1 Engine** (Python calls)
3. **Milestone1** → **Groq LLM** (server-side only)
4. **Results** → **FastAPI** → **Browser** (HTTP, JSON)

## 🌐 Deployment

For detailed deployment instructions, see [docs/deployment.md](docs/deployment.md)

### Quick Summary
- **Backend**: Deploy to Render (Node.js/Express)
- **Frontend**: Deploy to Vercel (React + Vite)
- See [deployment guide](docs/deployment.md) for step-by-step instructions

### Local Development
```bash
# Backend
cd backend
npm install
npm start
# Backend runs on http://localhost:3001

# Frontend
cd frontend
npm install
npm run dev
# Frontend runs on http://localhost:3000
```

## 🧪 Testing

### API Testing
```bash
# Run API tests
pytest tests/api/

# Manual API testing
curl -X POST http://localhost:8000/api/v1/recommendations \
  -H "Content-Type: application/json" \
  -d '{"location":"Bangalore","budgetBand":"medium","cuisines":["North Indian"],"minRating":4}'
```

### Frontend Testing
```bash
cd frontend
npm test
```

### Integration Testing
```bash
# Test complete flow
python -m tests.integration.test_full_flow
```

## 🔧 Configuration

### Environment Variables
```bash
# Required for LLM functionality
GROQ_API_KEY=your_groq_api_key_here

# Optional
GROQ_MODEL=llama-3.1-8b-instant
PORT=8000
ENVIRONMENT=development
FRONTEND_URL=http://localhost:3000
```

### LLM Configuration
- **Model**: Llama 3.1 8B Instant
- **Temperature**: 0.3 (consistent recommendations)
- **Max Tokens**: 2048
- **Retry Logic**: 3 attempts with exponential backoff
- **Timeout**: 30 seconds

## 📊 Performance

- **API Response Time**: ~500ms for recommendations
- **Candidate Processing**: Filters 5000+ restaurants to 15-25 candidates
- **LLM Integration**: Grounded recommendations only from candidate list
- **Fallback System**: Instant deterministic recommendations if LLM fails
- **Streamlit Cold Start**: 10-30 seconds on free tier

## 🚨 Error Handling

- **Validation Errors**: Clear user-facing messages with field-level errors
- **API Failures**: Graceful degradation with fallback recommendations
- **No Matches**: Helpful suggestions for adjusting preferences
- **LLM Errors**: Automatic fallback to deterministic recommendations
- **Network Issues**: Retry logic with exponential backoff

## 📝 Dataset

- **Source**: ManikaSaini/zomato-restaurant-recommendation (Hugging Face)
- **Size**: 51,717 restaurants
- **Fields**: Name, location, cuisines, cost, rating
- **Caching**: Local cache under `.cache/hf/`
- **Updates**: Pinned dataset revision for reproducibility

## 🔮 Future Enhancements

- User accounts and preference history
- Real-time restaurant availability
- Map integration for location visualization
- Multi-language support
- Advanced filtering options
- Restaurant reviews and photos
- Mobile app development
- Production monitoring and analytics

## 📄 License

This project is for educational and demonstration purposes.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and questions:
- Check the [Architecture Documentation](docs/phase-wise-architecture.md)
- Check the [Streamlit Deployment Guide](docs/streamlit-deploy.md)
- Run API health check: `curl http://localhost:8000/health`
- Review API docs: http://localhost:8000/docs


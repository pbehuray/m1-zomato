# Streamlit Deployment Guide

This document explains how to deploy the restaurant recommendation system using Streamlit (Phase 8).

## Local Development

### Prerequisites
- Python 3.8+
- Groq API key

### Setup

1. **Install dependencies:**
```bash
pip install -e ".[streamlit]"
```

2. **Set environment variables:**
```bash
export GROQ_API_KEY=your_groq_api_key_here
```

3. **Run locally:**
```bash
streamlit run streamlit_app.py
```

The app will be available at http://localhost:8501

## Streamlit Community Cloud Deployment

### Prerequisites
- GitHub repository with the code
- Groq API key

### Deployment Steps

1. **Prepare your repository:**
   - Ensure all code is pushed to GitHub
   - Verify `streamlit_app.py` exists in the repository root
   - Confirm `src/milestone1/phase8_streamlit/app.py` exists

2. **Connect to Streamlit Community Cloud:**
   - Go to https://share.streamlit.io/
   - Click "Connect" and select your GitHub repository
   - Choose the main branch (or your deployment branch)

3. **Configure deployment:**
   - **Main file path**: `streamlit_app.py`
   - **Python version**: 3.8 or higher
   - **Requirements**: Streamlit will automatically detect dependencies from `pyproject.toml`

4. **Add secrets:**
   - In the Streamlit dashboard, go to "Settings" → "Secrets"
   - Add `GROQ_API_KEY` with your Groq API key
   - Optionally add `GROQ_MODEL` if you want to override the default model

5. **Deploy:**
   - Click "Deploy" to start the deployment
   - Wait for the build to complete
   - Your app will be available at a share.streamlit.io URL

### Environment Variables

The following environment variables are used by the Streamlit app:

| Variable | Required | Description |
|----------|-----------|-------------|
| `GROQ_API_KEY` | Yes | Your Groq API key for LLM access |
| `GROQ_MODEL` | No | Override the default Groq model (default: llama-3.1-8b-instant) |
| `ENVIRONMENT` | No | Set to 'development' for debug mode |

### Secrets Configuration

In Streamlit Community Cloud, secrets are configured in the dashboard:

```toml
# Streamlit secrets format (for reference)
GROQ_API_KEY = "your_api_key_here"
GROQ_MODEL = "llama-3.1-8b-instant"
```

## Repository Layout

Your repository should have this structure for Streamlit deployment:

```
milestone-1/
├── streamlit_app.py                 # Entry point for Community Cloud
├── src/
│   └── milestone1/
│       └── phase8_streamlit/
│           └── app.py              # Main Streamlit application
├── pyproject.toml                  # Dependencies including streamlit
├── .env.example                    # Environment variables template
└── README.md                       # Documentation
```

## Performance Considerations

### Free Tier Limitations
- **Cold starts**: First request may take 10-30 seconds
- **Resource limits**: Limited CPU and memory
- **Concurrency**: Limited concurrent users
- **Timeout**: 60-second timeout for requests

### Optimization Tips
1. **Conservative candidate caps**: Keep `maxRecommendations` low (3-5)
2. **Efficient filtering**: Use location and budget filters first
3. **Caching**: Results are cached within the same session
4. **Model selection**: Use faster models (llama-3.1-8b-instant)

## Troubleshooting

### Common Issues

1. **Import Errors:**
   - Ensure `pyproject.toml` includes all dependencies
   - Check that Python paths are correct in `streamlit_app.py`

2. **API Key Issues:**
   - Verify `GROQ_API_KEY` is set in secrets
   - Check the API key is valid and has credits

3. **Build Failures:**
   - Check the build logs in Streamlit dashboard
   - Ensure all dependencies are properly specified

4. **Slow Performance:**
   - Reduce `maxRecommendations` in the UI
   - Use more specific location filters
   - Consider using a faster Groq model

### Debug Mode

Set `ENVIRONMENT=development` in secrets to enable debug logging:

```python
import os
if os.getenv("ENVIRONMENT") == "development":
    import structlog
    structlog.configure(processors=[structlog.dev.ConsoleRenderer()])
```

## Monitoring

Streamlit Community Cloud provides basic metrics:
- Number of visits
- Average response time
- Error rate
- Resource usage

Check the Streamlit dashboard for these metrics.

## Alternative Deployment Options

### Docker Deployment
```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY . .

RUN pip install -e ".[streamlit]"

EXPOSE 8501

CMD ["streamlit", "run", "streamlit_app.py", "--server.address=0.0.0.0"]
```

### Other Cloud Platforms
- **Render**: Supports Streamlit apps
- **Heroku**: Can run Streamlit with some configuration
- **AWS/GCP**: Deploy as containerized application

## Security Notes

- **API Keys**: Never commit API keys to the repository
- **Input Validation**: The app validates all user inputs
- **Rate Limiting**: Consider implementing rate limiting for production
- **HTTPS**: Streamlit Community Cloud provides HTTPS automatically

## Support

For issues:
1. Check the Streamlit Community Cloud documentation
2. Review the build logs in the dashboard
3. Test locally with the same environment variables
4. Check the main GitHub repository for updates

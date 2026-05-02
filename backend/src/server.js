import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

// Import our recommendation engine
import { generateRecommendations } from '../../phase4/recommendation/index.js';
import { preferencesFromMapping } from '../../phase2/preferences/index.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = join(__dirname, '../..');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} - ${duration}ms`);
  });
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    services: {
      database: 'connected',
      llm: process.env.GROQ_API_KEY ? 'configured' : 'not configured'
    }
  });
});

// Get available locations
app.get('/api/locations', async (req, res) => {
  try {
    const { allowedCitiesFromRestaurants } = await import('../../phase2/preferences/index.js');
    const locations = await allowedCitiesFromRestaurants(repoRoot);
    res.json({ locations });
  } catch (error) {
    console.error('Error fetching locations:', error);
    res.status(500).json({ 
      error: 'Failed to fetch locations',
      message: error.message 
    });
  }
});

// Validate preferences
app.post('/api/preferences/validate', async (req, res) => {
  try {
    const { validatePreferencesFromMapping } = await import('../../phase2/preferences/index.js');
    const result = validatePreferencesFromMapping(req.body);
    
    if (result.isValid) {
      res.json({ 
        valid: true, 
        preferences: result.preferences 
      });
    } else {
      res.status(400).json({ 
        valid: false, 
        errors: result.errors 
      });
    }
  } catch (error) {
    console.error('Error validating preferences:', error);
    res.status(500).json({ 
      error: 'Validation failed',
      message: error.message 
    });
  }
});

// Generate recommendations
app.post('/api/recommendations', async (req, res) => {
  try {
    const startTime = Date.now();
    
    // Validate and parse preferences
    const { validatePreferencesFromMapping } = await import('../../phase2/preferences/index.js');
    const validationResult = validatePreferencesFromMapping(req.body);
    
    if (!validationResult.isValid) {
      return res.status(400).json({
        error: 'Invalid preferences',
        errors: validationResult.errors
      });
    }
    
    const preferences = validationResult.preferences;
    
    // Generate recommendations
    const result = await generateRecommendations(preferences, {
      repoRoot,
      recommendation: {
        maxRecommendations: req.body.maxRecommendations || 5,
        enableFallback: req.body.enableFallback !== false,
        qualityThreshold: req.body.qualityThreshold || 'good'
      },
      groq: {
        model: req.body.model || 'llama-3.1-8b-instant',
        temperature: req.body.temperature || 0.3,
        maxTokens: req.body.maxTokens || 2048
      }
    });
    
    const processingTime = Date.now() - startTime;
    
    if (!result.success) {
      return res.status(500).json({
        error: 'Recommendation generation failed',
        message: result.error,
        processingTime
      });
    }
    
    // Add processing time to metadata
    result.metadata.processingTime = processingTime;
    
    res.json(result);
    
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({ 
      error: 'Recommendation generation failed',
      message: error.message 
    });
  }
});

// Get recommendation history (placeholder for future implementation)
app.get('/api/recommendations/history', (req, res) => {
  // TODO: Implement recommendation history with database
  res.json({ 
    message: 'Recommendation history not yet implemented',
    history: [] 
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.originalUrl} not found`
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Backend server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔗 API docs: http://localhost:${PORT}/api`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🔄 SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🔄 SIGINT received, shutting down gracefully');
  process.exit(0);
});

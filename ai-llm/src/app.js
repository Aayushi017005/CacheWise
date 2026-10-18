import express from 'express';
import cors from 'cors';
import { config } from './config/environment.js';
import { insightsRouter } from './routes/insightsRoutes.js';

export const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Internal Health Check
app.get('/internal/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'CacheWise AI/LLM Microservice',
    configuredProvider: config.llmProvider,
    hasGeminiKey: Boolean(config.geminiApiKey),
    hasOpenAiKey: Boolean(config.openaiApiKey),
    timestamp: new Date().toISOString(),
  });
});

// Internal AI Insights Routes
app.use('/internal', insightsRouter);

// Centralized error handler
app.use((err, req, res, next) => {
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal AI Service Error',
  });
});


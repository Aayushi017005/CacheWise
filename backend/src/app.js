import express from 'express';
import cors from 'cors';
import { cacheRouter } from './routes/cacheRoutes.js';
import { demoRouter } from './routes/demoRoutes.js';
import { benchmarkRouter } from './routes/benchmarkRoutes.js';
import { historyRouter } from './routes/historyRoutes.js';
import { aiRouter } from './routes/aiRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

export const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// Health Check Endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        service: 'CacheWise Backend',
        uptimeSeconds: Math.floor(process.uptime()),
        timestamp: new Date().toISOString(),
    });
});

// Core API Routes
app.use('/api/cache', cacheRouter);
app.use('/api/demo', demoRouter);
app.use('/api/benchmark', benchmarkRouter);
app.use('/api/history', historyRouter);
app.use('/api/ai', aiRouter);

// Centralized Error Handler
app.use(errorHandler);
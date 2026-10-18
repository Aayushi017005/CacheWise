import { Router } from 'express';
import { explainBenchmark } from '../controllers/insightsController.js';

export const insightsRouter = Router();

insightsRouter.post('/insights', explainBenchmark);


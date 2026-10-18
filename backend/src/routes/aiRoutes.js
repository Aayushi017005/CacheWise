import { Router } from 'express';
import { getBenchmarkInsights } from '../controllers/aiController.js';

export const aiRouter = Router();

aiRouter.post('/insights', getBenchmarkInsights);


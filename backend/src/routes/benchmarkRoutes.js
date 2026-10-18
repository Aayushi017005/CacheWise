import { Router } from 'express';
import { executeBenchmark } from '../controllers/benchmarkController.js';

export const benchmarkRouter = Router();

benchmarkRouter.post('/', executeBenchmark);


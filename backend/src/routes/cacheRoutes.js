import { Router } from 'express';
import { getCacheStats, updateCacheConfig, clearCache } from '../controllers/cacheController.js';

export const cacheRouter = Router();

cacheRouter.get('/stats', getCacheStats);
cacheRouter.patch('/config', updateCacheConfig);
cacheRouter.delete('/', clearCache);


import { cacheService } from '../services/cacheService.js';
import { validateCacheConfig } from '../utils/validation.js';

export function getCacheStats(req, res) {
  const stats = cacheService.getStats();
  res.json({
    success: true,
    data: stats,
  });
}

export function updateCacheConfig(req, res) {
  const validation = validateCacheConfig(req.body);
  if (!validation.isValid) {
    return res.status(400).json({
      error: 'Invalid configuration parameters',
      details: validation.errors,
    });
  }

  const updatedConfig = cacheService.updateConfig(req.body);
  res.json({
    success: true,
    message: 'Cache configuration updated successfully. Cache was reset.',
    data: updatedConfig,
  });
}

export function clearCache(req, res) {
  cacheService.clear();
  res.json({
    success: true,
    message: 'Cache and metrics cleared successfully.',
  });
}


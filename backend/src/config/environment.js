import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT, 10) || 5000,
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/cachewise',
  aiServiceUrl: process.env.AI_SERVICE_URL || 'http://localhost:5001',
  defaultCacheStrategy: process.env.DEFAULT_CACHE_STRATEGY || 'LRU',
  defaultCacheCapacity: parseInt(process.env.DEFAULT_CACHE_CAPACITY, 10) || 100,
  defaultCacheTtlMs: parseInt(process.env.DEFAULT_CACHE_TTL_MS, 10) || 60000,
};


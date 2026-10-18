import mongoose from 'mongoose';
import { config } from './environment.js';

let isConnected = false;

/**
 * Connect to MongoDB with graceful error handling and fast fallback.
 * Allows the entire application and test suite to run even if MongoDB is offline.
 */
export async function connectDatabase() {
  if (isConnected) {
    return true;
  }

  try {
    // 2-second timeout so offline DB doesn't stall startup
    await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 2000,
    });

    isConnected = true;
    console.log('[Database] Successfully connected to MongoDB:', config.mongoUri);
    return true;
  } catch (error) {
    isConnected = false;
    console.warn(
      `[Database] Notice: MongoDB is unavailable at "${config.mongoUri}" (${error.message}). ` +
        'CacheWise is operating with the resilient in-memory history fallback. ' +
        'Core caching algorithms, middleware, and benchmarks will function normally.'
    );
    return false;
  }
}

export function isDatabaseConnected() {
  return isConnected && mongoose.connection.readyState === 1;
}

export async function disconnectDatabase() {
  if (isConnected) {
    await mongoose.disconnect();
    isConnected = false;
  }
}


import mongoose from 'mongoose';

const StrategyResultSchema = new mongoose.Schema(
  {
    strategy: { type: String, required: true },
    totalRequests: { type: Number, required: true },
    hits: { type: Number, required: true },
    misses: { type: Number, required: true },
    evictions: { type: Number, required: true },
    hitRatio: { type: Number, required: true },
    hitRatioPercentage: { type: Number, required: true },
    executionTimeMs: { type: Number, required: true },
  },
  { _id: false }
);

const BenchmarkHistorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: 'Workload Run',
      maxlength: [100, 'Workload name cannot exceed 100 characters'],
      trim: true,
    },
    capacity: {
      type: Number,
      required: true,
      min: [1, 'Capacity must be at least 1'],
    },
    ttlMs: {
      type: Number,
      default: null,
    },
    requestCount: {
      type: Number,
      required: true,
    },
    requestSequence: {
      type: [String],
      validate: [
        (val) => val.length <= 1000,
        'Saved request sequence cannot exceed 1,000 keys for storage bounds',
      ],
      default: [],
    },
    bestStrategy: {
      type: String,
      enum: ['FIFO', 'LRU', 'LFU', 'Tie'],
      required: true,
    },
    results: {
      FIFO: { type: StrategyResultSchema, required: true },
      LRU: { type: StrategyResultSchema, required: true },
      LFU: { type: StrategyResultSchema, required: true },
    },
    aiInsights: {
      type: String,
      default: null,
      maxlength: 5000,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

export const BenchmarkHistory = mongoose.models.BenchmarkHistory || mongoose.model('BenchmarkHistory', BenchmarkHistorySchema);


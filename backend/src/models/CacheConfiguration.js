import mongoose from 'mongoose';

const CacheConfigurationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Configuration name is required'],
      unique: true,
      trim: true,
      maxlength: [50, 'Configuration name cannot exceed 50 characters'],
    },
    strategy: {
      type: String,
      required: [true, 'Cache strategy is required'],
      enum: ['FIFO', 'LRU', 'LFU'],
      uppercase: true,
    },
    capacity: {
      type: Number,
      required: [true, 'Cache capacity is required'],
      min: [1, 'Capacity must be at least 1'],
      max: [100000, 'Capacity cannot exceed 100,000'],
    },
    ttlMs: {
      type: Number,
      default: 60000,
      min: [0, 'TTL must be non-negative'],
    },
  },
  {
    timestamps: true,
  }
);

export const CacheConfiguration = mongoose.models.CacheConfiguration || mongoose.model('CacheConfiguration', CacheConfigurationSchema);


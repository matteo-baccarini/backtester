import { Queue } from 'bullmq';
import { redis } from '../config/redis.config';

export const marketDataQueue = new Queue('market-data', {
  connection: redis,
});

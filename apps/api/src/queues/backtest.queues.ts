import { Queue } from 'bullmq';
import { redis } from '../config/redis.config';

export const backtestQueue = new Queue('backtest', {
  connection: redis,
});

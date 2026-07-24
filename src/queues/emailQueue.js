
import { Queue } from 'bullmq';
import { createQueueConnection } from '../config/queueConnection.config.js';

export const emailQueue = new Queue('email', {
  connection: createQueueConnection(),
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 2000 },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});
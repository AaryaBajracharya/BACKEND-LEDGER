// workers/emailWorker.js — run via `node workers/emailWorker.js`, never imported by the app
import { Worker } from 'bullmq';
import { createQueueConnection } from '../config/queueConnection.js';
import { sendRegistrationEmail } from '../services/email.service.js';

const emailWorker = new Worker(
  'email',
  async (job) => {
    if (job.name === 'registration-email') {
      const { email, name } = job.data;
      await sendRegistrationEmail(email, name);
    }
  },
  { connection: createQueueConnection(), concurrency: 5 }
  
);

emailWorker.on('completed', (job) => console.log(`Job ${job.id} completed`));
emailWorker.on('failed', (job, err) => console.error(`Job ${job?.id} failed:`, err.message));


import Redis from 'ioredis';

let queueConnection;

const createQueueConnection = () => {
    if (queueConnection) return queueConnection;

    queueConnection = new Redis(process.env.REDIS_URL, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
    });

      queueConnection.on('error', (err) => console.error('BullMQ Redis error', err));
      queueConnection.on('connect', () => console.log('BullMQ Redis connected'));

  return queueConnection;
};

export { createQueueConnection };
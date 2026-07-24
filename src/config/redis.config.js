import { createClient } from 'redis';

let redisClient;  

const createRedisClient = () => {
  if (redisClient) return redisClient;

  const options = {};
  if (process.env.REDIS_URL) options.url = process.env.REDIS_URL;
  
  redisClient = createClient(options);
  redisClient.on('error', (err) => console.error('Redis client error', err));

  return redisClient;
}

const ensureConnected = async () => {
  const client = createRedisClient();
  if (!client.isOpen) {
    try {
      await client.connect();
      console.log('Redis connected');
    } catch (err) {
      console.error('Redis connect failed:', err);
      // don't rethrow - fail open
    }
  }
  return client;
}

export {ensureConnected, createRedisClient}
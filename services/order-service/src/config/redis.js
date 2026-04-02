const Redis = require('ioredis');

const redisUrl = process.env.REDIS_URL || 'redis://cache-redis:6379';
const redis = new Redis(redisUrl, {
    maxRetriesPerRequest: null,
    enableReadyCheck: true,
    retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
    }
});

redis.on('connect', () => {
    console.log('✅ Connected to Redis (Order-Service-Cart)');
});

redis.on('error', (err) => {
    console.error('❌ Redis Connection Error:', err);
});

module.exports = redis;

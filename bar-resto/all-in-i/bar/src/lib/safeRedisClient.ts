import redisCache from "./redisCache";

const PORT = process.env.PORT || 3000;

interface RedisSetOptions {
  EX?: number;
  PX?: number;
  EXAT?: number;
  PXAT?: number;
  NX?: boolean;
  XX?: boolean;
  KEEPTTL?: boolean;
  GET?: boolean;
}

// Create a Redis wrapper with graceful error handling
class SafeRedisClient {
  redisClient: any;
  isConnected: boolean;
  connectionPromise: Promise<void> | null;

  constructor() {
    this.redisClient = redisCache;
    this.isConnected = false;
    this.connectionPromise = null;
  }

  async connect() {
    try {
      if (!this.connectionPromise) {
        this.connectionPromise = this.redisClient.connect();
      }
      await this.connectionPromise;
      this.isConnected = true;
      console.log('Redis connected successfully');
    } catch (error) {
      console.warn('Redis connection failed, continuing without cache:', error.message);
      this.isConnected = false;
    }
  }

  async get(key) {
    if (!this.isConnected) return null;
    try {
      return await this.redisClient.get(key);
    } catch (error) {
      console.warn('Redis get failed:', error.message);
      return null;
    }
  }

  async set(key, value, options) {
    if (!this.isConnected) return false;
    try {
      await this.redisClient.set(key, value, options);
      return true;
    } catch (error) {
      console.warn('Redis set failed:', error.message);
      return false;
    }
  }

  // Add other methods as needed
}

// Use the safe wrapper
const safeRedis = new SafeRedisClient();

(async () => {
  // Try to connect but don't block app startup
  safeRedis.connect().then(() => {
    console.log('Redis connection attempt completed');
  }).catch(() => {
    console.log('Redis connection attempt failed silently');
  });

  // Start server regardless of Redis status
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
})();
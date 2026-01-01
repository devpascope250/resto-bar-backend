"use strict";
// import { createClient } from 'redis';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisCache = void 0;
// type CacheOptions = {
//   ttl?: number; // Time-to-live in seconds (default: 86400 = 1 day)
//   compress?: boolean; // Enable compression for large values
// };
// export class RedisCache {
//   private client: ReturnType<typeof createClient>;
//   private static instance: RedisCache;
//   private readonly DEFAULT_TTL = 86400; // 24 hours in seconds
//   private readonly MAX_KEY_LENGTH = 1024; // Redis key length limit
//   private isConnected = false;
//   private constructor() {
//     const redisUrl = 'redis://127.0.0.1:6379';
//     console.log('Redis URL:................', redisUrl);
//     this.client = createClient({
//       url: redisUrl,
//       socket: {
//         reconnectStrategy: (retries) => {
//           // Exponential backoff with max delay of 5 seconds
//           const delay = Math.min(retries * 100, 5000);
//           console.log(`Redis reconnecting in ${delay}ms...`);
//           return delay;
//         }
//       }
//     });
//     this.setupEventListeners();
//   }
//   public static getInstance(): RedisCache {
//     if (!RedisCache.instance) {
//       RedisCache.instance = new RedisCache();
//     }
//     return RedisCache.instance;
//   }
//   private setupEventListeners() {
//     this.client.on('error', (err) => {
//       console.error('Redis Client Error:', err.message);
//       this.isConnected = false;
//     });
//     this.client.on('connect', () => {
//       console.log('Redis connecting...');
//     });
//     this.client.on('ready', () => {
//       console.log('Redis ready and connected');
//       this.isConnected = true;
//     });
//     this.client.on('end', () => {
//       console.log('Redis connection closed');
//       this.isConnected = false;
//     });
//     this.client.on('reconnecting', () => {
//       console.log('Redis reconnecting...');
//     });
//   }
//   public async connect(): Promise<void> {
//     if (this.client.isOpen) return;
//     try {
//       await this.client.connect();
//     } catch (error) {
//       console.error('Failed to connect to Redis:', error);
//       throw error;
//     }
//   }
//   public async save(
//     namespace: string,
//     key: string,
//     value: any,
//     options?: CacheOptions
//   ): Promise<boolean> {
//     try {
//       await this.ensureConnection();
//       const fullKey = this.generateKey(namespace, key);
//       const serialized = JSON.stringify(value);
//       const ttl = options?.ttl ?? this.DEFAULT_TTL;
//       // Check if compression is needed
//       if (options?.compress && serialized.length > 1024) {
//         // Implement compression logic here if needed
//         // For now, just store as-is
//         await this.client.setEx(fullKey, ttl, serialized);
//       } else {
//         await this.client.setEx(fullKey, ttl, serialized);
//       }
//       return true;
//     } catch (err) {
//       console.error(`Failed to save cache for key ${namespace}:${key}:`, err);
//       return false;
//     }
//   }
//   public async get<T>(namespace: string, key: string): Promise<T | null> {
//     try {
//       await this.ensureConnection();
//       const fullKey = this.generateKey(namespace, key);
//       const data = await this.client.get(fullKey);
//       if (!data) return null;
//       return JSON.parse(data) as T;
//     } catch (err) {
//       console.error(`Failed to get cache for key ${namespace}:${key}:`, err);
//       return null;
//     }
//   }
//   public async getMany<T>(namespace: string, keys: string[]): Promise<(T | null)[]> {
//     try {
//       await this.ensureConnection();
//       const fullKeys = keys.map(key => this.generateKey(namespace, key));
//       const results = await this.client.mGet(fullKeys);
//       return results.map(item => {
//         if (!item) return null;
//         try {
//           return JSON.parse(item) as T;
//         } catch {
//           return null;
//         }
//       });
//     } catch (err) {
//       console.error('Failed to get multiple cache entries:', err);
//       return keys.map(() => null);
//     }
//   }
//   public async delete(namespace: string, key?: string): Promise<boolean> {
//     try {
//       await this.ensureConnection();
//       if (key) {
//         const fullKey = this.generateKey(namespace, key);
//         return (await this.client.del(fullKey)) > 0;
//       } else {
//         const keys = await this.client.keys(`${namespace}:*`);
//         if (keys.length === 0) return false;
//         return (await this.client.del(keys)) > 0;
//       }
//     } catch (err) {
//       console.error('Failed to delete cache entry:', err);
//       return false;
//     }
//   }
//   public async exists(namespace: string, key: string): Promise<boolean> {
//     try {
//       await this.ensureConnection();
//       const fullKey = this.generateKey(namespace, key);
//       return (await this.client.exists(fullKey)) > 0;
//     } catch (err) {
//       console.error('Failed to check cache existence:', err);
//       return false;
//     }
//   }
//   public async increment(
//     namespace: string,
//     key: string,
//     value: number = 1
//   ): Promise<number | null> {
//     try {
//       await this.ensureConnection();
//       const fullKey = this.generateKey(namespace, key);
//       return await this.client.incrBy(fullKey, value);
//     } catch (err) {
//       console.error('Failed to increment cache value:', err);
//       return null;
//     }
//   }
//   public async setWithExpiry(
//     namespace: string,
//     key: string,
//     value: any,
//     ttl: number
//   ): Promise<boolean> {
//     return this.save(namespace, key, value, { ttl });
//   }
//   public async getTtl(namespace: string, key: string): Promise<number | null> {
//     try {
//       await this.ensureConnection();
//       const fullKey = this.generateKey(namespace, key);
//       const ttl = await this.client.ttl(fullKey);
//       return ttl >= 0 ? ttl : null;
//     } catch (err) {
//       console.error('Failed to get TTL:', err);
//       return null;
//     }
//   }
//   public async keys(namespace: string): Promise<string[]> {
//     try {
//       await this.ensureConnection();
//       const pattern = `${namespace}:*`;
//       return await this.client.keys(pattern);
//     } catch (err) {
//       console.error('Failed to get keys:', err);
//       return [];
//     }
//   }
//   public async flush(): Promise<boolean> {
//     try {
//       await this.ensureConnection();
//       await this.client.flushAll();
//       return true;
//     } catch (err) {
//       console.error('Failed to flush cache:', err);
//       return false;
//     }
//   }
//   public async healthCheck(): Promise<{
//     healthy: boolean;
//     latency?: number;
//     error?: string;
//   }> {
//     try {
//       const start = Date.now();
//       await this.connect();
//       const pingResult = await this.client.ping();
//       const latency = Date.now() - start;
//       return {
//         healthy: pingResult === 'PONG',
//         latency
//       };
//     } catch (err: any) {
//       return {
//         healthy: false,
//         error: err.message
//       };
//     }
//   }
//   public async disconnect(): Promise<void> {
//     try {
//       if (this.client.isOpen) {
//         await this.client.quit();
//         this.isConnected = false;
//       }
//     } catch (err) {
//       console.error('Error during Redis disconnect:', err);
//     }
//   }
//   public isReady(): boolean {
//     return this.isConnected && this.client.isReady;
//   }
//   private async ensureConnection(): Promise<void> {
//     if (!this.isReady()) {
//       await this.connect();
//     }
//   }
//   private generateKey(namespace: string, key: string): string {
//     const fullKey = `${namespace}:${key}`;
//     if (fullKey.length > this.MAX_KEY_LENGTH) {
//       console.warn(`Cache key length (${fullKey.length}) exceeds recommended limit of ${this.MAX_KEY_LENGTH}`);
//     }
//     return fullKey;
//   }
// }
// // Singleton instance
// const redisCache = RedisCache.getInstance();
// // Graceful shutdown for Node.js environments
// if (typeof process !== 'undefined') {
//   const shutdown = async () => {
//     console.log('Shutting down Redis connection...');
//     await redisCache.disconnect();
//     console.log('Redis connection closed');
//   };
//   process.on('SIGTERM', shutdown);
//   process.on('SIGINT', shutdown);
//   // Cleanup on exit
//   process.on('exit', () => {
//     redisCache.disconnect().catch(console.error);
//   });
// }
// // Export the singleton instance
// export default redisCache;
const ioredis_1 = __importDefault(require("ioredis"));
class RedisCache {
    constructor() {
        this.DEFAULT_TTL = 86400; // 24 hours in seconds
        this.MAX_KEY_LENGTH = 1024; // Redis key length limit
        this.isConnected = false;
        const redisUrl = 'redis://127.0.0.1:6379';
        console.log('Redis URL:................', redisUrl);
        // ioredis automatically parses URLs, but we can also pass options
        const options = {
            // URL-based config
            // host: '127.0.0.1',
            // port: 6379,
            // Better retry strategy
            retryStrategy: (times) => {
                // Exponential backoff with max delay of 5 seconds
                const delay = Math.min(times * 100, 5000);
                console.log(`Redis reconnecting in ${delay}ms... (attempt ${times})`);
                return delay;
            },
            // Auto-reconnect
            reconnectOnError: (err) => {
                const targetError = 'READONLY';
                if (err.message.includes(targetError)) {
                    // Only reconnect when the error contains "READONLY"
                    return true;
                }
                return false;
            },
            // Connection options
            maxRetriesPerRequest: 3,
            enableReadyCheck: true,
            lazyConnect: true, // Don't connect automatically
            // Performance options
            enableOfflineQueue: true, // Queue commands when offline
            connectTimeout: 10000, // 10 seconds
            commandTimeout: 5000, // 5 seconds per command
            // TLS/SSL support (uncomment if needed)
            // tls: {
            //   rejectUnauthorized: false
            // }
        };
        // For cluster support, you could use:
        // this.client = new Redis.Cluster([{ host: '127.0.0.1', port: 30001 }], options);
        // For single instance with URL
        this.client = new ioredis_1.default(redisUrl, options);
        this.setupEventListeners();
    }
    static getInstance() {
        if (!RedisCache.instance) {
            RedisCache.instance = new RedisCache();
        }
        return RedisCache.instance;
    }
    setupEventListeners() {
        this.client.on('error', (err) => {
            console.error('Redis Client Error:', err.message);
            this.isConnected = false;
        });
        this.client.on('connect', () => {
            console.log('Redis connecting...');
        });
        this.client.on('ready', () => {
            console.log('Redis ready and connected');
            this.isConnected = true;
        });
        this.client.on('end', () => {
            console.log('Redis connection closed');
            this.isConnected = false;
        });
        this.client.on('reconnecting', (delay) => {
            console.log(`Redis reconnecting in ${delay}ms...`);
        });
        this.client.on('close', () => {
            console.log('Redis connection closed');
            this.isConnected = false;
        });
        // Additional useful events
        this.client.on('connecting', () => {
            console.log('Redis attempting to connect...');
        });
        this.client.on('wait', () => {
            console.log('Redis waiting for reconnect...');
        });
    }
    async connect() {
        if (this.client.status === 'ready' || this.client.status === 'connecting') {
            return;
        }
        try {
            // ioredis supports lazy connect, so we need to call connect explicitly
            await this.client.connect();
        }
        catch (error) {
            console.error('Failed to connect to Redis:', error);
            throw error;
        }
    }
    async save(namespace, key, value, options) {
        var _a;
        try {
            await this.ensureConnection();
            const fullKey = this.generateKey(namespace, key);
            const serialized = JSON.stringify(value);
            const ttl = (_a = options === null || options === void 0 ? void 0 : options.ttl) !== null && _a !== void 0 ? _a : this.DEFAULT_TTL;
            // ioredis syntax: SETEX key seconds value
            if (ttl > 0) {
                await this.client.setex(fullKey, ttl, serialized);
            }
            else {
                // If ttl is 0 or negative, set without expiration
                await this.client.set(fullKey, serialized);
            }
            // Check if compression is needed (placeholder for actual implementation)
            if ((options === null || options === void 0 ? void 0 : options.compress) && serialized.length > 1024) {
                console.log('Compression option selected but not implemented');
                // Implement compression logic here
                // Could use: zlib.gzipSync() and zlib.gunzipSync()
            }
            return true;
        }
        catch (err) {
            console.error(`Failed to save cache for key ${namespace}:${key}:`, err);
            return false;
        }
    }
    async get(namespace, key) {
        try {
            await this.ensureConnection();
            const fullKey = this.generateKey(namespace, key);
            const data = await this.client.get(fullKey);
            if (!data)
                return null;
            return JSON.parse(data);
        }
        catch (err) {
            console.error(`Failed to get cache for key ${namespace}:${key}:`, err);
            return null;
        }
    }
    async getMany(namespace, keys) {
        try {
            await this.ensureConnection();
            const fullKeys = keys.map(key => this.generateKey(namespace, key));
            // ioredis uses mget (lowercase)
            const results = await this.client.mget(...fullKeys);
            return results.map(item => {
                if (!item)
                    return null;
                try {
                    return JSON.parse(item);
                }
                catch (_a) {
                    console.warn('Failed to parse cache entry:', item);
                    return null;
                }
            });
        }
        catch (err) {
            console.error('Failed to get multiple cache entries:', err);
            return keys.map(() => null);
        }
    }
    async delete(namespace, key) {
        try {
            await this.ensureConnection();
            if (key) {
                const fullKey = this.generateKey(namespace, key);
                return (await this.client.del(fullKey)) > 0;
            }
            else {
                // More efficient than KEYS for deleting by pattern
                const pattern = `${namespace}:*`;
                const keys = await this.client.keys(pattern);
                if (keys.length === 0)
                    return false;
                // Use pipeline for better performance with multiple deletes
                const pipeline = this.client.pipeline();
                keys.forEach(k => pipeline.del(k));
                const results = await pipeline.exec();
                return results ? results.some(([err, result]) => !err && result > 0) : false;
            }
        }
        catch (err) {
            console.error('Failed to delete cache entry:', err);
            return false;
        }
    }
    async exists(namespace, key) {
        try {
            await this.ensureConnection();
            const fullKey = this.generateKey(namespace, key);
            return (await this.client.exists(fullKey)) > 0;
        }
        catch (err) {
            console.error('Failed to check cache existence:', err);
            return false;
        }
    }
    async increment(namespace, key, value = 1) {
        try {
            await this.ensureConnection();
            const fullKey = this.generateKey(namespace, key);
            return await this.client.incrby(fullKey, value);
        }
        catch (err) {
            console.error('Failed to increment cache value:', err);
            return null;
        }
    }
    async decrement(namespace, key, value = 1) {
        try {
            await this.ensureConnection();
            const fullKey = this.generateKey(namespace, key);
            return await this.client.decrby(fullKey, value);
        }
        catch (err) {
            console.error('Failed to decrement cache value:', err);
            return null;
        }
    }
    async setWithExpiry(namespace, key, value, ttl) {
        return this.save(namespace, key, value, { ttl });
    }
    async getTtl(namespace, key) {
        try {
            await this.ensureConnection();
            const fullKey = this.generateKey(namespace, key);
            const ttl = await this.client.ttl(fullKey);
            return ttl >= 0 ? ttl : null;
        }
        catch (err) {
            console.error('Failed to get TTL:', err);
            return null;
        }
    }
    async expire(namespace, key, ttl) {
        try {
            await this.ensureConnection();
            const fullKey = this.generateKey(namespace, key);
            return (await this.client.expire(fullKey, ttl)) === 1;
        }
        catch (err) {
            console.error('Failed to set expiry:', err);
            return false;
        }
    }
    async keys(namespace) {
        try {
            await this.ensureConnection();
            const pattern = `${namespace}:*`;
            return await this.client.keys(pattern);
        }
        catch (err) {
            console.error('Failed to get keys:', err);
            return [];
        }
    }
    async flush() {
        try {
            await this.ensureConnection();
            await this.client.flushall();
            return true;
        }
        catch (err) {
            console.error('Failed to flush cache:', err);
            return false;
        }
    }
    async flushDb() {
        try {
            await this.ensureConnection();
            await this.client.flushdb();
            return true;
        }
        catch (err) {
            console.error('Failed to flush current database:', err);
            return false;
        }
    }
    async healthCheck() {
        try {
            const start = Date.now();
            await this.connect();
            const pingResult = await this.client.ping();
            const latency = Date.now() - start;
            return {
                healthy: pingResult === 'PONG',
                latency
            };
        }
        catch (err) {
            return {
                healthy: false,
                error: err.message
            };
        }
    }
    async disconnect() {
        try {
            // ioredis uses quit() for graceful shutdown
            await this.client.quit();
            this.isConnected = false;
        }
        catch (err) {
            console.error('Error during Redis disconnect:', err);
        }
    }
    async pipeline(operations) {
        try {
            await this.ensureConnection();
            const pipeline = this.client.pipeline();
            operations.forEach(([command, ...args]) => {
                // @ts-ignore - dynamic command access
                if (typeof pipeline[command] === 'function') {
                    // @ts-ignore
                    pipeline[command](...args);
                }
            });
            const results = await pipeline.exec();
            if (!results) {
                throw new Error('Pipeline execution returned no results');
            }
            return results.map(([err, result]) => {
                if (err)
                    throw err;
                return result;
            });
        }
        catch (err) {
            console.error('Pipeline execution failed:', err);
            throw err;
        }
    }
    async transaction(operations) {
        try {
            await this.ensureConnection();
            const multi = this.client.multi();
            operations.forEach(([command, ...args]) => {
                // @ts-ignore - dynamic command access
                if (typeof multi[command] === 'function') {
                    // @ts-ignore
                    multi[command](...args);
                }
            });
            const results = await multi.exec();
            if (!results) {
                throw new Error('Transaction execution returned no results');
            }
            return results.map(([err, result]) => {
                if (err)
                    throw err;
                return result;
            });
        }
        catch (err) {
            console.error('Transaction execution failed:', err);
            throw err;
        }
    }
    async hset(namespace, key, field, value) {
        try {
            await this.ensureConnection();
            const fullKey = this.generateKey(namespace, key);
            const serialized = JSON.stringify(value);
            return (await this.client.hset(fullKey, field, serialized)) > 0;
        }
        catch (err) {
            console.error('Failed to set hash field:', err);
            return false;
        }
    }
    async hget(namespace, key, field) {
        try {
            await this.ensureConnection();
            const fullKey = this.generateKey(namespace, key);
            const data = await this.client.hget(fullKey, field);
            if (!data)
                return null;
            return JSON.parse(data);
        }
        catch (err) {
            console.error('Failed to get hash field:', err);
            return null;
        }
    }
    isReady() {
        return this.isConnected && this.client.status === 'ready';
    }
    getStatus() {
        return this.client.status;
    }
    async ensureConnection() {
        if (!this.isReady()) {
            await this.connect();
        }
    }
    generateKey(namespace, key) {
        const fullKey = `${namespace}:${key}`;
        if (fullKey.length > this.MAX_KEY_LENGTH) {
            console.warn(`Cache key length (${fullKey.length}) exceeds recommended limit of ${this.MAX_KEY_LENGTH}`);
        }
        return fullKey;
    }
}
exports.RedisCache = RedisCache;
// Singleton instance
const redisCache = RedisCache.getInstance();
// Graceful shutdown for Node.js environments
if (typeof process !== 'undefined') {
    const shutdown = async (signal) => {
        console.log(`Received ${signal}. Shutting down Redis connection...`);
        await redisCache.disconnect();
        console.log('Redis connection closed');
    };
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    // Cleanup on exit
    process.on('exit', async () => {
        try {
            await redisCache.disconnect();
        }
        catch (err) {
            console.error('Error during exit cleanup:', err);
        }
    });
    // Handle uncaught exceptions
    process.on('uncaughtException', async (err) => {
        console.error('Uncaught exception:', err);
        await redisCache.disconnect();
        process.exit(1);
    });
    // Handle unhandled promise rejections
    process.on('unhandledRejection', async (reason, promise) => {
        console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        await redisCache.disconnect();
        process.exit(1);
    });
}
// Export the singleton instance
exports.default = redisCache;

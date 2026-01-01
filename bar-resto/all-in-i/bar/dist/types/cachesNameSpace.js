"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheNamespace = void 0;
// cache-namespace.ts
class CacheNamespace {
    // Helper method to generate cache keys consistently
    static generateKey(namespace, key) {
        return `${namespace}:${key}`;
    }
    // Method to parse a full key back to namespace and key
    static parseKey(fullKey) {
        const [namespace, ...keyParts] = fullKey.split(':');
        return {
            namespace,
            key: keyParts.join(':')
        };
    }
    // Clear all cache entries for a specific namespace
    static async clearNamespace(namespace, cache // Assuming RedisCache instance
    ) {
        try {
            return await cache.delete(namespace);
        }
        catch (error) {
            console.error(`Failed to clear namespace ${namespace}:`, error);
            return false;
        }
    }
    // Generate cache options based on namespace type
    static getCacheOptions(namespace) {
        const ttlConfig = {
            'products': 3600, // 1 hour
            'users': 1800, // 30 minutes
            'orders': 900, // 15 minutes
            'cart': 300, // 5 minutes
            'rate_limit': 60, // 1 minute
            'system': 86400 // 24 hours
        };
        const compressConfig = ['products', 'users', 'orders'];
        return {
            ttl: ttlConfig[namespace] || 600, // Default 10 minutes
            compress: compressConfig.includes(namespace)
        };
    }
}
exports.CacheNamespace = CacheNamespace;
// Product related namespaces
CacheNamespace.products = {
    // Get products by partner
    partner: (partnerId) => ['products', `partner_${partnerId}`],
    // Get single product
    product: (productId) => ['products', `item_${productId}`],
    // Get product list with filters
    list: (filters) => {
        const filterString = JSON.stringify(filters);
        return ['products', `list_${Buffer.from(filterString).toString('base64')}`];
    },
    // Product categories
    categories: (partnerId) => partnerId ? ['products', `categories_partner_${partnerId}`] : ['products', 'categories_all'],
    // Product search
    search: (query, partnerId) => {
        const searchKey = partnerId
            ? `search_${partnerId}_${query.toLowerCase().replace(/\s+/g, '_')}`
            : `search_all_${query.toLowerCase().replace(/\s+/g, '_')}`;
        return ['products', searchKey];
    }
};
// User related namespaces
CacheNamespace.users = {
    // Get user by ID
    user: (userId) => ['users', `id_${userId}`],
    // Get user by email
    email: (email) => ['users', `email_${email.toLowerCase()}`],
    // Get user sessions
    sessions: (userId) => ['users', `sessions_${userId}`],
    // User preferences
    preferences: (userId) => ['users', `preferences_${userId}`]
};
// Order related namespaces
CacheNamespace.orders = {
    // Get order by ID
    order: (orderId) => ['orders', `id_${orderId}`],
    // Get orders by user
    userOrders: (userId, status) => status ? ['orders', `user_${userId}_status_${status}`] : ['orders', `user_${userId}`],
    // Get orders by partner
    partnerOrders: (partnerId, status) => status ? ['orders', `partner_${partnerId}_status_${status}`] : ['orders', `partner_${partnerId}`],
    // Order statistics
    statistics: (partnerId, period) => ['orders', `stats_${partnerId}_${period}_${new Date().toISOString().split('T')[0]}`]
};
// Cart related namespaces
CacheNamespace.cart = {
    // Get user cart
    userCart: (userId) => ['cart', `user_${userId}`],
    // Cart items count
    count: (userId) => ['cart', `count_${userId}`]
};
// API Rate limiting
CacheNamespace.rateLimit = {
    // Rate limit by IP
    ip: (ip, endpoint) => ['rate_limit', `ip_${ip}_endpoint_${endpoint}`],
    // Rate limit by user
    user: (userId, endpoint) => ['rate_limit', `user_${userId}_endpoint_${endpoint}`]
};
// System cache
CacheNamespace.system = {
    // Configuration
    config: (key) => ['system', `config_${key}`],
    // Feature flags
    featureFlag: (flag) => ['system', `feature_${flag}`],
    // System health
    health: (service) => ['system', `health_${service}`]
};
// Custom namespace builder
CacheNamespace.custom = {
    // Create custom namespace with TTL hint (for auto-expiry)
    create: (namespace, key, ttlHint) => {
        return ttlHint ? [namespace, key, ttlHint] : [namespace, key];
    }
};

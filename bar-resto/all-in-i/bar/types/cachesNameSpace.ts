// cache-namespace.ts
export class CacheNamespace {
  // Product related namespaces
  static products = {
    // Get products by partner
    partner: (partnerId: string): [string, string] => ['products', `partner_${partnerId}`],
    
    // Get single product
    product: (productId: string): [string, string] => ['products', `item_${productId}`],
    
    // Get product list with filters
    list: (filters: Record<string, any>): [string, string] => {
      const filterString = JSON.stringify(filters);
      return ['products', `list_${Buffer.from(filterString).toString('base64')}`];
    },
    
    // Product categories
    categories: (partnerId?: string): [string, string] => 
      partnerId ? ['products', `categories_partner_${partnerId}`] : ['products', 'categories_all'],
    
    // Product search
    search: (query: string, partnerId?: string): [string, string] => {
      const searchKey = partnerId 
        ? `search_${partnerId}_${query.toLowerCase().replace(/\s+/g, '_')}`
        : `search_all_${query.toLowerCase().replace(/\s+/g, '_')}`;
      return ['products', searchKey];
    }
  };

  // User related namespaces
  static users = {
    // Get user by ID
    user: (userId: string): [string, string] => ['users', `id_${userId}`],
    
    // Get user by email
    email: (email: string): [string, string] => ['users', `email_${email.toLowerCase()}`],
    
    // Get user sessions
    sessions: (userId: string): [string, string] => ['users', `sessions_${userId}`],
    
    // User preferences
    preferences: (userId: string): [string, string] => ['users', `preferences_${userId}`]
  };

  // Order related namespaces
  static orders = {
    // Get order by ID
    order: (orderId: string): [string, string] => ['orders', `id_${orderId}`],
    
    // Get orders by user
    userOrders: (userId: string, status?: string): [string, string] => 
      status ? ['orders', `user_${userId}_status_${status}`] : ['orders', `user_${userId}`],
    
    // Get orders by partner
    partnerOrders: (partnerId: string, status?: string): [string, string] => 
      status ? ['orders', `partner_${partnerId}_status_${status}`] : ['orders', `partner_${partnerId}`],
    
    // Order statistics
    statistics: (partnerId: string, period: 'day' | 'week' | 'month'): [string, string] => 
      ['orders', `stats_${partnerId}_${period}_${new Date().toISOString().split('T')[0]}`]
  };

  // Cart related namespaces
  static cart = {
    // Get user cart
    userCart: (userId: string): [string, string] => ['cart', `user_${userId}`],
    
    // Cart items count
    count: (userId: string): [string, string] => ['cart', `count_${userId}`]
  };

  // API Rate limiting
  static rateLimit = {
    // Rate limit by IP
    ip: (ip: string, endpoint: string): [string, string] => 
      ['rate_limit', `ip_${ip}_endpoint_${endpoint}`],
    
    // Rate limit by user
    user: (userId: string, endpoint: string): [string, string] => 
      ['rate_limit', `user_${userId}_endpoint_${endpoint}`]
  };

  // System cache
  static system = {
    // Configuration
    config: (key: string): [string, string] => ['system', `config_${key}`],
    
    // Feature flags
    featureFlag: (flag: string): [string, string] => ['system', `feature_${flag}`],
    
    // System health
    health: (service: string): [string, string] => ['system', `health_${service}`]
  };

  // Custom namespace builder
  static custom = {
    // Create custom namespace with TTL hint (for auto-expiry)
    create: (
      namespace: string, 
      key: string, 
      ttlHint?: number
    ): [string, string, number?] => {
      return ttlHint ? [namespace, key, ttlHint] : [namespace, key];
    }
  };

  // Helper method to generate cache keys consistently
  static generateKey(namespace: string, key: string): string {
    return `${namespace}:${key}`;
  }

  // Method to parse a full key back to namespace and key
  static parseKey(fullKey: string): { namespace: string; key: string } {
    const [namespace, ...keyParts] = fullKey.split(':');
    return {
      namespace,
      key: keyParts.join(':')
    };
  }

  // Clear all cache entries for a specific namespace
  static async clearNamespace(
    namespace: string,
    cache: any // Assuming RedisCache instance
  ): Promise<boolean> {
    try {
      return await cache.delete(namespace);
    } catch (error) {
      console.error(`Failed to clear namespace ${namespace}:`, error);
      return false;
    }
  }

  // Generate cache options based on namespace type
  static getCacheOptions(namespace: string): { ttl?: number; compress?: boolean } {
    const ttlConfig: Record<string, number> = {
      'products': 3600, // 1 hour
      'users': 1800,    // 30 minutes
      'orders': 900,    // 15 minutes
      'cart': 300,      // 5 minutes
      'rate_limit': 60, // 1 minute
      'system': 86400   // 24 hours
    };

    const compressConfig = ['products', 'users', 'orders'];

    return {
      ttl: ttlConfig[namespace] || 600, // Default 10 minutes
      compress: compressConfig.includes(namespace)
    };
  }
}
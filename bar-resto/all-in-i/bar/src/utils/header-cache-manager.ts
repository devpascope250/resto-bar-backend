// network-cache-manager.ts
import { Response } from 'express';
import crypto from 'crypto';

export class NetworkCacheManager {
  constructor(private res: Response) {}
  
  // 1. PUBLIC: Cache in browsers and CDNs
  public(maxAge: number = 300): this {
    this.res.set('Cache-Control', `public, max-age=${maxAge}`);
    return this;
  }
  
  // 2. PRIVATE: Cache only in user's browser
  private(maxAge: number = 60): this {
    this.res.set('Cache-Control', `private, max-age=${maxAge}`);
    return this;
  }
  
  // 3. NO CACHE: Must revalidate every time
  mustRevalidate(maxAge: number = 0): this {
    this.res.set('Cache-Control', `no-cache, max-age=${maxAge}, must-revalidate`);
    return this;
  }
  
  // 4. NO STORE: Never cache (for sensitive data)
  never(): this {
    this.res.set('Cache-Control', 'no-store');
    return this;
  }
  
  // 5. ETag validation (tiny fingerprint for network validation only)
  etag(data: any): this {
    // Super tiny fingerprint (6 chars) since Redis handles actual data
    const str = JSON.stringify(data);
    const fingerprint = crypto
      .createHash('md5')
      .update(str)
      .digest('base64')
      .slice(0, 6); // Only 6 chars for network validation
    this.res.set('ETag', fingerprint);
    return this;
  }
  
  // 6. Check if client has fresh version (returns 304 if true)
  checkFreshness(req: any): boolean {
    const clientTag = req.headers['if-none-match'];
    const serverTag = this.res.getHeader('ETag');
    return clientTag === serverTag;
  }
  
  // 7. Set Expires header (old but supported)
  expiresAt(date: Date): this {
    this.res.set('Expires', date.toUTCString());
    return this;
  }
  
  // 8. Add revalidation directive (for background updates)
  staleWhileRevalidate(staleSeconds: number): this {
    const current = this.res.getHeader('Cache-Control') as string || '';
    const newDirective = `${current}, stale-while-revalidate=${staleSeconds}`;
    this.res.set('Cache-Control', newDirective);
    return this;
  }
  
  // 9. QUICK PRESETS (for common scenarios)
  static presets = {
    // API Response - Short public cache with validation
    api: (res: Response) => new NetworkCacheManager(res)
      .public(60)
      .mustRevalidate(),
    
    // User Data - Private cache
    user: (res: Response) => new NetworkCacheManager(res)
      .private(300),
    
    // Static Asset - Long cache
    static: (res: Response) => new NetworkCacheManager(res)
      .public(31536000),
    
    // Real-time Data - No cache
    realtime: (res: Response) => new NetworkCacheManager(res)
      .never(),
    
    // Search Results - Short cache with background refresh
    search: (res: Response) => new NetworkCacheManager(res)
      .public(30)
      .staleWhileRevalidate(300),
  };
}
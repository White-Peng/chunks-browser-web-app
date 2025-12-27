/**
 * Blacklist Service - Filter unwanted URLs from browsing history
 * Based on human-ai extension's blacklist implementation
 */

export interface BlacklistRules {
  domains: string[];
  patterns: string[];
}

// Default blacklist configuration
const DEFAULT_BLACKLIST: BlacklistRules = {
  domains: [
    // Browser internal pages
    'chrome-extension://*',
    'chrome://*',
    'about:*',
    'edge://*',
    'brave://*',
    
    // Search engines
    'google.com',
    'www.google.com',
    'bing.com',
    'www.bing.com',
    'duckduckgo.com',
    'baidu.com',
    
    // Social media (often not content-rich for learning)
    'instagram.com',
    'www.instagram.com',
    'facebook.com',
    'www.facebook.com',
    'twitter.com',
    'x.com',
    'tiktok.com',
    'www.tiktok.com',
    
    // Video platforms (URLs alone don't provide content)
    'youtube.com',
    'www.youtube.com',
    'youtu.be',
    
    // Communication tools
    'web.whatsapp.com',
    'discord.com',
    'slack.com',
    'zoom.us',
    'meet.google.com',
    'teams.microsoft.com',
    
    // Email
    'mail.google.com',
    'outlook.live.com',
    'mail.yahoo.com',
    
    // Common login/auth pages
    'accounts.google.com',
    'login.microsoftonline.com',
    'auth0.com',
  ],
  patterns: [
    // Calendar pages
    'calendar.*',
    '*calendar*',
    
    // Mail pages
    'mail.*',
    '*mail*',
    
    // Login/auth pages
    '/login',
    '/signin',
    '/signup',
    '/auth',
    '/oauth',
    '/logout',
    
    // Search pages
    '/search',
    '?q=',
    '?query=',
    
    // Settings pages
    '/settings',
    '/preferences',
    '/account',
    
    // Shopping carts
    '/cart',
    '/checkout',
    
    // Tracking parameters (often redirect pages)
    '*utm_source=*',
    '*utm_campaign=*',
  ],
};

const STORAGE_KEY = 'chunks_blacklist';

class BlacklistService {
  private rules: BlacklistRules;

  constructor() {
    this.rules = { ...DEFAULT_BLACKLIST };
    this.loadFromStorage();
  }

  /**
   * Load custom blacklist rules from localStorage
   */
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const customRules: BlacklistRules = JSON.parse(stored);
        // Merge with default rules
        this.rules.domains = [...new Set([...DEFAULT_BLACKLIST.domains, ...customRules.domains])];
        this.rules.patterns = [...new Set([...DEFAULT_BLACKLIST.patterns, ...customRules.patterns])];
      }
    } catch (error) {
      console.error('Error loading blacklist from storage:', error);
    }
  }

  /**
   * Save custom rules to localStorage
   */
  private saveToStorage(): void {
    try {
      // Only save custom rules (not defaults)
      const customRules: BlacklistRules = {
        domains: this.rules.domains.filter(d => !DEFAULT_BLACKLIST.domains.includes(d)),
        patterns: this.rules.patterns.filter(p => !DEFAULT_BLACKLIST.patterns.includes(p)),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(customRules));
    } catch (error) {
      console.error('Error saving blacklist to storage:', error);
    }
  }

  /**
   * Check if a URL matches any blacklist rule
   */
  matches(url: string): boolean {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();
      const fullUrl = url.toLowerCase();

      // Check domain patterns
      for (const domainPattern of this.rules.domains) {
        if (this.matchDomain(hostname, domainPattern.toLowerCase())) {
          return true;
        }
      }

      // Check URL patterns
      for (const urlPattern of this.rules.patterns) {
        if (this.matchPattern(fullUrl, urlPattern.toLowerCase())) {
          return true;
        }
      }

      return false;
    } catch (error) {
      // If URL is invalid, filter it out
      console.error('Error matching URL:', url, error);
      return true;
    }
  }

  /**
   * Match domain with wildcard support
   */
  private matchDomain(hostname: string, pattern: string): boolean {
    // Exact match
    if (hostname === pattern) {
      return true;
    }

    // Check subdomain match (e.g., "google.com" matches "www.google.com")
    if (hostname.endsWith('.' + pattern)) {
      return true;
    }

    // Wildcard pattern
    if (pattern.includes('*')) {
      const regexPattern = pattern
        .replace(/\./g, '\\.')  // Escape dots
        .replace(/\*/g, '.*');   // Convert * to .*

      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(hostname);
    }

    return false;
  }

  /**
   * Match URL pattern with wildcard support
   */
  private matchPattern(url: string, pattern: string): boolean {
    // Simple contains check if no wildcards
    if (!pattern.includes('*')) {
      return url.includes(pattern);
    }

    // Wildcard pattern
    const regexPattern = pattern
      .replace(/[.+?^${}()|[\]\\]/g, '\\$&')  // Escape special regex chars except *
      .replace(/\*/g, '.*');                    // Convert * to .*

    const regex = new RegExp(regexPattern);
    return regex.test(url);
  }

  /**
   * Filter an array of URLs, removing blacklisted ones
   * Returns { filtered: URL[], removedCount: number, removedUrls: string[] }
   */
  filterUrls(urls: string[]): { 
    filtered: string[]; 
    removedCount: number; 
    removedUrls: string[] 
  } {
    const removedUrls: string[] = [];
    const filtered = urls.filter(url => {
      if (this.matches(url)) {
        removedUrls.push(url);
        return false;
      }
      return true;
    });

    return {
      filtered,
      removedCount: removedUrls.length,
      removedUrls,
    };
  }

  /**
   * Add a domain to blacklist
   */
  addDomain(domain: string): void {
    if (!this.rules.domains.includes(domain)) {
      this.rules.domains.push(domain);
      this.saveToStorage();
    }
  }

  /**
   * Add a pattern to blacklist
   */
  addPattern(pattern: string): void {
    if (!this.rules.patterns.includes(pattern)) {
      this.rules.patterns.push(pattern);
      this.saveToStorage();
    }
  }

  /**
   * Remove a domain from blacklist
   */
  removeDomain(domain: string): void {
    this.rules.domains = this.rules.domains.filter(d => d !== domain);
    this.saveToStorage();
  }

  /**
   * Remove a pattern from blacklist
   */
  removePattern(pattern: string): void {
    this.rules.patterns = this.rules.patterns.filter(p => p !== pattern);
    this.saveToStorage();
  }

  /**
   * Get all blacklist rules
   */
  getRules(): BlacklistRules {
    return { ...this.rules };
  }

  /**
   * Reset to default rules
   */
  resetToDefaults(): void {
    this.rules = { ...DEFAULT_BLACKLIST };
    localStorage.removeItem(STORAGE_KEY);
  }
}

// Export singleton instance
export const blacklistService = new BlacklistService();

// Also export the class for testing
export { BlacklistService };


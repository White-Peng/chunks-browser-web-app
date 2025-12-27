/**
 * Blacklist service for filtering unwanted URLs
 * Based on human-ai extension by adityachivu
 */

class Blacklist {
  constructor() {
    this.rules = {
      // Browser internal pages
      browserInternal: [
        /^chrome:\/\//,
        /^chrome-extension:\/\//,
        /^about:/,
        /^edge:\/\//,
        /^brave:\/\//,
        /^opera:\/\//,
        /^vivaldi:\/\//,
        /^firefox:\/\//,
      ],

      // Search engines
      searchEngines: [
        /google\.(com|[a-z]{2,3})\/search/,
        /bing\.com\/search/,
        /baidu\.com\/s/,
        /duckduckgo\.com\/\?q/,
        /yahoo\.com\/search/,
        /yandex\.(com|ru)\/search/,
        /ecosia\.org\/search/,
      ],

      // Social media
      socialMedia: [
        /facebook\.com/,
        /twitter\.com/,
        /x\.com/,
        /instagram\.com/,
        /tiktok\.com/,
        /linkedin\.com\/feed/,
        /pinterest\.com/,
        /snapchat\.com/,
        /reddit\.com$/,
        /threads\.net/,
      ],

      // Video platforms (main pages, not specific videos)
      videoMainPages: [
        /youtube\.com\/?$/,
        /youtube\.com\/feed/,
        /youtube\.com\/shorts/,
        /vimeo\.com\/?$/,
        /twitch\.tv\/?$/,
      ],

      // Email and communication
      communication: [
        /mail\.google\.com/,
        /outlook\.(live|office)\.com/,
        /web\.whatsapp\.com/,
        /discord\.com/,
        /slack\.com/,
        /zoom\.us/,
        /meet\.google\.com/,
        /teams\.microsoft\.com/,
        /messenger\.com/,
        /telegram\.org/,
      ],

      // Calendar and productivity
      productivity: [
        /calendar\.google\.com/,
        /docs\.google\.com/,
        /drive\.google\.com/,
        /sheets\.google\.com/,
        /slides\.google\.com/,
        /notion\.so/,
        /trello\.com/,
        /asana\.com/,
        /monday\.com/,
      ],

      // Login and authentication pages
      authPages: [
        /\/login/,
        /\/signin/,
        /\/signup/,
        /\/register/,
        /\/auth/,
        /\/oauth/,
        /\/sso/,
        /accounts\.google\.com/,
        /login\.microsoftonline\.com/,
      ],

      // Development and localhost
      development: [
        /localhost/,
        /127\.0\.0\.1/,
        /0\.0\.0\.0/,
        /192\.168\./,
        /10\.\d+\.\d+\.\d+/,
        /github\.com\/?$/,
        /github\.com\/notifications/,
        /github\.com\/settings/,
      ],

      // Shopping carts and checkout
      shopping: [
        /\/cart/,
        /\/checkout/,
        /\/basket/,
        /\/order/,
      ],

      // Tracking and analytics
      tracking: [
        /utm_source=/,
        /utm_medium=/,
        /utm_campaign=/,
        /gclid=/,
        /fbclid=/,
      ],
    };
  }

  /**
   * Check if a URL matches any blacklist rule
   * @param {string} url - URL to check
   * @returns {boolean} - true if URL should be filtered out
   */
  matches(url) {
    if (!url) return true;
    
    const lowerUrl = url.toLowerCase();
    
    // Check all rule categories
    for (const category of Object.values(this.rules)) {
      for (const pattern of category) {
        if (pattern.test(lowerUrl)) {
          return true;
        }
      }
    }
    
    return false;
  }

  /**
   * Filter an array of URLs
   * @param {string[]} urls - Array of URLs to filter
   * @returns {{ filtered: string[], removed: string[] }}
   */
  filterUrls(urls) {
    const filtered = [];
    const removed = [];
    
    for (const url of urls) {
      if (this.matches(url)) {
        removed.push(url);
      } else {
        filtered.push(url);
      }
    }
    
    return { filtered, removed };
  }

  /**
   * Get a human-readable reason for why a URL was filtered
   * @param {string} url - URL to check
   * @returns {string} - Reason for filtering
   */
  getFilterReason(url) {
    if (!url) return 'Empty URL';
    
    const lowerUrl = url.toLowerCase();
    
    const categoryNames = {
      browserInternal: 'Browser internal page',
      searchEngines: 'Search engine',
      socialMedia: 'Social media',
      videoMainPages: 'Video platform main page',
      communication: 'Communication app',
      productivity: 'Productivity app',
      authPages: 'Login/auth page',
      development: 'Development/localhost',
      shopping: 'Shopping cart/checkout',
      tracking: 'Tracking URL',
    };
    
    for (const [categoryKey, patterns] of Object.entries(this.rules)) {
      for (const pattern of patterns) {
        if (pattern.test(lowerUrl)) {
          return categoryNames[categoryKey] || 'Blacklisted';
        }
      }
    }
    
    return 'Unknown';
  }
}

// Export for use in popup.js
window.Blacklist = Blacklist;


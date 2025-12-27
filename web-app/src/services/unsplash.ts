// Unsplash API Service
// API Documentation: https://unsplash.com/documentation

const UNSPLASH_ACCESS_KEY = '9RMdlNYVpmcNenQ2o-uW9vOiUHj7sF33vsLhIgow-CY';
const UNSPLASH_API_URL = 'https://api.unsplash.com';

export interface UnsplashPhoto {
  id: string;
  description: string | null;
  alt_description: string | null;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  user: {
    name: string;
    username: string;
  };
}

interface SearchResult {
  total: number;
  total_pages: number;
  results: UnsplashPhoto[];
}

/**
 * Search for photos on Unsplash
 * @param query - Search keywords (e.g., "artificial intelligence technology")
 * @param perPage - Number of results to return (default: 1)
 * @returns Promise with photo data
 */
export async function searchPhotos(query: string, perPage: number = 1): Promise<UnsplashPhoto[]> {
  try {
    const response = await fetch(
      `${UNSPLASH_API_URL}/search/photos?query=${encodeURIComponent(query)}&per_page=${perPage}&orientation=landscape`,
      {
        headers: {
          'Authorization': `Client-ID ${UNSPLASH_ACCESS_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Unsplash API error: ${response.status} ${response.statusText}`);
    }

    const data: SearchResult = await response.json();
    return data.results;
  } catch (error) {
    console.error('Error searching Unsplash photos:', error);
    throw error;
  }
}

/**
 * Get a single photo URL for a given keyword
 * @param keyword - Search keyword
 * @param size - Image size: 'regular' (1080w), 'small' (400w), 'thumb' (200w)
 * @returns Photo URL or fallback
 */
export async function getPhotoUrl(
  keyword: string, 
  size: 'regular' | 'small' | 'thumb' = 'regular'
): Promise<string> {
  try {
    const photos = await searchPhotos(keyword, 1);
    
    if (photos.length > 0) {
      return photos[0].urls[size];
    }
    
    // Fallback to Unsplash Source if no results
    return getFallbackImage(keyword);
  } catch (error) {
    console.error('Error getting photo URL:', error);
    return getFallbackImage(keyword);
  }
}

/**
 * Get multiple photos for different keywords
 * @param keywords - Array of search keywords
 * @returns Array of photo URLs
 */
export async function getMultiplePhotos(keywords: string[]): Promise<string[]> {
  const results = await Promise.all(
    keywords.map(keyword => getPhotoUrl(keyword))
  );
  return results;
}

/**
 * Fallback image using Unsplash Source (no API limit)
 * Used when API fails or rate limited
 */
export function getFallbackImage(keyword: string, index: number = 0): string {
  const seed = `${keyword}-${index}`;
  return `https://source.unsplash.com/800x600/?${encodeURIComponent(keyword)}&sig=${seed}`;
}

/**
 * Cache for photo URLs to reduce API calls
 */
const photoCache = new Map<string, string>();

/**
 * Get photo URL with caching
 */
export async function getCachedPhotoUrl(
  keyword: string,
  size: 'regular' | 'small' | 'thumb' = 'regular'
): Promise<string> {
  const cacheKey = `${keyword}-${size}`;
  
  if (photoCache.has(cacheKey)) {
    return photoCache.get(cacheKey)!;
  }
  
  const url = await getPhotoUrl(keyword, size);
  photoCache.set(cacheKey, url);
  return url;
}

/**
 * Clear the photo cache
 */
export function clearPhotoCache(): void {
  photoCache.clear();
}


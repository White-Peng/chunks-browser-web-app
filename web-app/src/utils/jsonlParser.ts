/**
 * JSONL (JSON Lines) Parser Utility
 * Parses .jsonl files and extracts URLs from various field names
 */

export interface JsonlParseResult {
  urls: string[];
  totalLines: number;
  validLines: number;
  errors: string[];
}

// Common field names that might contain URLs
const URL_FIELD_NAMES = [
  'url',
  'URL',
  'link',
  'href',
  'uri',
  'URI',
  'page_url',
  'pageUrl',
  'page',
  'source',
  'src',
  'website',
  'site',
];

/**
 * Parse a JSONL file content and extract URLs
 * @param content - The raw content of the JSONL file
 * @returns ParseResult with extracted URLs and metadata
 */
export function parseJsonl(content: string): JsonlParseResult {
  const lines = content.split('\n').filter(line => line.trim() !== '');
  const urls: string[] = [];
  const errors: string[] = [];
  let validLines = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    try {
      const json = JSON.parse(line);
      const extractedUrl = extractUrl(json);
      
      if (extractedUrl) {
        urls.push(extractedUrl);
        validLines++;
      } else {
        errors.push(`Line ${i + 1}: No URL field found`);
      }
    } catch (error) {
      errors.push(`Line ${i + 1}: Invalid JSON - ${error instanceof Error ? error.message : 'Parse error'}`);
    }
  }

  return {
    urls: [...new Set(urls)], // Remove duplicates
    totalLines: lines.length,
    validLines,
    errors,
  };
}

/**
 * Extract URL from a JSON object by checking common field names
 */
function extractUrl(obj: Record<string, unknown>): string | null {
  // First, check common URL field names
  for (const fieldName of URL_FIELD_NAMES) {
    if (obj[fieldName] && typeof obj[fieldName] === 'string') {
      const value = obj[fieldName] as string;
      if (isValidUrl(value)) {
        return value;
      }
    }
  }

  // Check nested objects (one level deep)
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      for (const fieldName of URL_FIELD_NAMES) {
        const nestedValue = (value as Record<string, unknown>)[fieldName];
        if (nestedValue && typeof nestedValue === 'string' && isValidUrl(nestedValue)) {
          return nestedValue;
        }
      }
    }
  }

  // Last resort: find any string value that looks like a URL
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (typeof value === 'string' && isValidUrl(value)) {
      return value;
    }
  }

  return null;
}

/**
 * Check if a string is a valid URL
 */
function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Read and parse a JSONL file from a File object
 */
export async function readJsonlFile(file: File): Promise<JsonlParseResult> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        resolve(parseJsonl(content));
      } else {
        reject(new Error('Failed to read file content'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    
    reader.readAsText(file);
  });
}


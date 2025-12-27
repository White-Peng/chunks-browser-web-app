import type { Story, Chunk } from '@/types';
import { LLMService } from './llm';
import { getCachedPhotoUrl, getFallbackImage } from './unsplash';

// Parse JSON from LLM response (handles markdown code blocks and truncated responses)
function parseJSON<T>(response: string): T {
  let cleaned = response.trim();
  
  // Remove markdown code blocks if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }
  
  // Remove any trailing text after the JSON array
  const lastBracket = cleaned.lastIndexOf(']');
  if (lastBracket !== -1 && lastBracket < cleaned.length - 1) {
    cleaned = cleaned.substring(0, lastBracket + 1);
  }
  
  // Try to parse as-is first
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    console.warn('Initial JSON parse failed, attempting repair...');
  }
  
  // Try to repair truncated JSON
  cleaned = repairTruncatedJSON(cleaned);
  
  return JSON.parse(cleaned);
}

// Attempt to repair truncated JSON array
function repairTruncatedJSON(json: string): string {
  let repaired = json.trim();
  
  // Ensure it starts with [
  if (!repaired.startsWith('[')) {
    const arrayStart = repaired.indexOf('[');
    if (arrayStart !== -1) {
      repaired = repaired.substring(arrayStart);
    } else {
      repaired = '[' + repaired;
    }
  }
  
  // Count brackets and braces
  let bracketCount = 0;
  let braceCount = 0;
  let inString = false;
  let lastGoodIndex = 0;
  
  for (let i = 0; i < repaired.length; i++) {
    const char = repaired[i];
    const prevChar = i > 0 ? repaired[i - 1] : '';
    
    if (char === '"' && prevChar !== '\\') {
      inString = !inString;
    }
    
    if (!inString) {
      if (char === '[') bracketCount++;
      if (char === ']') bracketCount--;
      if (char === '{') braceCount++;
      if (char === '}') {
        braceCount--;
        if (braceCount === 0 && bracketCount === 1) {
          lastGoodIndex = i;
        }
      }
    }
  }
  
  // If we have unclosed structures, try to close them
  if (braceCount > 0 || bracketCount > 0) {
    // Truncate to last complete object
    if (lastGoodIndex > 0) {
      repaired = repaired.substring(0, lastGoodIndex + 1);
    }
    
    // Close any remaining open structures
    while (braceCount > 0) {
      repaired += '}';
      braceCount--;
    }
    
    // Ensure array is closed
    if (!repaired.endsWith(']')) {
      repaired += ']';
    }
  }
  
  console.log('Repaired JSON:', repaired.substring(0, 200) + '...');
  return repaired;
}

/**
 * Fetch image from Unsplash API with fallback
 */
async function getImageForKeywords(keywords: string): Promise<string> {
  try {
    return await getCachedPhotoUrl(keywords);
  } catch (error) {
    console.warn('Failed to fetch from Unsplash API, using fallback:', error);
    return getFallbackImage(keywords);
  }
}

/**
 * Progress callback for tracking generation status
 */
export type GenerationProgressCallback = (progress: {
  phase: 'stories' | 'chunks';
  current: number;
  total: number;
  storyTitle?: string;
}) => void;

/**
 * Generate Stories from browsing history URLs using Deepseek LLM
 */
export async function generateStoriesFromHistory(urls: string[]): Promise<Story[]> {
  const llm = new LLMService();
  
  try {
    const response = await llm.generateStories(urls);
    const parsed = parseJSON<Array<{
      id: number;
      title: string;
      description: string;
      imageKeywords?: string;
      image?: string; // Legacy support
      relatedUrls?: string[];
    }>>(response);
    
    // Fetch images from Unsplash API in parallel
    const storiesWithImages = await Promise.all(
      parsed.map(async (item) => {
        const keywords = item.imageKeywords || item.image || item.title;
        const imageUrl = await getImageForKeywords(keywords);
        
        return {
          id: item.id,
          title: item.title,
          description: item.description,
          image: imageUrl,
          imageKeywords: keywords,
          relatedUrls: item.relatedUrls || [],
          createdAt: new Date(),
        };
      })
    );
    
    return storiesWithImages;
  } catch (error) {
    console.error('Error generating stories:', error);
    throw error;
  }
}

/**
 * Generate Stories with pre-generated Chunks for instant loading
 * This eliminates the delay when users swipe into a story
 */
export async function generateStoriesWithChunks(
  urls: string[],
  onProgress?: GenerationProgressCallback
): Promise<Story[]> {
  const llm = new LLMService();
  
  try {
    // Phase 1: Generate Stories
    onProgress?.({ phase: 'stories', current: 0, total: 1 });
    
    const response = await llm.generateStories(urls);
    const parsed = parseJSON<Array<{
      id: number;
      title: string;
      description: string;
      imageKeywords?: string;
      image?: string;
      relatedUrls?: string[];
    }>>(response);
    
    onProgress?.({ phase: 'stories', current: 1, total: 1 });
    
    // Phase 2: Generate Chunks for each Story (in parallel for speed)
    const totalStories = parsed.length;
    let completedStories = 0;
    
    const storiesWithChunks = await Promise.all(
      parsed.map(async (item) => {
        // Get story image
        const storyKeywords = item.imageKeywords || item.image || item.title;
        const storyImage = await getImageForKeywords(storyKeywords);
        
        const story: Story = {
          id: item.id,
          title: item.title,
          description: item.description,
          image: storyImage,
          imageKeywords: storyKeywords,
          relatedUrls: item.relatedUrls || [],
          createdAt: new Date(),
        };
        
        // Generate chunks for this story
        onProgress?.({ 
          phase: 'chunks', 
          current: completedStories, 
          total: totalStories,
          storyTitle: item.title
        });
        
        try {
          const chunksResponse = await llm.generateChunks(
            story.title,
            story.description,
            story.relatedUrls || [],
            story.imageKeywords
          );
          
          const chunksParsed = parseJSON<Array<{
            id: number;
            title: string;
            content: string;
            imageKeywords?: string;
            image?: string;
          }>>(chunksResponse);
          
          // Get images for chunks
          const chunksWithImages = await Promise.all(
            chunksParsed.map(async (chunk) => {
              const chunkKeywords = chunk.imageKeywords || chunk.image || storyKeywords;
              const chunkImage = await getImageForKeywords(chunkKeywords);
              
              return {
                id: chunk.id,
                title: chunk.title,
                content: chunk.content,
                image: chunkImage,
                imageKeywords: chunkKeywords,
              };
            })
          );
          
          story.chunks = chunksWithImages;
        } catch (error) {
          console.error(`Error generating chunks for story "${story.title}":`, error);
          // Use mock chunks as fallback
          story.chunks = generateMockChunks(story);
        }
        
        completedStories++;
        onProgress?.({ 
          phase: 'chunks', 
          current: completedStories, 
          total: totalStories,
          storyTitle: item.title
        });
        
        return story;
      })
    );
    
    return storiesWithChunks;
  } catch (error) {
    console.error('Error generating stories with chunks:', error);
    throw error;
  }
}

/**
 * Generate Chunks from a Story using Deepseek LLM
 */
export async function generateChunksFromStory(story: Story): Promise<Chunk[]> {
  const llm = new LLMService();
  
  try {
    const response = await llm.generateChunks(
      story.title,
      story.description,
      story.relatedUrls || [],
      story.imageKeywords
    );
    
    const parsed = parseJSON<Array<{
      id: number;
      title: string;
      content: string;
      imageKeywords?: string;
      image?: string; // Legacy support
    }>>(response);
    
    // Fetch unique images for each chunk from Unsplash API in parallel
    const chunksWithImages = await Promise.all(
      parsed.map(async (item) => {
        const keywords = item.imageKeywords || item.image || story.imageKeywords || story.title;
        const imageUrl = await getImageForKeywords(keywords);
        
        return {
          id: item.id,
          title: item.title,
          content: item.content,
          image: imageUrl,
          imageKeywords: keywords,
        };
      })
    );
    
    return chunksWithImages;
  } catch (error) {
    console.error('Error generating chunks:', error);
    throw error;
  }
}

/**
 * Generate a chat response using Deepseek LLM
 */
export async function generateChatResponse(
  userMessage: string,
  storyTitle: string,
  storyDescription: string,
  chunks: Chunk[],
  previousMessages: Array<{ text: string; sender: 'user' | 'bot' }>
): Promise<string> {
  const llm = new LLMService();
  
  try {
    const response = await llm.chat(userMessage, {
      storyTitle,
      storyDescription,
      chunks: chunks.map(c => ({ title: c.title, content: c.content })),
      previousMessages: previousMessages.map((m, i) => ({
        id: i,
        text: m.text,
        sender: m.sender,
        timestamp: new Date(),
      })),
    });
    
    return response;
  } catch (error) {
    console.error('Error generating chat response:', error);
    throw error;
  }
}

/**
 * Generate mock chunks as fallback when LLM fails
 */
export function generateMockChunks(story: Story): Chunk[] {
  const chunkKeywords = [
    'abstract concept idea light bulb',
    'vintage history timeline old',
    'professional expert business meeting',
    'everyday practical real world application',
    'technical detail microscope close up',
  ];
  
  return [
    {
      id: 1,
      title: 'Key Insight #1',
      content: `Discover the fundamental concepts behind ${story.title}. This chunk explores the basics and sets the foundation for deeper understanding.`,
      image: getFallbackImage(chunkKeywords[0]),
      imageKeywords: chunkKeywords[0],
    },
    {
      id: 2,
      title: 'Historical Context',
      content: `Learn about the evolution and background of ${story.title}. Understanding the past helps illuminate the present.`,
      image: getFallbackImage(chunkKeywords[1]),
      imageKeywords: chunkKeywords[1],
    },
    {
      id: 3,
      title: 'Expert Perspective',
      content: `Industry leaders share their insights on ${story.title}. Gain valuable knowledge from those at the forefront.`,
      image: getFallbackImage(chunkKeywords[2]),
      imageKeywords: chunkKeywords[2],
    },
    {
      id: 4,
      title: 'Real-World Application',
      content: `See how ${story.title} manifests in everyday life. Practical examples that bring theory to reality.`,
      image: getFallbackImage(chunkKeywords[3]),
      imageKeywords: chunkKeywords[3],
    },
    {
      id: 5,
      title: 'Deep Dive',
      content: `An in-depth exploration of the most fascinating aspects of ${story.title}. For those who want to go further.`,
      image: getFallbackImage(chunkKeywords[4]),
      imageKeywords: chunkKeywords[4],
    },
  ];
}

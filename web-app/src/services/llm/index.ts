import type { ChatContext } from '@/types';
import { sendToDeepseek } from './deepseek';

export class LLMService {
  /**
   * Generate Stories from browsing history URLs
   */
  async generateStories(urls: string[]): Promise<string> {
    const systemPrompt = `You are a content curator. Based on browsing history URLs, group them into 3-5 thematic stories that represent the user's interests.`;
    
    const userPrompt = `Based on the following browsing history URLs, group them into 3-5 thematic stories.

For each story, provide:
- id: A unique number (1, 2, 3, etc.)
- title: A catchy, engaging title (max 50 characters)
- description: Brief description of the theme (max 100 characters)
- imageKeywords: 2-4 specific English keywords for Unsplash image search that visually represent this story. Be specific and descriptive. Examples:
  - For AI topic: "futuristic robot artificial intelligence"
  - For cooking: "gourmet food kitchen preparation"
  - For travel: "scenic mountain landscape adventure"
  - For tech startup: "modern office technology workspace"
- relatedUrls: Array of URLs from the input that belong to this theme

URLs to analyze:
${urls.map((url, i) => `${i + 1}. ${url}`).join('\n')}

IMPORTANT: Respond ONLY with valid JSON array, no markdown formatting, no code blocks. Example:
[{"id":1,"title":"Tech Innovations","description":"Latest in technology","imageKeywords":"futuristic technology innovation circuit","relatedUrls":["url1","url2"]}]`;

    return sendToDeepseek([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);
  }

  /**
   * Generate Chunks from a Story
   */
  async generateChunks(storyTitle: string, storyDescription: string, relatedUrls: string[], _storyImageKeywords?: string): Promise<string> {
    const systemPrompt = `You are an educational content creator. Create engaging, bite-sized knowledge cards.`;
    
    const userPrompt = `Create 5 engaging "chunks" (bite-sized knowledge cards) for the following topic:

Topic: ${storyTitle}
Description: ${storyDescription}
Related URLs for context: ${relatedUrls.join(', ')}

Each chunk should be educational and provide unique insights. Create exactly 5 chunks with:
- id: Number from 1 to 5
- title: Short, catchy title (max 30 characters)
- content: Educational content that teaches something valuable (100-150 characters)
- imageKeywords: 2-4 specific English keywords for Unsplash image search that visually represent THIS SPECIFIC chunk's content. Each chunk should have UNIQUE keywords that match its specific topic. Be creative and specific:
  - For a core concept chunk: focus on abstract visual metaphors
  - For historical context: vintage, historical imagery
  - For expert insight: professional, academic imagery
  - For real-world application: practical, everyday imagery
  - For deep dive: detailed, close-up, technical imagery

The chunks should follow this progression:
1. Core Concept - Introduce the fundamental idea
2. Historical Context - Background and evolution
3. Expert Insight - What experts say about this
4. Real-World Application - Practical examples
5. Deep Dive - Advanced or fascinating aspect

IMPORTANT: Respond ONLY with valid JSON array, no markdown formatting, no code blocks. Example:
[{"id":1,"title":"Key Insight","content":"The fundamental concept...","imageKeywords":"abstract concept light bulb idea"}]`;

    return sendToDeepseek([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);
  }

  /**
   * Chat with the user about the content they learned
   */
  async chat(userMessage: string, context: ChatContext): Promise<string> {
    const systemPrompt = `You are a helpful learning assistant. The user has just finished reading about "${context.storyTitle}".

Story description: ${context.storyDescription}

The user learned these key points:
${context.chunks.map((c, i) => `${i + 1}. ${c.title}: ${c.content}`).join('\n')}

Your role is to:
1. Help the user reflect on what they learned
2. Answer questions about the topic
3. Provide additional insights when relevant
4. Encourage deeper thinking

Keep responses concise and engaging (max 150 words). Be conversational and supportive.`;

    const conversationHistory = context.previousMessages
      .map(m => `${m.sender === 'user' ? 'User' : 'Assistant'}: ${m.text}`)
      .join('\n');

    const userPrompt = conversationHistory 
      ? `Previous conversation:\n${conversationHistory}\n\nUser: ${userMessage}`
      : userMessage;

    return sendToDeepseek([
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ]);
  }
}

export { sendToDeepseek } from './deepseek';

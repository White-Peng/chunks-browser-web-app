import type { LLMConfig, Story, Chunk, Message } from '@/types';

const STORAGE_KEYS = {
  API_CONFIG: 'chunks_api_config',
  BROWSING_HISTORY: 'chunks_browsing_history',
  GENERATED_STORIES: 'chunks_generated_stories',
  CURRENT_STORY: 'currentStory',
  CURRENT_CHUNKS: 'currentChunks',
  CONSUMED_STORIES: 'consumedStories',
  CHAT_HISTORY: 'chunks_chat_history',
  HAS_STARTED: 'hasStarted',
};

export const storageService = {
  // API Configuration
  getApiConfig(): LLMConfig | null {
    const config = localStorage.getItem(STORAGE_KEYS.API_CONFIG);
    return config ? JSON.parse(config) : null;
  },

  setApiConfig(config: LLMConfig): void {
    localStorage.setItem(STORAGE_KEYS.API_CONFIG, JSON.stringify(config));
  },

  clearApiConfig(): void {
    localStorage.removeItem(STORAGE_KEYS.API_CONFIG);
  },

  // Browsing History
  getBrowsingHistory(): string[] {
    const history = localStorage.getItem(STORAGE_KEYS.BROWSING_HISTORY);
    return history ? JSON.parse(history) : [];
  },

  setBrowsingHistory(urls: string[]): void {
    localStorage.setItem(STORAGE_KEYS.BROWSING_HISTORY, JSON.stringify(urls));
  },

  addBrowsingHistory(urls: string[]): void {
    const existing = this.getBrowsingHistory();
    const combined = [...new Set([...existing, ...urls])];
    this.setBrowsingHistory(combined);
  },

  clearBrowsingHistory(): void {
    localStorage.removeItem(STORAGE_KEYS.BROWSING_HISTORY);
  },

  // Stories
  getStories(): Story[] {
    const stories = localStorage.getItem(STORAGE_KEYS.GENERATED_STORIES);
    return stories ? JSON.parse(stories) : [];
  },

  setStories(stories: Story[]): void {
    localStorage.setItem(STORAGE_KEYS.GENERATED_STORIES, JSON.stringify(stories));
  },

  clearStories(): void {
    localStorage.removeItem(STORAGE_KEYS.GENERATED_STORIES);
  },

  // Current Story (for ChunksPage and ChatbotPage)
  getCurrentStory(): Story | null {
    const story = localStorage.getItem(STORAGE_KEYS.CURRENT_STORY);
    return story ? JSON.parse(story) : null;
  },

  setCurrentStory(story: Story): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_STORY, JSON.stringify(story));
  },

  // Current Chunks
  getCurrentChunks(): Chunk[] {
    const chunks = localStorage.getItem(STORAGE_KEYS.CURRENT_CHUNKS);
    return chunks ? JSON.parse(chunks) : [];
  },

  setCurrentChunks(chunks: Chunk[]): void {
    localStorage.setItem(STORAGE_KEYS.CURRENT_CHUNKS, JSON.stringify(chunks));
  },

  // Consumed Stories
  getConsumedStories(): number[] {
    const consumed = localStorage.getItem(STORAGE_KEYS.CONSUMED_STORIES);
    return consumed ? JSON.parse(consumed) : [];
  },

  addConsumedStory(storyId: number): void {
    const consumed = this.getConsumedStories();
    if (!consumed.includes(storyId)) {
      consumed.push(storyId);
      localStorage.setItem(STORAGE_KEYS.CONSUMED_STORIES, JSON.stringify(consumed));
    }
  },

  clearConsumedStories(): void {
    localStorage.removeItem(STORAGE_KEYS.CONSUMED_STORIES);
  },

  // Chat History (per story)
  getChatHistory(storyId: number): Message[] {
    const allHistory = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
    const historyMap = allHistory ? JSON.parse(allHistory) : {};
    return historyMap[storyId] || [];
  },

  setChatHistory(storyId: number, messages: Message[]): void {
    const allHistory = localStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
    const historyMap = allHistory ? JSON.parse(allHistory) : {};
    historyMap[storyId] = messages;
    localStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, JSON.stringify(historyMap));
  },

  clearChatHistory(): void {
    localStorage.removeItem(STORAGE_KEYS.CHAT_HISTORY);
  },

  // Has Started (onboarding)
  getHasStarted(): boolean {
    return localStorage.getItem(STORAGE_KEYS.HAS_STARTED) === 'true';
  },

  setHasStarted(value: boolean): void {
    localStorage.setItem(STORAGE_KEYS.HAS_STARTED, value.toString());
  },

  // Clear All Data
  clearAll(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  },
};


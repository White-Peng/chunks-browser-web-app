import type { Chunk } from './chunk';

export interface Story {
  id: number;
  title: string;
  description: string;
  image: string;
  imageKeywords?: string; // Keywords for Unsplash image search
  relatedUrls?: string[];
  chunks?: Chunk[]; // Pre-generated chunks for instant loading
  createdAt?: Date;
}


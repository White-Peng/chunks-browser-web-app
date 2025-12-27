export interface Chunk {
  id: number;
  title: string;
  content: string;
  image: string;
  imageKeywords?: string; // Keywords for Unsplash image search
}


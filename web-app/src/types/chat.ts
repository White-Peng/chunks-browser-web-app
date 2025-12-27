export interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export interface ChatContext {
  storyTitle: string;
  storyDescription: string;
  chunks: { title: string; content: string }[];
  previousMessages: Message[];
}

export interface Reference {
  id: number;
  title: string;
  url: string;
  source: string;
}


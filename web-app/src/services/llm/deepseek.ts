// Deepseek API configuration (hardcoded for this app)
const DEEPSEEK_API_KEY = 'sk-7694bfac92304ac38a682d437a382358';
const DEEPSEEK_API_URL = 'https://api.deepseek.com/chat/completions';
const DEEPSEEK_MODEL = 'deepseek-chat';

interface DeepseekMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface DeepseekResponse {
  choices: {
    message: {
      content: string;
    };
  }[];
  error?: {
    message: string;
  };
}

export async function sendToDeepseek(
  messages: DeepseekMessage[]
): Promise<string> {
  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: DEEPSEEK_MODEL,
      messages,
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.json() as DeepseekResponse;
    throw new Error(`Deepseek API error: ${error.error?.message || response.statusText}`);
  }

  const data = await response.json() as DeepseekResponse;
  return data.choices[0].message.content;
}


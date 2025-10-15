export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  token: string;
}

export type ChatbotType = 'nurse' | 'sop';

export interface ChatbotConfig {
  id: ChatbotType;
  name: string;
  description: string;
  available: boolean;
}

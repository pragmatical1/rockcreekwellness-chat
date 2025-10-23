import { ChatbotType } from '../types';

const WEBHOOK_URLS = {
  nurse: import.meta.env.VITE_N8N_WEBHOOK_URL_NURSE || '',
  sop: import.meta.env.VITE_N8N_WEBHOOK_URL_SOP || '',
};

const WEBHOOK_TOKENS = {
  nurse: import.meta.env.VITE_N8N_WEBHOOK_TOKEN || '',
  sop: import.meta.env.VITE_N8N_WEBHOOK_TOKEN_SOP || '',
};

function getOrCreateSessionId(): string {
  const SESSION_KEY = 'nurse_assistant_session_id';
  let sessionId = sessionStorage.getItem(SESSION_KEY);

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }

  return sessionId;
}

export async function sendMessageToWebhook(
  message: string,
  chatbotType: ChatbotType
): Promise<string> {
  const webhookUrl = WEBHOOK_URLS[chatbotType];
  const webhookToken = WEBHOOK_TOKENS[chatbotType];

  if (!webhookUrl) {
    throw new Error('Webhook URL not configured for this chatbot');
  }

  if (!webhookToken) {
    throw new Error('Webhook token not configured for this chatbot');
  }

  const sessionId = getOrCreateSessionId();

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${webhookToken}`,
      'Origin': 'https://chat.rockcreekwellness.com',
    },
    body: JSON.stringify({
      text: message,
      sessionId: sessionId
    }),
  });

  if (response.status === 401) {
    throw new Error('Unauthorized origin or invalid token. Please try logging in again.');
  }

  if (!response.ok) {
    throw new Error('Failed to send message');
  }

  const data = await response.json();
  return data.answer || data.response || data.message || 'Response received';
}

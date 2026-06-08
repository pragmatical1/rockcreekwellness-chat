import type { Config } from '@netlify/functions';
import {
  getBearerToken,
  HttpError,
  jsonResponse,
  verifyGoogleCredential,
} from './_shared/google-auth.mjs';

type ChatbotType = 'nurse' | 'sop';

interface ChatRequest {
  message?: unknown;
  chatbotType?: unknown;
  sessionId?: unknown;
}

const WEBHOOK_CONFIG = {
  nurse: {
    url: 'N8N_WEBHOOK_URL_NURSE',
    token: 'N8N_WEBHOOK_TOKEN_NURSE',
  },
  sop: {
    url: 'N8N_WEBHOOK_URL_SOP',
    token: 'N8N_WEBHOOK_TOKEN_SOP',
  },
} satisfies Record<ChatbotType, { url: string; token: string }>;

function isChatbotType(value: unknown): value is ChatbotType {
  return value === 'nurse' || value === 'sop';
}

function readWebhookConfig(chatbotType: ChatbotType) {
  const keys = WEBHOOK_CONFIG[chatbotType];
  const url = process.env[keys.url];
  const token = process.env[keys.token];

  if (!url || !token) {
    throw new HttpError('Webhook is not configured for this chatbot', 500);
  }

  return { url, token };
}

function normalizeSessionId(value: unknown): string {
  if (typeof value !== 'string' || value.length > 128) {
    return crypto.randomUUID();
  }

  return value;
}

function getAnswerFromWebhookResponse(rawBody: string): string {
  if (!rawBody) {
    return 'Response received';
  }

  try {
    const data = JSON.parse(rawBody) as Record<string, unknown>;
    const answer = data.answer || data.response || data.message;
    if (typeof answer === 'string' && answer.trim()) {
      return answer;
    }
  } catch {
    return rawBody;
  }

  return 'Response received';
}

export default async (request: Request): Promise<Response> => {
  try {
    const credential = getBearerToken(request);
    await verifyGoogleCredential(credential);

    const body = (await request.json()) as ChatRequest;
    const message = typeof body.message === 'string' ? body.message.trim() : '';
    const chatbotType = isChatbotType(body.chatbotType) ? body.chatbotType : 'nurse';

    if (!message) {
      throw new HttpError('Message is required', 400);
    }

    if (message.length > 8000) {
      throw new HttpError('Message is too long', 400);
    }

    const sessionId = normalizeSessionId(body.sessionId);
    const { url, token } = readWebhookConfig(chatbotType);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: message,
        sessionId,
      }),
      signal: AbortSignal.timeout(50_000),
    });

    const responseBody = await response.text();
    if (!response.ok) {
      console.error('n8n webhook request failed', response.status, responseBody.slice(0, 500));
      throw new HttpError('Failed to send message', 502);
    }

    return jsonResponse({ answer: getAnswerFromWebhookResponse(responseBody) });
  } catch (error) {
    if (error instanceof SyntaxError) {
      return jsonResponse({ error: 'Invalid request body' }, 400);
    }

    if (error instanceof HttpError) {
      return jsonResponse({ error: error.message }, error.status);
    }

    if (error instanceof DOMException && error.name === 'TimeoutError') {
      return jsonResponse({ error: 'Chat service timed out' }, 504);
    }

    console.error('Chat request failed', error);
    return jsonResponse({ error: 'Unable to send message' }, 500);
  }
};

export const config: Config = {
  path: '/api/chat',
  method: 'POST',
};

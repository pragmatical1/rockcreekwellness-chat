import {
  getBearerToken,
  HttpError,
  jsonResponse,
  verifyGoogleCredential,
} from './_lib/google-auth.js';

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

const ANSWER_KEYS = ['answer', 'output', 'response', 'message', 'content', 'text'] as const;
const WRAPPER_KEYS = ['data', 'json', 'body', 'result'] as const;
const PRODUCTION_ORIGIN = 'https://chat.rockcreekwellness.com';

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

function findAnswer(value: unknown, depth = 0): string | null {
  if (depth > 5) {
    return null;
  }

  if (typeof value === 'string') {
    const answer = value.trim();
    return answer || null;
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const answer = findAnswer(item, depth + 1);
      if (answer) {
        return answer;
      }
    }
    return null;
  }

  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;

  for (const key of ANSWER_KEYS) {
    if (key in record) {
      const answer = findAnswer(record[key], depth + 1);
      if (answer) {
        return answer;
      }
    }
  }

  for (const key of WRAPPER_KEYS) {
    if (key in record) {
      const answer = findAnswer(record[key], depth + 1);
      if (answer) {
        return answer;
      }
    }
  }

  return null;
}

function getAnswerFromWebhookResponse(rawBody: string): string {
  const trimmedBody = rawBody.trim();
  if (!trimmedBody) {
    throw new HttpError('Chat service returned no response body from n8n', 502);
  }

  try {
    const data = JSON.parse(trimmedBody) as unknown;
    const answer = findAnswer(data);
    if (answer) {
      return answer;
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      return trimmedBody;
    }
    throw error;
  }

  throw new HttpError('Chat service returned an unexpected response', 502);
}

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

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
          Accept: 'application/json, text/plain;q=0.9, */*;q=0.8',
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Origin: PRODUCTION_ORIGIN,
        },
        body: JSON.stringify({
          text: message,
          sessionId,
        }),
        signal: AbortSignal.timeout(50_000),
      });

      const responseBody = await response.text();
      if (!response.ok) {
        console.error('n8n webhook request failed', response.status);
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
  },
};

export const maxDuration = 60;

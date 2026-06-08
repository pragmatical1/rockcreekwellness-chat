import { ChatbotType, GoogleUser } from '../types';

interface AuthResponse {
  user: Omit<GoogleUser, 'token'>;
}

interface ChatResponse {
  answer: string;
}

interface ErrorResponse {
  error?: string;
}

function getOrCreateSessionId(): string {
  const sessionKey = 'nurse_assistant_session_id';
  let sessionId = sessionStorage.getItem(sessionKey);

  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(sessionKey, sessionId);
  }

  return sessionId;
}

async function getErrorMessage(response: Response, fallback: string): Promise<string> {
  try {
    const data = (await response.json()) as ErrorResponse;
    return data.error || fallback;
  } catch {
    return fallback;
  }
}

export async function verifyGoogleCredential(credential: string): Promise<GoogleUser> {
  const response = await fetch('/api/auth', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ credential }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Unable to verify Google sign-in'));
  }

  const data = (await response.json()) as AuthResponse;
  return {
    ...data.user,
    token: credential,
  };
}

export async function sendMessageToWebhook(
  message: string,
  chatbotType: ChatbotType,
  credential: string
): Promise<string> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${credential}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message,
      chatbotType,
      sessionId: getOrCreateSessionId(),
    }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Failed to send message'));
  }

  const data = (await response.json()) as ChatResponse;
  return data.answer || 'Response received';
}

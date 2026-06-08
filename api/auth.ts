import {
  HttpError,
  jsonResponse,
  verifyGoogleCredential,
} from './_lib/google-auth.js';

interface AuthRequest {
  credential?: unknown;
}

export default {
  async fetch(request: Request): Promise<Response> {
    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    try {
      const body = (await request.json()) as AuthRequest;
      if (typeof body.credential !== 'string' || !body.credential) {
        throw new HttpError('Google credential is required', 400);
      }

      const user = await verifyGoogleCredential(body.credential);
      return jsonResponse({ user });
    } catch (error) {
      if (error instanceof SyntaxError) {
        return jsonResponse({ error: 'Invalid request body' }, 400);
      }

      if (error instanceof HttpError) {
        return jsonResponse({ error: error.message }, error.status);
      }

      console.error('Authentication request failed', error);
      return jsonResponse({ error: 'Unable to verify Google sign-in' }, 500);
    }
  },
};

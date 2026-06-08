import { OAuth2Client } from 'google-auth-library';

const STAFF_DOMAIN = 'rockcreekwellness.com';

export interface VerifiedGoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

export class HttpError extends Error {
  constructor(
    message: string,
    readonly status: number
  ) {
    super(message);
  }
}

let googleClient: OAuth2Client | undefined;

export async function verifyGoogleCredential(
  credential: string
): Promise<VerifiedGoogleUser> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    throw new Error('GOOGLE_CLIENT_ID is not configured');
  }

  try {
    googleClient ??= new OAuth2Client(clientId);
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: clientId,
    });
    const payload = ticket.getPayload();
    const email = payload?.email?.toLowerCase();

    if (!payload?.sub || !email || payload.email_verified !== true) {
      throw new HttpError('Google account could not be verified', 401);
    }

    if (payload.hd?.toLowerCase() !== STAFF_DOMAIN || !email.endsWith(`@${STAFF_DOMAIN}`)) {
      throw new HttpError('Access restricted to Rock Creek Wellness staff only', 403);
    }

    return {
      id: payload.sub,
      email,
      name: payload.name || email,
      picture: payload.picture,
    };
  } catch (error) {
    if (error instanceof HttpError) {
      throw error;
    }

    throw new HttpError('Google sign-in has expired or is invalid', 401);
  }
}

export function getBearerToken(request: Request): string {
  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    throw new HttpError('Authentication required', 401);
  }

  const token = authorization.slice('Bearer '.length).trim();
  if (!token) {
    throw new HttpError('Authentication required', 401);
  }

  return token;
}

export function jsonResponse(body: unknown, status = 200): Response {
  return Response.json(body, {
    status,
    headers: {
      'Cache-Control': 'no-store',
    },
  });
}

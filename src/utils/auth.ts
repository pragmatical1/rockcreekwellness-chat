import { GoogleUser } from '../types';

const TOKEN_KEY = 'rcw_google_token';
const USER_KEY = 'rcw_user_data';

export function saveAuthData(credential: string, userData: GoogleUser) {
  localStorage.setItem(TOKEN_KEY, credential);
  localStorage.setItem(USER_KEY, JSON.stringify(userData));
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getUserData(): GoogleUser | null {
  const data = localStorage.getItem(USER_KEY);

  if (!data) {
    return null;
  }

  try {
    return JSON.parse(data) as GoogleUser;
  } catch {
    clearAuthData();
    return null;
  }
}

export function clearAuthData() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

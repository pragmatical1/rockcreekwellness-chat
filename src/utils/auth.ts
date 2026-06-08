const TOKEN_KEY = 'rcw_google_token';
const LEGACY_USER_KEY = 'rcw_user_data';

export function saveAuthData(credential: string) {
  localStorage.setItem(TOKEN_KEY, credential);
  localStorage.removeItem(LEGACY_USER_KEY);
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function clearAuthData() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(LEGACY_USER_KEY);
}

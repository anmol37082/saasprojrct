const ACCESS_TOKEN_KEY = 'saas_access_token';
const REFRESH_TOKEN_KEY = 'saas_refresh_token';

function safeStorage() {
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}

export function getAccessToken() {
  try {
    return safeStorage()?.getItem(ACCESS_TOKEN_KEY) ?? null;
  } catch {
    return null;
  }
}

export function getRefreshToken() {
  try {
    return safeStorage()?.getItem(REFRESH_TOKEN_KEY) ?? null;
  } catch {
    return null;
  }
}

export function setAuthTokens(tokens: { accessToken?: string | null; refreshToken?: string | null }) {
  try {
    const storage = safeStorage();
    if (!storage) return;

    if (tokens.accessToken) storage.setItem(ACCESS_TOKEN_KEY, tokens.accessToken);
    else storage.removeItem(ACCESS_TOKEN_KEY);

    if (tokens.refreshToken) storage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
    else storage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // ignore
  }
}

export function clearAuthTokens() {
  setAuthTokens({ accessToken: null, refreshToken: null });
}


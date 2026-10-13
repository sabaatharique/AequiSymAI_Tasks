import client from './client';

export const ACCESS_TOKEN_KEY = 'access_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';
export const IS_STAFF_KEY = 'is_staff';
export const USER_ID_KEY = 'user_id';

export const decodeJwt = (token) => {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
};

export const getAccessToken = () => localStorage.getItem(ACCESS_TOKEN_KEY);
export const getRefreshToken = () => localStorage.getItem(REFRESH_TOKEN_KEY);

export const hasToken = () => Boolean(getAccessToken());

export const isStaffUser = () => {
  const stored = localStorage.getItem(IS_STAFF_KEY);
  if (stored !== null) {
    return stored === 'true';
  }
  const token = getAccessToken();
  const decoded = decodeJwt(token);
  return Boolean(decoded?.is_staff);
};

export const getCurrentUserId = () => {
  const stored = localStorage.getItem(USER_ID_KEY);
  if (stored) {
    return Number(stored);
  }
  const token = getAccessToken();
  const decoded = decodeJwt(token);
  return decoded?.user_id != null ? Number(decoded.user_id) : null;
};

export const setTokens = (access, refresh, isStaff = null, userId = null) => {
  if (access) {
    localStorage.setItem(ACCESS_TOKEN_KEY, access);
  }
  if (refresh) {
    localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
  }
  if (isStaff !== null) {
    localStorage.setItem(IS_STAFF_KEY, String(Boolean(isStaff)));
  } else if (access) {
    const decoded = decodeJwt(access);
    if (decoded && typeof decoded.is_staff === 'boolean') {
      localStorage.setItem(IS_STAFF_KEY, String(decoded.is_staff));
    }
  }
  if (userId != null) {
    localStorage.setItem(USER_ID_KEY, String(userId));
  } else if (access) {
    const decoded = decodeJwt(access);
    if (decoded && decoded.user_id != null) {
      localStorage.setItem(USER_ID_KEY, String(decoded.user_id));
    }
  }
};

export const clearTokens = () => {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  localStorage.removeItem(IS_STAFF_KEY);
  localStorage.removeItem(USER_ID_KEY);
};

export const login = async (mobile, password) => {
  const response = await client.post('/token/', { mobile, password });
  const { access, refresh, is_staff, user_id } = response.data;
  setTokens(access, refresh, is_staff, user_id);
  return response.data;
};

export const logout = () => {
  clearTokens();
};

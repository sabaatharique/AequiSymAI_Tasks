import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

const client = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

let onAuthFailureCallback = null;
let refreshPromise = null;

export const setOnAuthFailure = (callback) => {
  onAuthFailureCallback = callback;
};

export const notifyAuthFailure = (message = 'Session expired, please log in again.') => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  if (typeof onAuthFailureCallback === 'function') {
    onAuthFailureCallback(message);
  }
};

// Request interceptor: attach bearer token if available
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: auto-refresh access token on 401
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (!error.response || error.response.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    // Do not attempt refresh on login or token refresh endpoints
    const requestUrl = originalRequest.url || '';
    if (
      requestUrl.includes('/token/') ||
      requestUrl.includes('/token/refresh/') ||
      originalRequest._retry
    ) {
      return Promise.reject(error);
    }

    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      notifyAuthFailure('Session expired, please log in again.');
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      if (!refreshPromise) {
        refreshPromise = axios
          .post(`${baseURL.replace(/\/$/, '')}/token/refresh/`, {
            refresh: refreshToken,
          })
          .then((res) => {
            const newAccessToken = res.data.access;
            if (newAccessToken) {
              localStorage.setItem('access_token', newAccessToken);
            }
            if (res.data.refresh) {
              localStorage.setItem('refresh_token', res.data.refresh);
            }
            return newAccessToken;
          })
          .finally(() => {
            refreshPromise = null;
          });
      }

      const newAccessToken = await refreshPromise;
      originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      return client(originalRequest);
    } catch (refreshError) {
      notifyAuthFailure('Session expired, please log in again.');
      return Promise.reject(refreshError);
    }
  }
);

export default client;

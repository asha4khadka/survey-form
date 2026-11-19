import axios from 'axios';

// Base API instance
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// In-memory token storage (avoiding localStorage per specification)
let memoryToken: string | null = null;

// Allow restoring from sessionStorage (tab session only, no persistent localStorage)
export const getAuthToken = (): string | null => {
  if (memoryToken) return memoryToken;
  try {
    memoryToken = sessionStorage.getItem('survey_auth_token');
  } catch {
    // Ignore error
  }
  return memoryToken;
};

export const setAuthToken = (token: string | null): void => {
  memoryToken = token;
  try {
    if (token) {
      sessionStorage.setItem('survey_auth_token', token);
    } else {
      sessionStorage.removeItem('survey_auth_token');
    }
  } catch {
    // Ignore error
  }
};

// Request interceptor: attach Bearer token
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear token if invalid
      setAuthToken(null);
    }
    return Promise.reject(error);
  }
);

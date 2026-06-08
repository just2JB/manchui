import axios from "axios";
import {
  getAccessToken,
  setAccessToken,
  clearAccessToken,
} from "./tokenStorage";

export const serverUrl = import.meta.env.VITE_SERVER_URL ?? "";

/** 백엔드 전용 axios 인스턴스 (baseURL + Bearer 토큰) */
export const apiClient = axios.create({
  baseURL: serverUrl || undefined,
});

let refreshPromise = null;
let onAuthFailure = null;

export function setAuthFailureHandler(handler) {
  onAuthFailure = handler;
}

async function refreshAccessTokenOnce() {
  const { data } = await axios.post(
    `${serverUrl}/api/auth/refresh`,
    {},
    { withCredentials: true },
  );
  const nextToken = data.accessToken || data.token;
  if (!nextToken) {
    throw new Error("No access token in refresh response");
  }
  setAccessToken(nextToken);
  return nextToken;
}

export function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = refreshAccessTokenOnce().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  if (config.withCredentials === undefined) {
    config.withCredentials = true;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const status = error.response?.status;
    const url = original?.url ?? "";

    const isAuthEndpoint =
      url.includes("/api/auth/refresh") ||
      url.includes("/api/auth/login") ||
      url.includes("/api/auth/session") ||
      url.includes("/api/auth/kakao/complete-signup") ||
      url.includes("/api/auth/email/send-code") ||
      url.includes("/api/auth/email/verify-code");

    if (
      !original ||
      original._retry ||
      status !== 401 ||
      isAuthEndpoint
    ) {
      return Promise.reject(error);
    }

    original._retry = true;

    try {
      await refreshAccessToken();
      return apiClient(original);
    } catch (refreshError) {
      clearAccessToken();
      onAuthFailure?.();
      return Promise.reject(refreshError);
    }
  },
);

export default apiClient;

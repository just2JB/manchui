import axios from "axios";

export const serverUrl = import.meta.env.VITE_SERVER_URL ?? "";

/** 백엔드 전용 axios 인스턴스 (baseURL + Bearer 토큰) */
export const apiClient = axios.create({
  baseURL: serverUrl || undefined,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default apiClient;

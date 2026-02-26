import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import axios from "axios";
import "./index.css";
import App from "./App.jsx";

// iOS Safari 등에서 크로스 사이트 쿠키가 막힐 때: localStorage 토큰을 Authorization 헤더로 전달
const serverUrl = import.meta.env.VITE_SERVER_URL;
axios.interceptors.request.use((config) => {
  if (serverUrl && config.url?.startsWith(serverUrl)) {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);

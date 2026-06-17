import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./api/apiClient";
import "./index.css";
import App from "./App.jsx";

if (typeof window !== "undefined") {
  window.history.scrollRestoration = "manual";
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);

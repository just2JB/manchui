import { createContext, useLayoutEffect, useState } from "react";

export const ClubThemeContext = createContext(null);

const STORAGE_KEY = "manchui-assistant-theme";

function readTheme() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch { /* Storage can be unavailable in private browsing. */ }
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
}

export function useClubTheme() {
  const [theme, setTheme] = useState(readTheme);

  useLayoutEffect(() => {
    document.body.dataset.clubTheme = theme;
    try { localStorage.setItem(STORAGE_KEY, theme); } catch { /* Keep the in-memory choice. */ }
    return () => { delete document.body.dataset.clubTheme; };
  }, [theme]);

  return { theme, toggleTheme: () => setTheme((value) => value === "dark" ? "light" : "dark") };
}

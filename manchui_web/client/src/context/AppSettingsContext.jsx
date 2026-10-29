import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from "react";
import { fetchJoinConfig } from "../api/joinConfigApi";
import { serverUrl } from "../api/apiClient";

const defaultJoinConfig = {
  formOpen: true,
  currentGeneration: null,
  siteRestricted: false,
  assistantEnabled: true,
  president: { name: "", contact: "", major: "" },
};

const AppSettingsContext = createContext(null);

export function AppSettingsProvider({ children }) {
  const [joinConfig, setJoinConfig] = useState(defaultJoinConfig);
  const [joinConfigLoading, setJoinConfigLoading] = useState(false);
  const [joinConfigLoaded, setJoinConfigLoaded] = useState(false);
  const loadPromiseRef = useRef(null);

  const ensureJoinConfigLoaded = useCallback(async ({ force = false } = {}) => {
    if (!serverUrl) {
      setJoinConfigLoaded(true);
      return defaultJoinConfig;
    }

    if (!force && joinConfigLoaded) {
      return joinConfig;
    }

    if (!force && loadPromiseRef.current) {
      return loadPromiseRef.current;
    }

    setJoinConfigLoading(true);
    const promise = (async () => {
      try {
        const next = await fetchJoinConfig();
        setJoinConfig(next);
        setJoinConfigLoaded(true);
        return next;
      } catch {
        return null;
      } finally {
        setJoinConfigLoading(false);
        loadPromiseRef.current = null;
      }
    })();

    loadPromiseRef.current = promise;
    return promise;
  }, [joinConfig, joinConfigLoaded]);

  const refreshJoinConfig = useCallback(async () => {
    loadPromiseRef.current = null;
    setJoinConfigLoaded(false);
    return ensureJoinConfigLoaded({ force: true });
  }, [ensureJoinConfigLoaded]);

  const value = useMemo(
    () => ({
      joinConfig,
      joinConfigLoading,
      joinConfigLoaded,
      ensureJoinConfigLoaded,
      refreshJoinConfig,
      siteRestricted: joinConfig.siteRestricted,
      assistantEnabled: joinConfig.assistantEnabled,
    }),
    [
      joinConfig,
      joinConfigLoading,
      joinConfigLoaded,
      ensureJoinConfigLoaded,
      refreshJoinConfig,
    ],
  );

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
}

export function useAppSettings() {
  const ctx = useContext(AppSettingsContext);
  if (!ctx) {
    throw new Error("useAppSettings는 AppSettingsProvider 안에서만 사용할 수 있습니다.");
  }
  return ctx;
}

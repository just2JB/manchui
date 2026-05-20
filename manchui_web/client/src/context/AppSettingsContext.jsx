import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
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
  const [joinConfigLoading, setJoinConfigLoading] = useState(true);

  const refreshJoinConfig = useCallback(async () => {
    if (!serverUrl) {
      setJoinConfigLoading(false);
      return null;
    }
    setJoinConfigLoading(true);
    try {
      const next = await fetchJoinConfig();
      setJoinConfig(next);
      return next;
    } catch {
      return null;
    } finally {
      setJoinConfigLoading(false);
    }
  }, []);

  useEffect(() => {
    void (async () => {
      if (!serverUrl) {
        setJoinConfigLoading(false);
        return;
      }
      setJoinConfigLoading(true);
      try {
        const next = await fetchJoinConfig();
        setJoinConfig(next);
      } catch {
        /* ignore */
      } finally {
        setJoinConfigLoading(false);
      }
    })();
  }, []);

  const value = useMemo(
    () => ({
      joinConfig,
      joinConfigLoading,
      refreshJoinConfig,
      siteRestricted: joinConfig.siteRestricted,
      assistantEnabled: joinConfig.assistantEnabled,
    }),
    [joinConfig, joinConfigLoading, refreshJoinConfig],
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

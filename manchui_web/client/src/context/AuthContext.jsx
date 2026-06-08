import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { fetchSessionUser } from "../api/auth";
import { setAuthFailureHandler, serverUrl } from "../api/apiClient";
import { clearAccessToken } from "../api/tokenStorage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [sessionReady, setSessionReady] = useState(false);

  const verifySession = useCallback(async () => {
    if (!serverUrl) {
      setSessionReady(true);
      return null;
    }
    const u = await fetchSessionUser();
    setUser(u);
    setSessionReady(true);
    return u;
  }, []);

  useEffect(() => {
    void verifySession();
  }, [verifySession]);

  useEffect(() => {
    setAuthFailureHandler(() => {
      setUser(null);
    });
    return () => setAuthFailureHandler(null);
  }, []);

  const logout = useCallback(() => {
    clearAccessToken();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      setUser,
      sessionReady,
      verifySession,
      logout,
    }),
    [user, sessionReady, verifySession, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth는 AuthProvider 안에서만 사용할 수 있습니다.");
  }
  return ctx;
}

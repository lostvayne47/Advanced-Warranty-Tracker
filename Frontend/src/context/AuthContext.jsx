import { createContext, useEffect, useMemo, useState } from "react";
import { appConfig } from "@/config/appConfig";
import { login as loginRequest, signup as signupRequest } from "@/services/authService";
import { clearSession, expireSession, SESSION_EXPIRED_EVENT, setAuthToken } from "@/services/api";
import { getStorageItem } from "@/utils/storage";
import { sessionExpiresAt } from "@/utils/session";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    const onExpired = () => {
      setToken(null);
      setUser(null);
      setSessionExpired(true);
    };
    const restore = () => {
      const savedToken = getStorageItem(appConfig.storageKeys.token);
      const savedUser = getStorageItem(appConfig.storageKeys.user);
      if (savedToken && savedUser && sessionExpiresAt(savedToken, !appConfig.apiBaseUrl) > Date.now()) {
        setToken(savedToken);
        setUser(savedUser);
        setAuthToken(savedToken);
        setSessionExpired(false);
      } else {
        clearSession();
        setToken(null);
        setUser(null);
        if (savedToken) setSessionExpired(true);
      }
    };
    const syncStorage = (event) => {
      if (event.key === null || [appConfig.storageKeys.token, appConfig.storageKeys.user].includes(event.key)) restore();
    };
    window.addEventListener(SESSION_EXPIRED_EVENT, onExpired);
    window.addEventListener("storage", syncStorage);
    restore();
    setIsBootstrapping(false);
    return () => {
      window.removeEventListener(SESSION_EXPIRED_EVENT, onExpired);
      window.removeEventListener("storage", syncStorage);
    };
  }, []);

  useEffect(() => {
    if (!token) return;
    const expiresAt = sessionExpiresAt(token, !appConfig.apiBaseUrl);
    if (!Number.isFinite(expiresAt)) return;
    const check = () => {
      if (Date.now() >= expiresAt) expireSession();
    };
    const timer = window.setTimeout(check, Math.max(0, Math.min(expiresAt - Date.now(), 2147483647)));
    window.addEventListener("focus", check);
    document.addEventListener("visibilitychange", check);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("focus", check);
      document.removeEventListener("visibilitychange", check);
    };
  }, [token]);

  const value = useMemo(() => ({
    user, token, sessionExpired, isAuthenticated: Boolean(token), isBootstrapping,
    async login(values) {
      const session = await loginRequest(values);
      setToken(session.token);
      setUser(session.user);
      setSessionExpired(false);
    },
    async signup(values) {
      const session = await signupRequest(values);
      setToken(session.token);
      setUser(session.user);
      setSessionExpired(false);
    },
    logout() {
      clearSession();
      setToken(null);
      setUser(null);
      setSessionExpired(false);
    },
  }), [isBootstrapping, token, user, sessionExpired]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

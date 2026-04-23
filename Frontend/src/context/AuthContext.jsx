import { createContext, useEffect, useMemo, useState } from "react";
import { appConfig } from "@/config/appConfig";
import { login as loginRequest, signup as signupRequest } from "@/services/authService";
import { setAuthToken } from "@/services/api";
import { getStorageItem, removeStorageItem } from "@/utils/storage";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  useEffect(() => {
    const storedToken = getStorageItem(appConfig.storageKeys.token);
    const storedUser = getStorageItem(appConfig.storageKeys.user);

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(storedUser);
      setAuthToken(storedToken);
    }

    setIsBootstrapping(false);
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: Boolean(token),
      isBootstrapping,
      async login(values) {
        const session = await loginRequest(values);
        setToken(session.token);
        setUser(session.user);
      },
      async signup(values) {
        const session = await signupRequest(values);
        setToken(session.token);
        setUser(session.user);
      },
      logout() {
        removeStorageItem(appConfig.storageKeys.token);
        removeStorageItem(appConfig.storageKeys.user);
        setAuthToken(null);
        setToken(null);
        setUser(null);
      },
    }),
    [isBootstrapping, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

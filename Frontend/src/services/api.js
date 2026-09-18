import axios from "axios";
import { appConfig } from "@/config/appConfig";
import { removeStorageItem, setStorageItem } from "@/utils/storage";

const api = axios.create({
  baseURL: appConfig.apiBaseUrl || undefined,
  timeout: 45000,
  headers: {
    "Content-Type": "application/json",
  },
});

export const SESSION_EXPIRED_EVENT = "warranty-tracker:session-expired";

export function clearSession() {
  removeStorageItem(appConfig.storageKeys.token);
  removeStorageItem(appConfig.storageKeys.user);
  setAuthToken(null);
}

export function expireSession() {
  clearSession();
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
}

export function setAuthToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const currentAuthorization = api.defaults.headers.common.Authorization;
    const sentAuthorization = error.config?.headers?.Authorization;
    if (error.response?.status === 401 && !error.config?.skipSessionExpiry &&
        currentAuthorization && sentAuthorization === currentAuthorization) {
      expireSession();
    }

    return Promise.reject(error);
  },
);

export function persistSession(session) {
  setStorageItem(appConfig.storageKeys.token, session.token);
  setStorageItem(appConfig.storageKeys.user, session.user);
  setAuthToken(session.token);
}

export default api;

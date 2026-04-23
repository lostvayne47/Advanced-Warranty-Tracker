import axios from "axios";
import { appConfig } from "@/config/appConfig";
import { removeStorageItem, setStorageItem } from "@/utils/storage";

const api = axios.create({
  baseURL: appConfig.apiBaseUrl || undefined,
  headers: {
    "Content-Type": "application/json",
  },
});

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
    if (error.response?.status === 401) {
      removeStorageItem(appConfig.storageKeys.token);
      removeStorageItem(appConfig.storageKeys.user);
      setAuthToken(null);
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

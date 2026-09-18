import api, { persistSession } from "@/services/api";
import { appConfig } from "@/config/appConfig";
import { mockUser } from "@/data/mockData";

function createDemoSession(values) {
  return {
    token: "demo-jwt-token",
    user: {
      ...mockUser,
      name: values.name?.trim() || mockUser.name,
      email: values.email,
    },
  };
}

export async function login(values) {
  if (!appConfig.apiBaseUrl) {
    const session = createDemoSession(values);
    persistSession(session);
    return session;
  }

  const { data } = await api.post("/auth/login", values, {
    skipSessionExpiry: true, headers: { Authorization: undefined },
  });
  persistSession(data);
  return data;
}

export async function signup(values) {
  if (!appConfig.apiBaseUrl) {
    const session = createDemoSession(values);
    persistSession(session);
    return session;
  }

  const { data } = await api.post("/auth/signup", values, {
    skipSessionExpiry: true, headers: { Authorization: undefined },
  });
  persistSession(data);
  return data;
}

export function beginGoogleSignIn() {
  if (!appConfig.apiBaseUrl) {
    throw new Error("Google sign-in will be available after the Spring Boot API is configured.");
  }

  window.location.assign(`${appConfig.apiBaseUrl}/auth/google/start?purpose=signin`);
}

export function beginGmailConnection() {
  if (!appConfig.apiBaseUrl) {
    throw new Error("Gmail connection will be available after the Spring Boot API is configured.");
  }

  window.location.assign(`${appConfig.apiBaseUrl}/gmail/connect`);
}

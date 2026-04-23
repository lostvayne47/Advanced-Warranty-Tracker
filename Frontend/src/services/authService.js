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

  const { data } = await api.post("/auth/login", values);
  persistSession(data);
  return data;
}

export async function signup(values) {
  if (!appConfig.apiBaseUrl) {
    const session = createDemoSession(values);
    persistSession(session);
    return session;
  }

  const { data } = await api.post("/auth/signup", values);
  persistSession(data);
  return data;
}

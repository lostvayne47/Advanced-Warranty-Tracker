export const appConfig = {
  appName: "Warranty Tracker",
  apiBaseUrl: import.meta.env.VITE_API_URL?.trim() || "",
  storageKeys: {
    token: "warranty-tracker-token",
    user: "warranty-tracker-user",
    warranties: "warranty-tracker-items",
  },
};

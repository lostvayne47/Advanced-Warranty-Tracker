export function getApiError(error, fallback = "Something went wrong. Please try again.") {
  const status = error.response?.status;
  const serverMessage = error.response?.data?.message;
  if (status === 401) return serverMessage || "Your session has expired. Please sign in again.";
  if (status === 409) return serverMessage || "This item changed. Reload it before saving again.";
  if (status === 413) return "The invoice is too large. Choose an image up to 10 MB.";
  if (typeof serverMessage === "string" && serverMessage.trim()) return serverMessage;
  if (status === 503) return "The service is temporarily unavailable. Please try again shortly.";
  if (error.code === "ECONNABORTED") return "The request timed out. Check your connection and try again.";
  if (error.request && !error.response) return "Cannot reach the server. Check your connection and try again.";
  return fallback;
}

export function getFieldErrors(error) {
  const errors = error.response?.data?.errors;
  if (!errors || typeof errors !== "object" || Array.isArray(errors)) return {};
  return Object.fromEntries(Object.entries(errors)
    .filter(([, value]) => typeof value === "string")
    .map(([field, message]) => [field === "invoiceImage" ? "file" : field, message]));
}
